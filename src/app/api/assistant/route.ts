import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// دالة لتجميع بيانات الإحصائيات الشاملة من قاعدة البيانات
async function getDbContextSummary() {
  const now = new Date();
  
  // البدايات الزمنية
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. أعداد العملاء حسب الحالات
  const totalCustomers = await prisma.customer.count();
  const customersByStatus = await prisma.customer.groupBy({
    by: ["status"],
    _count: {
      _all: true,
    },
  });

  // 2. إحصائيات المبيعات
  const totalSalesCount = await prisma.sale.count();
  const totalSalesAmount = await prisma.sale.aggregate({
    _sum: {
      saleAmount: true,
    },
  });
  
  // مبيعات الشهر الحالي
  const salesThisMonth = await prisma.sale.findMany({
    where: {
      saleDate: {
        gte: startOfMonth,
      },
    },
    include: {
      customer: true,
    },
  });

  const salesThisMonthAmount = salesThisMonth.reduce((acc, curr) => acc + curr.saleAmount, 0);

  // 3. المتابعات المطلوبة اليوم
  const followUpsToday = await prisma.customer.findMany({
    where: {
      followUpDate: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      followUpDate: true,
    },
  });

  // 4. الاعتراضات من ذاكرة العميل
  const customerMemories = await prisma.customerMemory.findMany({
    where: {
      objections: {
        not: "",
      },
    },
    select: {
      objections: true,
      customer: {
        select: {
          name: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  // 5. العملاء الجاهزون للشراء (Hot Leads أو نقاط جودة عالية)
  const hotLeads = await prisma.customer.findMany({
    where: {
      status: "Hot Lead",
    },
    select: {
      name: true,
      phone: true,
      leadScore: true,
      purchaseProbability: true,
      productsInterested: true,
    },
  });

  // 6. المنتجات الأكثر طلباً (حسب ذاكرة الاهتمامات أو سجل المبيعات)
  const salesRecords = await prisma.sale.findMany({
    select: {
      productName: true,
    },
  });

  return {
    totalCustomers,
    customersByStatus: customersByStatus.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    totalSalesCount,
    totalSalesRevenue: totalSalesAmount._sum.saleAmount || 0,
    salesThisMonth: {
      count: salesThisMonth.length,
      amount: salesThisMonthAmount,
      details: salesThisMonth.map((s) => ({
        product: s.productName,
        amount: s.saleAmount,
        customer: s.customer.name,
        date: s.saleDate.toISOString().split("T")[0],
      })),
    },
    followUpsToday: followUpsToday.map((f) => ({
      name: f.name,
      phone: f.phone,
      status: f.status,
      date: f.followUpDate?.toISOString(),
    })),
    commonObjections: customerMemories.map((m) => ({
      customerName: m.customer.name,
      customerPhone: m.customer.phone,
      objections: m.objections,
      status: m.customer.status,
    })),
    hotLeads: hotLeads.map((hl) => ({
      name: hl.name,
      phone: hl.phone,
      score: hl.leadScore,
      probability: hl.purchaseProbability,
      products: hl.productsInterested,
    })),
    recentSales: salesRecords.map((s) => s.productName),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json({ error: "Question parameter is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          answer: "⚠️ عذراً، لم يتم تكوين مفتاح OpenAI API في خيارات النظام البيئية. يرجى إضافته لتفعيل وظيفة المساعد الذكي.",
        },
        { status: 200 }
      );
    }

    // جلب سياق قاعدة البيانات الحالي
    const dbContext = await getDbContextSummary();

    const systemPrompt = `أنت المساعد الإداري الذكي الخبير والمحلل لنظام "AI WhatsApp Sales CRM".
وظيفتك هي الإجابة بدقة واحترافية وبشكل مفصل باللغة العربية على أسئلة مدير المبيعات حول البيانات والإحصائيات الخاصة بقاعدة البيانات.

لديك وصول كامل ومباشر إلى ملخص حالة قاعدة البيانات الحالي والتالي:
---
سياق قاعدة البيانات الحالي:
${JSON.stringify(dbContext, null, 2)}
---

التعليمات الهامة:
1. اقرأ السؤال وحلله مقارنةً بسياق قاعدة البيانات المعطى.
2. أجب عن الأرقام والإحصائيات بدقة تامة بناءً على البيانات الفعلية فقط. لا تخمن أو تخترع أرقاماً أو عملاء غير موجودين.
3. إذا طلب المستخدم أسماء أشخاص يحتاجون متابعة اليوم أو عملاء جاهزين للشراء، فقم بإدراج أسمائهم وأرقام هواتفهم ومعلوماتهم كما هي واردة في السياق بشكل منسق وجميل.
4. صغ إجابتك بلغة عربية فصحى واضحة، مهنية ومرتبة باستخدام نقاط وخطوط عريضة وقوائم (Markdown) لتسهيل القراءة السريعة لمدير المبيعات.
5. وفر في نهاية إجابتك نصيحة أو توصية سريعة بناءً على البيانات المطروحة (مثال: حث على الاتصال بالعميل الفلاني لوجود متابعة عاجلة، أو تنبيه لزيادة مبيعات منتج معين).
`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    });

    const answer = response.choices[0]?.message?.content || "عذراً، لم أتمكن من صياغة إجابة مناسبة في الوقت الحالي.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("❌ Error in Assistant Route:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
