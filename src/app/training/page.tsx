import { prisma } from "@/lib/prisma";
import TrainingClient from "./TrainingClient";
import { Brain } from "lucide-react";

export const revalidate = 0; // تحميل مباشر لحظي لمنع كاش الإعدادات

export default async function TrainingPage() {
  // جلب إرشادات التدريب الحالية لـ علوش ستور
  const trainingRecord = await prisma.aiTraining.findUnique({
    where: { key: "store_rules" },
  });

  const initialContent = trainingRecord?.content || "";

  return (
    <div>
      {/* رأس الصفحة */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
            <Brain size={28} style={{ color: "var(--primary)" }} />
            <span>تدريب وتوجيه الذكاء الاصطناعي</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>درب نموذج المبيعات على منتجاتك وأسعارك وسياسات التعامل مع العملاء في علوش ستور</p>
        </div>
      </header>

      {/* المكون التفاعلي */}
      <TrainingClient initialContent={initialContent} />
    </div>
  );
}
