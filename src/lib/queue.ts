import { prisma } from "./prisma";
import { analyzeCustomerConversation } from "./ai";

// خريطة لتخزين المؤقتات النشطة في الذاكرة لمنع تكرار المعالجة
const activeTimers = new Map<string, NodeJS.Timeout>();

/**
 * معالجة التحليل الذكي للعميل وحفظ النتائج في قاعدة البيانات
 */
export async function processCustomerAnalysis(customerId: string): Promise<boolean> {
  console.log(`🤖 Starting AI analysis for customer: ${customerId}`);
  
  try {
    // 1. جلب بيانات العميل الحالية
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { memory: true },
    });

    if (!customer) {
      console.error(`❌ Customer ${customerId} not found for queue processing.`);
      return false;
    }

    // 2. تحديث حالة المعالجة في قاعدة البيانات
    await prisma.analysisQueue.upsert({
      where: { customerId },
      update: { isProcessing: true },
      create: {
        customerId,
        scheduledFor: new Date(),
        isProcessing: true,
      },
    });

    // 3. استدعاء OpenAI لتحليل المحادثة
    const analysisResult = await analyzeCustomerConversation(customerId, customer.leadScore);

    if (!analysisResult) {
      console.log(`ℹ️ No analysis update generated for customer: ${customer.phone}`);
      // حذف العميل من طابور المعالجة
      await prisma.analysisQueue.delete({ where: { customerId } }).catch(() => {});
      return false;
    }

    // 4. معالجة وتعديل البيانات وحفظها في قاعدة البيانات
    const oldStatus = customer.status;
    const newStatus = analysisResult.status;

    // استخراج النقاط من الذكاء الاصطناعي ودمجها مع النقاط الحالية
    // سنقوم بتحديث النقاط بناءً على احتمالية الشراء وتقدير الـ AI
    let finalLeadScore = customer.leadScore;
    
    // تعديل النقاط بناءً على تغيير الحالة تلقائياً
    if (newStatus === "Hot Lead") finalLeadScore = Math.max(finalLeadScore, 70);
    else if (newStatus === "Interested") finalLeadScore = Math.max(finalLeadScore, 40);
    else if (newStatus === "Customer") finalLeadScore = Math.max(finalLeadScore, 100);

    // استخدام المعاملات (Prisma Transaction) لضمان اتساق البيانات
    await prisma.$transaction(async (tx) => {
      // أ. تحديث ذاكرة العميل
      await tx.customerMemory.upsert({
        where: { customerId },
        update: {
          summary: analysisResult.memory.summary,
          interests: analysisResult.memory.interests,
          objections: analysisResult.memory.objections,
          purchaseHistory: analysisResult.memory.purchaseHistory,
          lastAiUpdate: new Date(),
        },
        create: {
          customerId,
          summary: analysisResult.memory.summary,
          interests: analysisResult.memory.interests,
          objections: analysisResult.memory.objections,
          purchaseHistory: analysisResult.memory.purchaseHistory,
          lastAiUpdate: new Date(),
        },
      });

      // ب. إضافة مبيعات تلقائية إذا تم كشف عملية بيع
      if (analysisResult.detectedSale?.isDetected) {
        const productName = analysisResult.detectedSale.productName || "منتج غير محدد";
        const saleAmount = analysisResult.detectedSale.amount || 0;

        await tx.sale.create({
          data: {
            customerId,
            productName,
            saleAmount,
            isDetected: true,
            saleDate: new Date(),
          },
        });
      }

      // ج. إضافة سجل أحداث الذكاء الاصطناعي في حال تغير حالة العميل
      if (oldStatus !== newStatus) {
        let reason = `تحديث تلقائي للنظام بناءً على تحليل المحادثة الأخير.`;
        if (analysisResult.detectedSale?.isDetected) {
          reason = `تم اكتشاف عملية بيع تلقائياً: شراء منتج (${analysisResult.detectedSale.productName}) بقيمة (${analysisResult.detectedSale.amount}).`;
        } else if (analysisResult.objections) {
          reason = `تغيير الحالة بسبب اعتراضات العميل: ${analysisResult.objections}`;
        } else if (analysisResult.nextAction) {
          reason = `الخطوة القادمة الموصى بها: ${analysisResult.nextAction}`;
        }

        await tx.aIEvent.create({
          data: {
            customerId,
            oldStatus,
            newStatus,
            reason,
            confidence: analysisResult.purchaseProbability,
            createdAt: new Date(),
          },
        });
      }

      // د. تحديث الملف الأساسي للعميل
      await tx.customer.update({
        where: { id: customerId },
        data: {
          name: analysisResult.clientName || customer.name,
          status: newStatus,
          leadScore: finalLeadScore,
          purchaseProbability: analysisResult.purchaseProbability,
          productsInterested: analysisResult.productsInterested.join(", "),
          lastSummary: analysisResult.summary,
          followUpDate: analysisResult.followUpDate ? new Date(analysisResult.followUpDate) : null,
          suggestedReply: analysisResult.suggestedReply || customer.suggestedReply,
        },
      });
    });

    console.log(`✅ Success processing AI analysis for customer: ${customer.phone}`);
    
    // هـ. حذف العميل من طابور المعالجة
    await prisma.analysisQueue.delete({ where: { customerId } }).catch(() => {});
    return true;
  } catch (error) {
    console.error(`❌ Error in processCustomerAnalysis for customer ${customerId}:`, error);
    // إلغاء حالة المعالجة في قاعدة البيانات
    await prisma.analysisQueue.update({
      where: { customerId },
      data: { isProcessing: false },
    }).catch(() => {});
    return false;
  }
}

