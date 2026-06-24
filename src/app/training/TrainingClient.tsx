"use client";

import React, { useState } from "react";
import { updateTrainingRules } from "./actions";
import { Brain, Save, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface TrainingClientProps {
  initialContent: string;
}

export default function TrainingClient({ initialContent }: TrainingClientProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = async () => {
    setStatus("saving");
    setErrorMessage("");
    
    const res = await updateTrainingRules(content);
    if (res.success) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setErrorMessage(res.error || "فشل الحفظ");
    }
  };

  // كتابة نص الإرشادات الافتراضي لإعادة التعيين إذا لزم الأمر
  const defaultTemplate = `أنت تحلل وتصيغ الردود بالنيابة عن "علوش ستور" (Alosh Store)، وهو متجر متكامل رائد متخصص في بيع الاشتراكات الرقمية والخدمات الترفيهية والتعليمية.
العملة الرسمية المعتمدة للمبيعات هي الشيكل (₪ أو شيكل).

قائمة الاشتراكات الرقمية المتوفرة وأسعارها الرسمية:
1. اشتراك نتفليكس (Netflix) شهري (شاشة خاصة بجودة 4K UHD): بسعر 35 شيكل.
2. اشتراك يوتيوب بريميوم (YouTube Premium) سنة كاملة (على إيميل العميل الشخصي بدون إعلانات): بسعر 80 شيكل.
3. اشتراك سبوتيفاي بريميوم (Spotify) سنة كاملة: بسعر 60 شيكل.
4. اشتراك شاهد VIP الباقة الرياضية (Shahid VIP Sports) شهري: بسعر 25 شيكل، أو سنوي بسعر 180 شيكل.
5. اشتراك ChatGPT Plus (رسمي وخاص بالعميل) شهري: بسعر 90 شيكل.
6. اشتراك IPTV الذكي (سيرفر متكامل يضم أكثر من 8000 قناة رياضية وترفيهية ومكتبة أفلام) سنة كاملة: بسعر 120 شيكل.
7. اشتراك أدوبي كرييتف كلاود (Adobe Creative Cloud) سنة كاملة على إيميل العميل: بسعر 250 شيكل.

توجيهات وقواعد الرد الذكي والتحليل (Sales & Objection Handling):
- بخصوص السعر المرتفع: وضح للعميل أن جميع اشتراكاتنا رسمية ومضمونة طوال فترة الاشتراك بنسبة 100%، وفي حال حدوث أي مشكلة أو خلل نقوم بتوفير بديل فوري أو حل المشكلة، بينما الحسابات الرخيصة في السوق غير آمنة ومقرصنة وتتعطل باستمرار دون تعويض.
- بخصوص الخصومات: يسمح بتقديم خصم 10% تلقائياً إذا طلب العميل أكثر من اشتراكين معاً، أو تقديم شهر مجاني إضافي عند تجديد الاشتراكات السنوية.
- بخصوص الضمان والدعم الفني: الضمان ذهبي وفوري ويشمل كامل فترة الاشتراك، وفريق الدعم الفني متواجد عبر واتساب لحل أي مشكلة خلال دقائق.
- بخصوص إتمام الدفع (Sales Detection): نقبل الدفع عبر (بنك فلسطين، بنك القدس، محفظة Jawwal Pay، أو PalPay، أو دفع نقدي عبر نقاط الشحن). إذا أرسل العميل صورة إيصال تحويل أو قال عبارة تدل على إتمام الدفع (مثل: حولت، تم الدفع، دفعت)، يجب إنشاء سجل مبيعات (Sale) فوراً بقيمة المنتج المستهدف وتحويل حالة العميل إلى "Customer".`;

  const handleResetToDefault = () => {
    if (confirm("هل أنت متأكد من رغبتك في إعادة التوجيهات إلى القالب الافتراضي لعلوش ستور؟")) {
      setContent(defaultTemplate);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
      
      {/* صندوق المحرر الرئيسي */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Brain size={20} style={{ color: "var(--primary)" }} />
            <span>نص التوجيهات والتدريب لـ علوش ستور</span>
          </h3>
          <button 
            onClick={handleResetToDefault}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px" }}
          >
            <RefreshCw size={12} />
            <span>قالب افتراضي</span>
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="form-input"
          style={{ 
            height: "450px", 
            fontFamily: "monospace", 
            fontSize: "0.9rem", 
            lineHeight: 1.6, 
            resize: "vertical",
            padding: "16px",
            background: "rgba(0,0,0,0.2)"
          }}
          placeholder="اكتب توجيهات المبيعات والمنتجات والتسعير وقواعد التعامل مع اعتراضات العملاء هنا..."
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {status === "saving" && (
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="spinner" /> جاري حفظ وتحديث نموذج الذكاء الاصطناعي...
              </span>
            )}
            {status === "success" && (
              <span style={{ fontSize: "0.85rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle size={16} /> تم الحفظ وتحديث التدريب بنجاح!
              </span>
            )}
            {status === "error" && (
              <span style={{ fontSize: "0.85rem", color: "var(--status-lost)", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircle size={16} /> {errorMessage}
              </span>
            )}
          </div>

          <button 
            onClick={handleSave} 
            className="btn btn-primary"
            style={{ padding: "12px 24px", gap: "8px" }}
            disabled={status === "saving"}
          >
            <Save size={18} />
            <span>حفظ وتطبيق التدريب</span>
          </button>
        </div>
      </div>

      {/* لوحة الشرح والتوجيه الجانبية */}
      <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Brain size={16} style={{ color: "var(--secondary)" }} />
            <span>كيف يعمل تدريب الذكاء الاصطناعي؟</span>
          </h4>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "10px" }}>
            تتحكم هذه الصفحة بـ **System Instruction** (توجيهات النظام) التي يتم تغذيتها لنموذج OpenAI قبل تحليل كل محادثة واتساب.
          </p>
          <ul style={{ fontSize: "0.8rem", color: "var(--text-muted)", paddingRight: "16px", display: "flex", flexDirection: "column", gap: "8px", lineHeight: 1.4 }}>
            <li>يمكنك إضافة وتحديث باقات المنتجات وأسعارها بصيغة **الشيكل**.</li>
            <li>اكتب قواعد معالجة اعتراض العميل على السعر ليرد الذكاء الاصطناعي بالأسلوب الأنسب.</li>
            <li>حدد أسماء الحسابات البنكية ومحافظ الشحن ليتعرف عليها النظام ويقترحها.</li>
            <li>تحديث هذه البيانات ينعكس فوراً على الرسالة القادمة الواردة للنظام.</li>
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: "20px", fontSize: "0.8rem", lineHeight: 1.5 }}>
          <strong>💡 نصيحة احترافية:</strong>
          <p style={{ marginTop: "6px", color: "var(--text-secondary)" }}>
            احرص على أن تكون أسعار اشتراكاتك الرقمية وخدماتك واضحة في الجدول بالأيسر. عند استفسار العميل عن أي باقة، سيقترح النظام تلقائياً الرد المناسب بناءً على قائمة الأسعار والضمان المكتوب هنا.
          </p>
        </div>

      </section>

      <style jsx global>{`
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--text-muted);
          border-top-color: var(--primary);
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
