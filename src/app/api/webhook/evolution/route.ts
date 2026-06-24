import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueAnalysis } from "@/lib/queue";
import { transcribeAudio, analyzeImage } from "@/lib/ai";
import axios from "axios";

// دالة فحص الكلمات الدلالية لنقاط العميل (Lead Scoring)
function calculateLeadScoreDelta(text: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();

  // الاستفسار عن السعر
  if (/السعر|بكم|بكام|كم السعر|سعر|السعر كم|سعر المنتج|كم سعر/i.test(lowerText)) {
    score += 15;
  }
  // طرق الدفع والحسابات
  if (/طريقة الدفع|كيف ادفع|رقم الحساب|التحويل|حسابكم|حساب البنك|طريقة التحويل|الدفع/i.test(lowerText)) {
    score += 20;
  }
  // إثبات الدفع والتحويل
  if (/تم الدفع|حولت|دفعت|الفاتورة|الوصل|تم التحويل|إثبات الدفع|اثبات الدفع/i.test(lowerText)) {
    score += 50;
  }
  // الاعتراض على السعر
  if (/غالي|مرتفع|السعر مرتفع|خصم|تخفيض|ارخص|خصومات/i.test(lowerText)) {
    score -= 15;
  }

  return score;
}

// دالة فحص الكلمات المفتاحية العاجلة لتخطي الانتظار
function isUrgentMessage(text: string, type: string): boolean {
  if (type === "image" || type === "audio") return true; // الصور والتسجيلات يفضل تحليلها فوراً
  const lowerText = text.toLowerCase();
  return /تم الدفع|حولت|دفعت|تم التحويل|إثبات الدفع|اثبات الدفع/i.test(lowerText);
}

// دالة تحميل وسائط الرسائل وتحويلها إلى Base64 من Evolution API
async function fetchMediaFromEvolution(
  instanceName: string,
  key: any
): Promise<{ buffer: Buffer; mimetype: string } | null> {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_API_KEY;

  if (!apiUrl || !apiKey || !instanceName) {
    console.warn("⚠️ Evolution API configurations are missing in .env. Skipping media download.");
    return null;
  }

  try {
    const response = await axios.post(
      `${apiUrl}/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        message: { key },
        convertTomp4: false,
      },
      {
        headers: {
          apikey: apiKey,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    if (response.data && response.data.base64) {
      let base64Str = response.data.base64;
      let mimetype = "application/octet-stream";

      if (base64Str.startsWith("data:")) {
        const parts = base64Str.split(",");
        mimetype = parts[0].split(";")[0].split(":")[1];
        base64Str = parts[1];
      }

      const buffer = Buffer.from(base64Str, "base64");
      return { buffer, mimetype };
    }

    return null;
  } catch (error) {
    console.error("❌ Error downloading media from Evolution API:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. التحقق من أمن الـ Webhook
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const configToken = process.env.WEBHOOK_TOKEN;

    if (configToken && token !== configToken) {
      console.warn("🔒 Unauthorized Webhook access attempt.");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const event = body.event || "";

    // معالجة حدث رسالة جديدة فقط
    if (event !== "messages.upsert") {
      return NextResponse.json({ status: "ignored", event });
    }

    const instanceName = body.instance;
    const messageData = body.data;
    if (!messageData || !messageData.key) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    const key = messageData.key;
    const remoteJid = key.remoteJid;
    const fromMe = key.fromMe === true;
    const id = key.id;

    // استخراج رقم هاتف العميل
    const phone = remoteJid.split("@")[0];
    const pushName = messageData.pushName || `عميل ${phone.substring(phone.length - 4)}`;
    const timestamp = messageData.messageTimestamp
      ? new Date(messageData.messageTimestamp * 1000)
      : new Date();

    const direction = fromMe ? "OUT" : "IN";
    let messageType = "text";
    let content = "";
    let mediaUrl = null;

    // التعرف على نوع الرسالة
    const msgObj = messageData.message || {};
    const type = messageData.messageType || "conversation";

    if (type === "conversation" || type === "extendedTextMessage") {
      messageType = "text";
      content = msgObj.conversation || msgObj.extendedTextMessage?.text || "";
    } else if (type === "imageMessage") {
      messageType = "image";
      content = msgObj.imageMessage?.caption || "صورة";
      mediaUrl = msgObj.imageMessage?.url || null;
    } else if (type === "audioMessage") {
      messageType = "audio";
      content = "[رسالة صوتية]";
      mediaUrl = msgObj.audioMessage?.url || null;
    } else if (type === "documentMessage" || type === "documentWithCaptionMessage") {
      messageType = "document";
      const doc = msgObj.documentMessage || msgObj.documentWithCaptionMessage?.message?.documentMessage || {};
      content = doc.fileName || doc.caption || "مستند";
      mediaUrl = doc.url || null;
    } else {
      // أنواع أخرى غير مدعومة بشكل افتراضي
      messageType = "text";
      content = `[رسالة من نوع غير مدعوم: ${type}]`;
    }

    // 2. إدارة العميل في قاعدة البيانات (إيجاد أو إنشاء)
    let customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone,
          name: direction === "IN" ? pushName : "عميل جديد",
          status: "New Lead",
          leadScore: direction === "IN" ? calculateLeadScoreDelta(content) : 0,
        },
      });
      // إنشاء ذاكرة فارغة للعميل الجديد
      await prisma.customerMemory.create({
        data: {
          customerId: customer.id,
          summary: "عميل جديد تم تسجيله في النظام.",
          interests: "",
          objections: "",
          purchaseHistory: "",
        },
      });
    } else {
      // تحديث نقاط العميل بناءً على الرسالة الجديدة الواردة
      if (direction === "IN") {
        const delta = calculateLeadScoreDelta(content);
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            leadScore: {
              increment: delta,
            },
            lastContactDate: new Date(),
          },
        });
      } else {
        // تحديث تاريخ آخر اتصال إذا كانت الرسالة منا
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            lastContactDate: new Date(),
          },
        });
      }
    }

    // 3. تنزيل الوسائط وتحليلها باستخدام OpenAI إذا كان ذلك متاحاً
    if (direction === "IN" || true) { // نقوم بالتنزيل والتحليل للجهتين للمحافظة على السياق
      if (messageType === "audio") {
        const media = await fetchMediaFromEvolution(instanceName, key);
        if (media) {
          const transcription = await transcribeAudio(media.buffer, media.mimetype);
          content = `[رسالة صوتية مفرغة]: ${transcription}`;
        }
      } else if (messageType === "image") {
        const media = await fetchMediaFromEvolution(instanceName, key);
        if (media) {
          const description = await analyzeImage(media.buffer, media.mimetype);
          const caption = msgObj.imageMessage?.caption ? `الكابشن: ${msgObj.imageMessage.caption}\n` : "";
          content = `[صورة] \n${caption}تحليل الذكاء الاصطناعي لمحتوى الصورة:\n${description}`;
        }
      }
    }

    // 4. حفظ الرسالة في قاعدة البيانات
    await prisma.message.create({
      data: {
        id,
        customerId: customer.id,
        direction,
        messageType,
        content,
        mediaUrl,
        timestamp,
      },
    });

    // 5. جدولة معالجة الذكاء الاصطناعي (Debouncing & Queue)
    // نحدد ما إذا كانت الرسالة عاجلة لتخطي مؤقت الـ 45 ثانية
    const urgent = direction === "IN" && isUrgentMessage(content, messageType);
    await enqueueAnalysis(customer.id, urgent);

    return NextResponse.json({
      status: "success",
      messageId: id,
      enqueued: true,
      urgent,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}
