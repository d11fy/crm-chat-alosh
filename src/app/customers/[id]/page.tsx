import { prisma } from "@/lib/prisma";
import CustomerClient from "./CustomerClient";
import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

export const revalidate = 0; // لضمان جلب البيانات الحديثة دائماً عند التحميل

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  // جلب بيانات العميل وتفاصيله الكاملة من قاعدة البيانات
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      memory: true,
      messages: {
        orderBy: {
          timestamp: "asc",
        },
      },
      sales: {
        orderBy: {
          saleDate: "desc",
        },
      },
      aiEvents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // إذا كان العميل غير موجود
  if (!customer) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
        <UserX size={64} style={{ color: "var(--status-lost)", marginBottom: "20px", opacity: 0.8 }} />
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>العميل غير موجود</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px", marginBottom: "24px" }}>
          عذراً، لم نتمكن من العثور على ملف تعريف العميل المطلوب في النظام.
        </p>
        <Link href="/customers" className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ArrowLeft size={16} />
          <span>العودة لدليل العملاء</span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* رأس الصفحة التفصيلية مع رابط الرجوع */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/customers" className="btn btn-secondary btn-icon" style={{ width: "36px", height: "36px" }}>
              <ArrowLeft size={16} />
            </Link>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>تفاصيل المحادثة والملف التحليلي</h1>
          </div>
        </div>
      </header>

      {/* عرض المكون التفاعلي وإرسال البيانات */}
      <CustomerClient customer={customer} />
    </div>
  );
}
