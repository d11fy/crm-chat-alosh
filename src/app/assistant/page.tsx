"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Calendar, 
  ShoppingBag,
  HelpCircle
} from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "مرحباً بك! أنا مساعد المبيعات الذكي الخاص بك. يمكنني الإجابة عن أي أسئلة تتعلق ببيانات العملاء، المتابعات المطلوبة، تفاصيل المبيعات لهذا الشهر، أو حتى استخلاص اعتراضات العملاء الشائعة. \n\nما الذي تود معرفته اليوم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // التمرير التلقائي لأسفل المحادثة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // إرسال السؤال إلى الـ API
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // إضافة رسالة المستخدم للواجهة
    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await response.json();
      
      if (response.ok && data.answer) {
        setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev, 
          { 
            role: "bot", 
            text: "❌ عذراً، واجهت مشكلة أثناء محاولة قراءة وتلخيص البيانات. يرجى التأكد من تشغيل الخادم وتثبيت مفتاح OpenAI API بشكل سليم." 
          }
        ]);
      }
    } catch (error) {
      console.error("Error calling assistant API:", error);
      setMessages((prev) => [
        ...prev, 
        { 
          role: "bot", 
          text: "❌ حدث خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الشبكة وإعادة المحاولة." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // الأسئلة المقترحة السريعة
  const suggestedQuestions = [
    { text: "ما إجمالي المبيعات هذا الشهر؟", icon: ShoppingBag },
    { text: "من هم العملاء الذين يحتاجون متابعة اليوم؟", icon: Calendar },
    { text: "كم عدد العملاء المهتمين وحالاتهم؟", icon: Users },
    { text: "ما هي أسباب عدم الشراء الأكثر شيوعاً؟", icon: HelpCircle },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* رأس الصفحة */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={28} style={{ color: "var(--primary)" }} />
            <span>المساعد الإداري الذكي</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>اطرح أي أسئلة حول عملائك ومبيعاتك باللغة العربية واحصل على تقارير فورية</p>
        </div>
      </header>

      {/* لوحة المحادثة والأسئلة السريعة */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", flexGrow: 1, minHeight: 0 }}>
        
        {/* صندوق المحادثة الرئيسي */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          
          {/* الرسائل */}
          <div className="assistant-messages" style={{ flexGrow: 1, overflowY: "auto", marginBottom: "20px", maxHeight: "none" }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`assistant-bubble ${msg.role === "user" ? "user" : "bot"}`}
              >
                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: msg.role === "user" ? "var(--secondary)" : "var(--primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {msg.role === "user" ? "أنت (مدير المبيعات)" : "المساعد الذكي CRM"}
                  </span>
                  
                  {/* معالجة مخرجات Markdown البسيطة مثل القوائم والخط العريض */}
                  <p style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}

            {/* مؤشر التحميل والتحليل */}
            {loading && (
              <div className="assistant-bubble bot" style={{ opacity: 0.8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    width: "12px", 
                    height: "12px", 
                    borderRadius: "50%", 
                    background: "var(--primary)", 
                    animation: "pulse 1.2s infinite ease-in-out" 
                  }} />
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>جاري تحليل قاعدة البيانات وصياغة التقرير الإحصائي...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* صندوق المدخلات */}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px" }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا باللغة العربية (مثال: كم عدد العملاء الجاهزين للشراء؟)..." 
              className="form-input" 
              style={{ flexGrow: 1 }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary btn-icon"
              style={{ width: "48px", height: "48px" }}
              disabled={loading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* الجانب الأيسر: أسئلة مقترحة سريعة */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={16} style={{ color: "var(--primary)" }} />
              <span>أسئلة سريعة شائعة</span>
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.4 }}>
              اضغط على أي سؤال بالأسفل ليقوم المساعد الذكي بقراءة قاعدة البيانات والإجابة فوراً:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {suggestedQuestions.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.text)}
                    className="btn btn-secondary"
                    style={{ 
                      textAlign: "right", 
                      fontSize: "0.85rem", 
                      padding: "12px", 
                      justifyContent: "flex-start", 
                      width: "100%", 
                      whiteSpace: "normal",
                      lineHeight: 1.4,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px"
                    }}
                    disabled={loading}
                  >
                    <Icon size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
                    <span>{q.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* بطاقة معلومات الدعم */}
          <div className="glass-panel" style={{ padding: "20px", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong>💡 نصيحة للتحليل:</strong>
            <p style={{ marginTop: "6px" }}>
              يقوم المساعد الذكي بفحص المبيعات والعملاء والمتابعات والاعتراضات المخزنة تلقائياً بواسطة الذكاء الاصطناعي من محادثات الواتساب، مما يتيح لك رؤية دقيقة لحظة بلحظة دون إحصاء يدوي.
            </p>
          </div>
        </section>

      </div>

      {/* كود تعريف التحريك بنمط نبض لـ CSS */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
