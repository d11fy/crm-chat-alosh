import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Eye, Phone, UserPlus, Filter } from "lucide-react";

export const revalidate = 0; // تحميل مباشر لحظي

function getBadgeClass(status: string) {
  switch (status) {
    case "New Lead": return "badge-new-lead";
    case "Interested": return "badge-interested";
    case "Hot Lead": return "badge-hot-lead";
    case "Follow Up Later": return "badge-follow-up";
    case "Customer": return "badge-customer";
    case "Lost Customer": return "badge-lost";
    default: return "";
  }
}

function getArabicStatus(status: string) {
  switch (status) {
    case "New Lead": return "عميل جديد";
    case "Interested": return "مهتم";
    case "Hot Lead": return "حار جداً";
    case "Follow Up Later": return "متابعة لاحقاً";
    case "Customer": return "عميل فعلي";
    case "Lost Customer": return "عميل خاسر";
    default: return status;
  }
}

interface SearchParams {
  q?: string;
  status?: string;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const status = params.status || "ALL";

  // بناء شروط البحث والتصفية لقاعدة البيانات
  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { productsInterested: { contains: q } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  // جلب البيانات من Prisma
  const customers = await prisma.customer.findMany({
    where,
    orderBy: {
      lastContactDate: "desc",
    },
  });

  return (
    <div>
      {/* رأس الصفحة */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>دليل العملاء والمحادثات</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>عرض وإدارة وتصنيف العملاء استناداً لبيانات واتساب والتحليلات الذكية</p>
        </div>
      </header>

      {/* شريط البحث والفلاتر */}
      <section className="glass-panel" style={{ padding: "20px", marginBottom: "24px" }}>
        <form method="GET" action="/customers" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          
          {/* حقل البحث بالاسم أو الرقم */}
          <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", right: "14px", top: "14px", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              name="q" 
              defaultValue={q}
              placeholder="ابحث باسم العميل، رقم الهاتف، أو المنتج المطلوب..." 
              className="form-input" 
              style={{ paddingRight: "44px" }}
            />
          </div>

          {/* فلتر الحالة */}
          <div style={{ minWidth: "200px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} style={{ color: "var(--text-muted)" }} />
            <select 
              name="status" 
              defaultValue={status}
              className="form-input"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="New Lead">عميل جديد (New Lead)</option>
              <option value="Interested">مهتم (Interested)</option>
              <option value="Hot Lead">حار جداً (Hot Lead)</option>
              <option value="Follow Up Later">متابعة لاحقاً (Follow Up Later)</option>
              <option value="Customer">عميل فعلي (Customer)</option>
              <option value="Lost Customer">عميل خاسر (Lost Customer)</option>
            </select>
          </div>

          {/* أزرار البحث */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }}>تطبيق الفلتر</button>
            {(q || status !== "ALL") && (
              <Link href="/customers" className="btn btn-secondary" style={{ padding: "12px 16px" }}>إعادة تعيين</Link>
            )}
          </div>
        </form>
      </section>

      {/* جدول عرض العملاء */}
      <section className="glass-panel" style={{ padding: "20px" }}>
        {customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <UserPlus size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <p style={{ fontSize: "1.1rem" }}>لم يتم العثور على أي عملاء يطابقون معايير البحث.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>رقم الهاتف</th>
                  <th>الحالة</th>
                  <th>النقاط (Lead Score)</th>
                  <th>احتمالية الشراء</th>
                  <th>المنتجات المهتم بها</th>
                  <th>آخر تواصل</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    {/* العميل */}
                    <td style={{ fontWeight: 600 }}>{c.name || "عميل غير مسمى"}</td>
                    
                    {/* رقم الهاتف */}
                    <td style={{ direction: "ltr" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Phone size={14} style={{ color: "var(--text-muted)" }} />
                        {c.phone}
                      </span>
                    </td>
                    
                    {/* الحالة */}
                    <td>
                      <span className={`badge ${getBadgeClass(c.status)}`}>
                        {getArabicStatus(c.status)}
                      </span>
                    </td>
                    
                    {/* النقاط */}
                    <td style={{ fontWeight: 700, color: c.leadScore >= 70 ? "var(--status-hot-lead)" : "inherit" }}>
                      {c.leadScore} نقطة
                    </td>
                    
                    {/* احتمالية الشراء */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700 }}>{c.purchaseProbability}%</span>
                        <div style={{ width: "60px", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ 
                            width: `${c.purchaseProbability}%`, 
                            height: "100%", 
                            background: c.purchaseProbability >= 75 ? "var(--status-hot-lead)" : c.purchaseProbability >= 40 ? "var(--status-interested)" : "var(--status-lost)" 
                          }} />
                        </div>
                      </div>
                    </td>
                    
                    {/* المنتجات المهتم بها */}
                    <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.productsInterested || "-"}
                    </td>
                    
                    {/* آخر تواصل */}
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {new Date(c.lastContactDate).toLocaleDateString("ar-SA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    
                    {/* إجراءات */}
                    <td>
                      <Link href={`/customers/${c.id}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.85rem", gap: "6px" }}>
                        <Eye size={14} />
                        <span>عرض التفاصيل</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