/**
 * إدراج العميل في طابور المعالجة مع تطبيق الـ Debounce
 */
export async function enqueueAnalysis(customerId: string, forceImmediate: boolean = false) {
  // إلغاء أي مؤقت سابق قيد الانتظار في الذاكرة
  if (activeTimers.has(customerId)) {
    clearTimeout(activeTimers.get(customerId)!);
    activeTimers.delete(customerId);
  }

  const delayMs = forceImmediate ? 0 : 45000; // 45 ثانية لتجميع الرسائل
  const scheduledTime = new Date(Date.now() + delayMs);

  // تحديث جدول الطابور في قاعدة البيانات للرجوع إليه عند تعطل السيرفر
  await prisma.analysisQueue.upsert({
    where: { customerId },
    update: {
      scheduledFor: scheduledTime,
      isProcessing: false,
    },
    create: {
      customerId,
      scheduledFor: scheduledTime,
      isProcessing: false,
    },
  });

  if (forceImmediate) {
    // تشغيل فوري
    processCustomerAnalysis(customerId);
  } else {
    // تعيين المؤقت للتشغيل بعد 45 ثانية
    console.log(`⏳ Enqueued AI analysis for customer ${customerId} in 45s (Debouncing)...`);
    const timer = setTimeout(async () => {
      activeTimers.delete(customerId);
      await processCustomerAnalysis(customerId);
    }, delayMs);

    activeTimers.set(customerId, timer);
  }
}

/**
 * دالة لتشغيل جميع التحليلات المتراكمة في قاعدة البيانات عند بدء التشغيل
 */
export async function processStaleQueueOnStartup() {
  try {
    const staleJobs = await prisma.analysisQueue.findMany({
      where: {
        isProcessing: false,
      },
    });

    console.log(`🔌 Startup: Found ${staleJobs.length} pending queued analysis jobs.`);
    
    for (const job of staleJobs) {
      // تشغيل فوري للوظائف المتبقية
      enqueueAnalysis(job.customerId, true);
    }
  } catch (error) {
    console.error("❌ Error running startup queue processor:", error);
  }
}
