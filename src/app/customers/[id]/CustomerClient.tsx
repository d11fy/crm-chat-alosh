"use client";

import React, { useState } from "react";
import { 
  updateCustomerStatus, 
  updateCustomerFollowUp, 
  addSale 
} from "./actions";
import { 
  Phone, 
  Calendar, 
  Award, 
  Percent, 
  ShoppingBag, 
  MessageCircle, 
  Brain, 
  TrendingUp, 
  Clock, 
  Check, 
  Copy, 
  DollarSign 
} from "lucide-react";

interface CustomerClientProps {
  customer: any;
}

export default function CustomerClient({ customer }: CustomerClientProps) {
  const [status, setStatus] = useState(customer.status);
  const [followUpDate, setFollowUpDate] = useState(
    customer.followUpDate 
      ? new Date(customer.followUpDate).toISOString().substring(0, 16) 
      : ""
  );
  
  // حقول إضافة مبيعة
  const [productName, setProductName] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [saleMessage, setSaleMessage] = useState("");
  
  // حالة نسخ الرد المقترح
  const [copied, setCopied] = useState(false);

  // تحديث الحالة يدوياً
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    const res = await updateCustomerStatus(customer.id, newStatus);
    if (!res.success) {
      alert("فشل تحديث الحالة: " + res.error);
    }
  };

  // تحديث تاريخ المتابعة يدوياً
  const handleFollowUpChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setFollowUpDate(date);
    const res = await updateCustomerFollowUp(customer.id, date);
    if (!res.success) {
      alert("فشل تحديث موعد المتابعة: " + res.error);
    }
  };

  // تسجيل مبيعة جديدة
  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleMessage("");

    const amountNum = parseFloat(saleAmount);
    if (!productName || isNaN(amountNum) || amountNum <= 0) {
      setSaleMessage("❌ يرجى إدخال اسم منتج وقيمة صحيحة");
      return;
    }

    const res = await addSale(customer.id, productName, amountNum);
    if (res.success) {
      setSaleMessage("✅ تم تسجيل المبيعة وتحديث حالة العميل بنجاح!");
      setProductName("");
      setSaleAmount("");
      // تحديث الحالة محلياً لتصبح عميل
      setStatus("Customer");
    } else {
      setSaleMessage("❌ فشل تسجيل المبيعة: " + res.error);
    }
  };

  // نسخ الرد المقترح
  const handleCopyReply = () => {
    if (!customer.suggestedReply) return;
    navigator.clipboard.writeText(customer.suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function getBadgeClass(statusStr: string) {
    switch (statusStr) {
      case "New Lead": return "badge-new-lead";
      case "Interested": return "badge-interested";
      case "Hot Lead": return "badge-hot-lead";
      case "Follow Up Later": return "badge-follow-up";
      case "Customer": return "badge-customer";
      case "Lost Customer": return "badge-lost";
      default: return "";
    }
  }

  function getArabicStatus(statusStr: string) {
    switch (statusStr) {
      case "New Lead": return "عميل جديد";
      case "Interested": return "مهتم";
      case "Hot Lead": return "حار جداً";
      case "Follow Up Later": return "متابعة لاحقاً";
      case "Customer": return "عميل فعلي";
      case "Lost Customer": return "عميل خاسر";
      default: return statusStr;
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 340px", gap: "24px", minHeight: "calc(100vh - 120px)" }} className="customer-detail-grid">
      
      {/* العمود الأيمن: بطاقة العميل الأساسية والإجراءات السريعة */}
      <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* بطاقة العميل الرئيسية */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "4px" }}>{customer.name || "عميل غير مسمى"}</h2>
          <p style={{ color: "var(--text-secondary)", direction: "ltr", fontSize: "0.9rem", textAlign: "right", display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
            <Phone size={14} style={{ color: "var(--text-muted)" }} />
            {customer.phone}
          </p>

          {/* تعديل الحالة يدوياً */}
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>حالة العميل الحالية</label>
            <select 
              value={status} 
              onChange={handleStatusChange}
              className="form-input"
              style={{ fontWeight: 600 }}
            >
              <option value="New Lead">New Lead (عميل جديد)</option>
              <option value="Interested">Interested (مهتم)</option>
              <option value="Hot Lead">Hot Lead (حار جداً)</option>
              <option value="Follow Up Later">Follow Up Later (متابعة لاحقاً)</option>
              <option value="Customer">Customer (عميل فعلي)</option>
              <option value="Lost Customer">Lost Customer (عميل خاسر)</option>
            </select>
          </div>

          {/* موعد المتابعة */}
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>تحديد موعد المتابعة القادم</label>
            <div style={{ position: "relative" }}>
              <input 
                type="datetime-local" 
                value={followUpDate} 
                onChange={handleFollowUpChange}
                className="form-input"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
        </div>

        {/* مؤشرات جودة العميل */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={16} style={{ color: "var(--primary)" }} />
            <span>مؤشرات جودة العميل</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* نقاط جودة العميل */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>نقاط جودة العميل (Lead Score)</span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{customer.leadScore} نقطة</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(customer.leadScore, 100)}%`, height: "100%", background: "var(--primary)", borderRadius: "4px" }} />
              </div>
            </div>

            {/* احتمالية الشراء */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>احتمالية الشراء المقدرة</span>
                <span style={{ fontWeight: 700, color: "#6366f1" }}>{customer.purchaseProbability}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${customer.purchaseProbability}%`, height: "100%", background: "#6366f1", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* نموذج تسجيل مبيعة جديدة */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <DollarSign size={16} style={{ color: "var(--status-new-lead)" }} />
            <span>تسجيل عملية بيع جديدة</span>
          </h3>

          <form onSubmit={handleAddSale} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input 
              type="text" 
              placeholder="اسم المنتج المباع..." 
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="form-input" 
              required
            />
            <input 
              type="number" 
              placeholder="قيمة المبيعة بالشيكل..." 
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              className="form-input" 
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "10px" }}>حفظ المبيعة</button>
            {saleMessage && (
              <p style={{ fontSize: "0.8rem", textAlign: "center", marginTop: "4px" }}>{saleMessage}</p>
            )}
          </form>
        </div>

      </section>

      {/* العمود الأوسط: نافذة المحادثة (WhatsApp-like Chat) والردود الذكية */}
      <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* المحادثة */}
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "350px" }}>
          <div className="chat-messages" style={{ height: "450px" }}>
            {customer.messages.length === 0 ? (
              <div style={{ margin: "auto", color: "var(--text-muted)", textAlign: "center" }}>
                <MessageCircle size={36} style={{ marginBottom: "8px", opacity: 0.5 }} />
                <p>لا يوجد رسائل مسجلة لهذا العميل بعد.</p>
              </div>
            ) : (
              customer.messages.map((msg: any) => {
                const isClient = msg.direction === "IN";
                return (
                  <div 
                    key={msg.id} 
                    className={`message-bubble ${isClient ? "in" : "out"}`}
                  >
                    <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    <div className="message-meta">
                      <span>{isClient ? "العميل" : "فريق المبيعات"}</span>
                      <span>•</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* قسم الرد الذكي المقترح */}
        {customer.suggestedReply && (
          <div className="glass-panel" style={{ padding: "20px", border: "1px solid rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={16} />
                <span>الرد الذكي المقترح بواسطة الذكاء الاصطناعي</span>
              </h4>
              <button 
                onClick={handleCopyReply}
                className="btn btn-secondary" 
                style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
              >
                {copied ? <Check size={14} style={{ color: "var(--primary)" }} /> : <Copy size={14} />}
                <span>{copied ? "تم النسخ!" : "نسخ الرد"}</span>
              </button>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.5, background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              {customer.suggestedReply}
            </p>
          </div>
        )}

      </section>

      {/* العمود الأيسر: الذاكرة التراكمية، المبيعات وسجل أحداث الذكاء الاصطناعي */}
      <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* ذاكرة العميل المستمرة (Customer Memory) */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Brain size={16} style={{ color: "var(--secondary)" }} />
            <span>ذاكرة العميل التراكمية</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
            <div>
              <strong style={{ color: "var(--text-secondary)", display: "block" }}>الملخص التراكمي الشامل:</strong>
              <p style={{ color: "var(--text-main)", marginTop: "4px", lineHeight: 1.5 }}>
                {customer.memory?.summary || "لا يوجد ملخص تراكمي بعد."}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
              <strong style={{ color: "var(--text-secondary)", display: "block" }}>الاهتمامات المكتشفة:</strong>
              <p style={{ color: "var(--text-main)", marginTop: "4px" }}>
                {customer.memory?.interests || "لا توجد اهتمامات مسجلة."}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
              <strong style={{ color: "var(--text-secondary)", display: "block" }}>الاعتراضات والمخاوف:</strong>
              <p style={{ marginTop: "4px", color: customer.memory?.objections ? "var(--status-hot-lead)" : "var(--text-main)" }}>
                {customer.memory?.objections || "لا توجد اعتراضات مسجلة."}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
              <strong style={{ color: "var(--text-secondary)", display: "block" }}>تاريخ المشتريات:</strong>
              <p style={{ color: "var(--text-main)", marginTop: "4px" }}>
                {customer.memory?.purchaseHistory || "لا يوجد مشتريات مسجلة."}
              </p>
            </div>
          </div>
        </div>

        {/* سجل المبيعات الفعلي للعميل */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingBag size={16} style={{ color: "var(--status-customer)" }} />
            <span>سجل المبيعات</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {customer.sales.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>لا يوجد مبيعات مسجلة لهذا العميل.</p>
            ) : (
              customer.sales.map((sale: any) => (
                <div key={sale.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                  <div>
                    <strong style={{ display: "block" }}>{sale.productName}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(sale.saleDate).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <span style={{ fontWeight: 700, color: "var(--primary)" }}>{sale.saleAmount} شيكل</span>
                    {sale.isDetected && (
                      <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)" }}>كشف تلقائي</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* سجل أحداث الذكاء الاصطناعي (AI Event Log) */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} style={{ color: "var(--status-new-lead)" }} />
            <span>سجل أحداث وقرارات الـ AI</span>
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "250px", overflowY: "auto", paddingLeft: "4px" }}>
            {customer.aiEvents.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>لا يوجد أحداث مسجلة بعد.</p>
            ) : (
              customer.aiEvents.map((ev: any) => (
                <div key={ev.id} style={{ position: "relative", paddingRight: "16px", fontSize: "0.8rem", borderRight: "2px solid var(--border-color)" }}>
                  {/* نقطة الشجرة */}
                  <div style={{ 
                    position: "absolute", 
                    right: "-5px", 
                    top: "4px", 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    background: ev.newStatus === "Customer" ? "var(--status-customer)" : "var(--status-hot-lead)" 
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700 }}>
                      {getArabicStatus(ev.oldStatus)} ← {getArabicStatus(ev.newStatus)}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                      {new Date(ev.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {ev.reason}
                  </p>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                    درجة اليقين: {ev.confidence}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </section>
      
    </div>
  );
}
