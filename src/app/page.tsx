import { prisma } from "@/lib/prisma";
import { seedDatabaseIfEmpty } from "@/lib/seed";
import Link from "next/link";
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  ShoppingBag, 
  XCircle,
  ArrowRight,
  TrendingDown
} from "lucide-react";

export const revalidate = 0; // عدم التخزين المؤقت لضمان تحديث الإحصائيات لحظياً

export default async function DashboardPage() {
  // تغذية قاعدة البيانات ببيانات أولية إذا كانت فارغة
  await seedDatabaseIfEmpty();

  // 1. جلب البيانات الأساسية للمؤشرات الرئيسية
  const totalCustomers = await prisma.customer.count();
  const totalMessages = await prisma.message.count();
  const sales = await prisma.sale.findMany();
  
  const totalSalesRevenue = sales.reduce((acc, curr) => acc + curr.saleAmount, 0);

  const customerStatusCount = await prisma.customer.count({
    where: { status: "Customer" },
  });
  
  const conversionRate = totalCustomers > 0 
    ? ((customerStatusCount / totalCustomers) * 100).toFixed(1) 
    : "0";

  // 2. التحليلات المتقدمة: العملاء المتوقع إغلاقهم خلال 7 أيام (Hot Lead مع احتمالية >= 70%)
  const hotLeads = await prisma.customer.findMany({
    where: {
      status: "Hot Lead",
      purchaseProbability: { gte: 70 },
    },
  });

  const expectedCloseCount = hotLeads.length;

  // حساب الأرباح المتوقعة بناءً على احتمالية الشراء مضروبة بقيمة تقديرية (متوسط 100 شيكل لكل منتج مهتم به)
  const expectedRevenue = hotLeads.reduce((acc, lead) => {
    const prob = lead.purchaseProbability || 0;
    const productCount = lead.productsInterested 
      ? lead.productsInterested.split(",").length 
      : 1;
    const estimatedValue = productCount * 100; // قيمة تقديرية 100 شيكل لكل منتج
    return acc + (prob / 100) * estimatedValue;
  }, 0);

  // 3. المنتجات الأكثر طلباً
  const allCustomers = await prisma.customer.findMany({
    select: { productsInterested: true },
  });
  
  const productCounts: Record<string, number> = {};
  allCustomers.forEach((c) => {
    if (c.productsInterested) {
      c.productsInterested.split(",").forEach((p) => {
        const name = p.trim();
        if (name) {
          productCounts[name] = (productCounts[name] || 0) + 1;
        }
      });
    }
  });
  
  const topProducts = Object.entries(productCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // 4. أسباب خسارة العملاء (العملاء بحالة Lost Customer)
  const lostCustomers = await prisma.customer.findMany({
    where: { status: "Lost Customer" },
    include: { memory: true },
  });

  // 5. أكثر الاعتراضات شيوعاً للعملاء المترددين
  const hesitantCustomers = await prisma.customer.findMany({
    where: { 
      status: "Interested",
      memory: {
        objections: { not: "" }
      }
    },
    include: { memory: true },
  });

  // 6. قوائم التحرك والمتابعة السريعة
  // أ. جاهزون للشراء (Hot Leads مرتبين تنازلياً حسب الاحتمالية)
  const readyToBuyList = await prisma.customer.findMany({
    where: { status: "Hot Lead" },
    orderBy: { purchaseProbability: "desc" },
    take: 5,
  });

  // ب. عملاء مترددون (Interested ولديهم اعتراضات)
  const hesitantLeadsList = await prisma.customer.findMany({
    where: { 
      status: "Interested",
      memory: {
        objections: { not: "" }
      }
    },
    include: { memory: true },
    take: 5,
  });

  // ج. متابعات اليوم
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const followUpsTodayList = await prisma.customer.findMany({
    where: {
      followUpDate: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    take: 5,
  });

  return (
    <div>
      {/* الهيدر العلوي */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>لوحة التحكم الذكية</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>تحليل محادثات واتساب لحظياً ومراقبة قمع المبيعات بالذكاء الاصطناعي</p>
        </div>
        <div className="glass-panel" style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
          <Calendar size={16} style={{ color: "var(--primary)" }} />
          <span>تحديث مباشر: {new Date().toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </header>

      {/* الإحصائيات الرئيسية (KPI Cards) */}
      <section className="stats-grid">
        <div className="stat-card glass-panel" style={{ "--card-accent": "var(--primary)" } as any}>
          <div className="stat-header">
            <span>إجمالي العملاء</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{totalCustomers}</div>
          <div className="stat-desc">مستخدم مسجل بقاعدة البيانات</div>
        </div>

        <div className="stat-card glass-panel" style={{ "--card-accent": "#6366f1" } as any}>
          <div className="stat-header">
            <span>محادثات ورسائل واتساب</span>
            <div className="stat-icon"><MessageSquare size={20} /></div>
          </div>
          <div className="stat-value">{totalMessages}</div>
          <div className="stat-desc">رسالة مستلمة ومحللة تلقائياً</div>
        </div>

        <div className="stat-card glass-panel" style={{ "--card-accent": "#e11d48" } as any}>
          <div className="stat-header">
            <span>قيمة المبيعات المحققة</span>
            <div className="stat-icon"><DollarSign size={20} /></div>
          </div>
          <div className="stat-value">{totalSalesRevenue.toLocaleString()} <span style={{ fontSize: "1rem" }}>شيكل</span></div>
          <div className="stat-desc">مبيعات مكتشفة ومؤكدة</div>
        </div>

        <div className="stat-card glass-panel" style={{ "--card-accent": "#d97706" } as any}>
          <div className="stat-header">
            <span>معدل التحويل (CR)</span>
            <div className="stat-icon"><Percent size={20} /></div>
          </div>
          <div className="stat-value">{conversionRate}%</div>
          <div className="stat-desc">نسبة إغلاق صفقات العملاء</div>
        </div>
      </section>

      {/* لوحات التحليل المتقدم المضافة */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        
        {/* بطاقة التنبؤ المالي والعملاء القريبين */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={20} style={{ color: "var(--primary)" }} />
            <span>التوقعات المالية والإغلاق (7 أيام)</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "12px", border: "1px dashed rgba(16, 185, 129, 0.2)" }}>
              <div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>أرباح متوقعة قريبة</p>
                <h4 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
                  {Math.round(expectedRevenue).toLocaleString()} شيكل
                </h4>
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>عملاء جاهزون للإغلاق</p>
                <h4 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--text-main)", marginTop: "4px" }}>
                  {expectedCloseCount} عميل
                </h4>
              </div>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              * يتم احتساب الأرباح المتوقعة بوزن احتمالية الشراء المقدرة بـ AI للمبيعات القريبة (Hot Leads) مضروبة في قيمة المنتجات المستهدفة.
            </p>
          </div>
        </div>

        {/* بطاقة المنتجات الأكثر طلباً */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingBag size={20} style={{ color: "#6366f1" }} />
            <span>المنتجات الأكثر طلباً واهتماماً</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {topProducts.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>لا توجد اهتمامات مسجلة بعد.</p>
            ) : (
              topProducts.map((p, idx) => {
                const maxCount = Math.max(...topProducts.map(x => x.count), 1);
                const percent = (p.count / maxCount) * 100;
                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{p.count} عميل مهتم</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, var(--primary))", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* بطاقة أسباب الخسارة والاعتراضات */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingDown size={20} style={{ color: "var(--status-lost)" }} />
            <span>أبرز أسباب الاعتراض وخسارة العملاء</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {lostCustomers.length === 0 && hesitantCustomers.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>لا توجد اعتراضات أو عملاء خاسرين حالياً.</p>
            ) : (
              <>
                {/* أكثر اعتراض شائع حالياً */}
                {hesitantCustomers.length > 0 && (
                  <div style={{ padding: "10px 12px", background: "rgba(245, 158, 11, 0.05)", borderRadius: "8px", borderRight: "3px solid var(--status-hot-lead)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--status-hot-lead)", fontWeight: 600 }}>الاعتراض الأبرز للعملاء المترددين:</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-main)", marginTop: "4px" }}>
                      "{hesitantCustomers[0].memory?.objections}"
                    </p>
                  </div>
                )}
                {/* أسباب الخسارة الأحدث */}
                {lostCustomers.length > 0 && (
                  <div style={{ padding: "10px 12px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "8px", borderRight: "3px solid var(--status-lost)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--status-lost)", fontWeight: 600 }}>أحدث سبب لخسارة عميل ({lostCustomers[0].name}):</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-main)", marginTop: "4px" }}>
                      "{lostCustomers[0].memory?.objections || lostCustomers[0].lastSummary}"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* قوائم التحركات السريعة - 3 أعمدة متجاوبة */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* 1. عملاء جاهزون للشراء */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--status-hot-lead)" }} />
              <span>عملاء جاهزون للشراء (Hot Leads)</span>
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{readyToBuyList.length} عملاء</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {readyToBuyList.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px" }}>لا يوجد عملاء جاهزون حالياً.</p>
            ) : (
              readyToBuyList.map((customer) => (
                <div key={customer.id} className="glass-panel-glow" style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: "0.95rem" }}>{customer.name}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>{customer.phone}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--status-hot-lead)" }}>{customer.purchaseProbability}%</span>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>احتمالية</p>
                    </div>
                    <Link href={`/customers/${customer.id}`} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. عملاء مترددون يحتاجون إقناع */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--status-interested)" }} />
              <span>عملاء مترددون (Hesitant Leads)</span>
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{hesitantLeadsList.length} عملاء</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {hesitantLeadsList.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px" }}>لا يوجد عملاء مترددون حالياً.</p>
            ) : (
              hesitantLeadsList.map((customer) => (
                <div key={customer.id} style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flexGrow: 1, paddingLeft: "12px" }}>
                    <h4 style={{ fontWeight: 600, fontSize: "0.95rem" }}>{customer.name}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                      الاعتراض: {customer.memory?.objections || "متردد"}
                    </p>
                  </div>
                  <Link href={`/customers/${customer.id}`} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. متابعات اليوم */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--status-follow-up)" }} />
              <span>متابعات اليوم المطلوبة</span>
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{followUpsTodayList.length} عملاء</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {followUpsTodayList.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px" }}>لا توجد متابعات مطلوبة اليوم.</p>
            ) : (
              followUpsTodayList.map((customer) => (
                <div key={customer.id} style={{ padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: "0.95rem" }}>{customer.name}</h4>
                    <span className="badge badge-follow-up" style={{ marginTop: "4px", padding: "2px 8px", fontSize: "0.7rem" }}>متابعة</span>
                  </div>
                  <Link href={`/customers/${customer.id}`} className="btn btn-secondary btn-icon" style={{ width: "32px", height: "32px" }}>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      </section>
    </div>
  );
}
