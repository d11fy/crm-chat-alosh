import OpenAI from "openai";
import { prisma } from "./prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// التفريغ الصوتي باستخدام Whisper
export async function transcribeAudio(audioBuffer: Buffer, mimetype: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY is not defined. Skipping audio transcription.");
    return "[رسالة صوتية غير مفرغة - لم يتم إعداد OpenAI]";
  }

  try {
    // تحديد امتداد الملف بناءً على mimetype
    let filename = "audio.mp3";
    if (mimetype.includes("ogg") || mimetype.includes("opus")) {
      filename = "audio.ogg";
    } else if (mimetype.includes("wav")) {
      filename = "audio.wav";
    } else if (mimetype.includes("aac")) {
      filename = "audio.aac";
    } else if (mimetype.includes("m4a")) {
      filename = "audio.m4a";
    }

    const file = await OpenAI.toFile(audioBuffer, filename, { type: mimetype });
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "ar", // تحديد اللغة العربية للتفريغ
    });

    return response.text;
  } catch (error) {
    console.error("❌ Error transcribing audio with Whisper:", error);
    return `[فشل تفريغ الرسالة الصوتية: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

// تحليل الصور باستخدام GPT-4o Vision
export async function analyzeImage(imageBuffer: Buffer, mimetype: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY is not defined. Skipping image analysis.");
    return "[صورة غير محللة - لم يتم إعداد OpenAI]";
  }

  try {
    const base64 = imageBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "صف محتوى هذه الصورة بالكامل باللغة العربية بالتفصيل. إذا كانت الصورة عبارة عن إيصال تحويل بنكي أو إثبات دفع، استخرج منها النصوص المهمة مثل: اسم المحوِّل، اسم المستلم، المبلغ، العملة، تاريخ التحويل، وحالة المعاملة إن وجدت.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimetype};base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 600,
    });

    return response.choices[0]?.message?.content || "[لا يوجد وصف للصورة]";
  } catch (error) {
    console.error("❌ Error analyzing image with GPT-4o:", error);
    return `[فشل تحليل الصورة: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

// تحليل سجل المحادثة وتحديث ذاكرة العميل
export interface AiAnalysisResult {
  clientName?: string;
  status: string;
  purchaseProbability: number;
  productsInterested: string[];
  objections: string;
  nextAction: string;
  followUpDate: string | null;
  summary: string;
  suggestedReply: string;
  memory: {
    summary: string;
    interests: string;
    objections: string;
    purchaseHistory: string;
  };
  detectedSale: {
    isDetected: boolean;
    productName?: string;
    amount?: number;
  };
}

export async function analyzeCustomerConversation(
  customerId: string,
  currentLeadScore: number
): Promise<AiAnalysisResult | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY is not defined. Skipping customer AI analysis.");
    return null;
  }

  try {
    // 1. جلب بيانات العميل والذاكرة والرسائل غير المحللة
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        memory: true,
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!customer) {
      console.error(`❌ Customer with ID ${customerId} not found for AI analysis.`);
      return null;
    }

    // جلب آخر تاريخ تحليل
    const lastAnalysisDate = customer.memory?.lastAiUpdate || new Date(0);

    // تصفية الرسائل الجديدة المضافة بعد آخر تحديث للذكاء الاصطناعي
    const newMessages = customer.messages.filter(
      (msg) => msg.timestamp.getTime() > lastAnalysisDate.getTime()
    );

    // إذا لم يكن هناك رسائل جديدة، لا حاجة للتحليل لتوفير التكلفة
    if (newMessages.length === 0 && customer.memory) {
      console.log(`ℹ️ No new messages since last analysis for customer: ${customer.phone}`);
      return null;
    }

    // تجهيز سياق الذاكرة الحالية للعميل
    const memoryContext = {
      summary: customer.memory?.summary || "لا يوجد ملخص سابق.",
      interests: customer.memory?.interests || "لا توجد اهتمامات مسجلة.",
      objections: customer.memory?.objections || "لا توجد اعتراضات مسجلة.",
      purchaseHistory: customer.memory?.purchaseHistory || "لا يوجد سجل مشتريات سابق.",
    };

    // تجهيز الرسائل الجديدة كـ نص للمحادثة
    const chatHistory = newMessages
      .map((msg) => {
        const roleName = msg.direction === "IN" ? "العميل" : "المبيعات (نحن)";
        const typeLabel = msg.messageType !== "text" ? `[نوع الرسالة: ${msg.messageType}] ` : "";
        return `${roleName}: ${typeLabel}${msg.content} (${msg.timestamp.toISOString()})`;
      })
      .join("\n");

    // جلب تعليمات تدريب وتوجيه الذكاء الاصطناعي لـ علوش ستور
    const trainingRules = await prisma.aiTraining.findUnique({
      where: { key: "store_rules" }
    });
    const storeInstructions = trainingRules?.content || "أنت تحلل وتصيغ الردود بالنيابة عن متجر علوش ستور المتخصص بالاشتراكات الرقمية. العملة الرسمية هي الشيكل.";

    const systemPrompt = `أنت خبير مبيعات ومحلل عملاء ذكي لنظام "AI WhatsApp Sales CRM" الخاص بمتجر "علوش ستور".
مهمتك هي تحليل المحادثة الأخيرة للعميل وتحديث ملفه الشخصي وذاكرته التراكمية وتحديد الخطوة القادمة وحالته الحالية ونقاط جودته وفقاً لتعليمات وتدريب المتجر المحددة بالأسفل.

---
تعليمات تدريب وتوجيه المتجر (Alosh Store Training Rules):
${storeInstructions}
---

تلقيت البيانات التالية:
1. ذاكرة العميل الحالية:
   - الملخص التراكمي: ${memoryContext.summary}
   - المنتجات المهتم بها: ${memoryContext.interests}
   - الاعتراضات والمخاوف: ${memoryContext.objections}
   - سجل المشتريات السابقة: ${memoryContext.purchaseHistory}

2. الرسائل الجديدة منذ آخر تحليل للذكاء الاصطناعي:
${chatHistory || "لا توجد رسائل جديدة."}

3. النقاط الأولية للعميل المحسوبة تلقائياً: ${currentLeadScore}.

عليك إرجاع إجابة بصيغة JSON مطابقة تماماً للمواصفات التالية وبدون أي نصوص إضافية خارج الـ JSON:
{
  "clientName": "اسم العميل المستخلص (إذا وجد، وإلا اترك الحقل فارغاً أو اكتب الاسم الحالي)",
  "status": "New Lead | Interested | Hot Lead | Follow Up Later | Customer | Lost Customer",
  "purchaseProbability": 80, 
  "productsInterested": ["اسم المنتج 1", "اسم المنتج 2"], 
  "objections": "الاعتراضات أو أسباب التردد الحالية بالتفصيل باللغة العربية",
  "nextAction": "الخطوة القادمة المقترحة مع العميل باللغة العربية (مثال: إرسال رابط الدفع، توضيح الضمان)",
  "followUpDate": "2026-06-25T12:00:00.000Z", // موعد المتابعة المقترح بصيغة ISO تاريخ ووقت، أو null
  "summary": "ملخص المحادثة الأخيرة فقط في جملتين باللغة العربية",
  "suggestedReply": "رد ذكي ومقترح باللغة العربية ليقوم موظف المبيعات بنسخه وإرساله للعميل بناءً على حالة المحادثة واحتياج العميل",
  "memory": {
    "summary": "تحديث الملخص التراكمي الشامل لملف العميل بالكامل باللغة العربية (ادمج الذاكرة القديمة مع ما استجد في المحادثة الأخيرة)",
    "interests": "تحديث قائمة الاهتمامات التراكمية للعميل باللغة العربية",
    "objections": "تحديث قائمة الاعتراضات والمخاوف التراكمية للعميل باللغة العربية",
    "purchaseHistory": "تحديث سجل المشتريات الفعلي للعميل باللغة العربية"
  },
  "detectedSale": {
    "isDetected": false, // هل تشير المحادثة الأخيرة أو الصورة المرفقة إلى إتمام الدفع أو إرسال إيصال تحويل حقيقي؟
    "productName": "اسم المنتج المباع (إن وجد)",
    "amount": 150.0 // قيمة الصفقة كـ رقم عشري أو صحيح (إن وجد)
  }
}

ملاحظات هامة جداً:
1. حافظ على الموضوعية. إذا لم يقم العميل بالدفع أو إرسال إثبات دفع حقيقي، لا تجعل detectedSale.isDetected مساوياً لـ true.
2. إذا تم كشف إتمام البيع (detectedSale.isDetected = true)، يجب أن تكون الحالة الجديدة (status) هي "Customer".
3. صغ الرد المقترح (suggestedReply) بلهجة ودية، مهنية ومقنعة باللغة العربية، ومباشرة ومناسبة لسياق الرسالة الأخيرة للعميل لتشجيع العميل على إتمام الصفقة أو معالجة مخاوفه.
4. يجب أن تكون مخرجاتك عبارة عن كائن JSON صالح فقط، لا تضع علامات \`\`\`json أو أي نصوص تشريحية قبل أو بعد كود الـ JSON.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsedResult = JSON.parse(content) as AiAnalysisResult;
    return parsedResult;
  } catch (error) {
    console.error("❌ Error running customer AI analysis:", error);
    return null;
  }
}
