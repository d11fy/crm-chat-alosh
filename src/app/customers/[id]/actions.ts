"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCustomerStatus(id: string, newStatus: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) return { success: false, error: "العميل غير موجود" };

    const oldStatus = customer.status;

    await prisma.$transaction(async (tx) => {
      // تحديث حالة العميل
      await tx.customer.update({
        where: { id },
        data: {
          status: newStatus,
          // إذا أصبحت الحالة عميل، نعدل الاحتمالية لـ 100
          purchaseProbability: newStatus === "Customer" ? 100 : customer.purchaseProbability,
        },
      });

      // إضافة سجل أحداث في حال تم التغيير
      if (oldStatus !== newStatus) {
        await tx.aIEvent.create({
          data: {
            customerId: id,
            oldStatus,
            newStatus,
            reason: "تحديث يدوي من قبل موظف المبيعات.",
            confidence: 100.0,
          },
        });
      }
    });

    revalidatePath(`/customers/${id}`);
    revalidatePath("/");
    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating customer status:", error);
    return { success: false, error: "حدث خطأ أثناء تحديث الحالة" };
  }
}

export async function updateCustomerFollowUp(id: string, dateStr: string) {
  try {
    const date = dateStr ? new Date(dateStr) : null;
    
    await prisma.customer.update({
      where: { id },
      data: {
        followUpDate: date,
      },
    });

    revalidatePath(`/customers/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating follow-up date:", error);
    return { success: false, error: "حدث خطأ أثناء تحديث موعد المتابعة" };
  }
}

export async function addSale(id: string, productName: string, amount: number) {
  try {
    if (!productName || amount <= 0) {
      return { success: false, error: "بيانات المنتج أو القيمة غير صالحة" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. إضافة المبيعة
      await tx.sale.create({
        data: {
          customerId: id,
          productName,
          saleAmount: amount,
          isDetected: false, // مضاف يدوياً
        },
      });

      // 2. تحديث حالة العميل إلى Customer تلقائياً
      const customer = await tx.customer.findUnique({ where: { id } });
      if (customer && customer.status !== "Customer") {
        await tx.customer.update({
          where: { id },
          data: {
            status: "Customer",
            purchaseProbability: 100.0,
          },
        });

        // إضافة سجل الحدث
        await tx.aIEvent.create({
          data: {
            customerId: id,
            oldStatus: customer.status,
            newStatus: "Customer",
            reason: `تم تسجيل مبيعة جديدة يدوياً: ${productName} بقيمة ${amount} شيكل.`,
            confidence: 100.0,
          },
        });
      }
    });

    revalidatePath(`/customers/${id}`);
    revalidatePath("/");
    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    console.error("❌ Error adding sale:", error);
    return { success: false, error: "حدث خطأ أثناء تسجيل المبيعة" };
  }
}
