"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTrainingRules(content: string) {
  try {
    if (!content.trim()) {
      return { success: false, error: "لا يمكن أن تكون التوجيهات فارغة" };
    }

    await prisma.aiTraining.upsert({
      where: { key: "store_rules" },
      update: { content },
      create: {
        key: "store_rules",
        title: "دليل وتدريب الذكاء الاصطناعي - علوش ستور",
        content,
      },
    });

    revalidatePath("/training");
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating training rules:", error);
    return { success: false, error: "حدث خطأ أثناء حفظ التعديلات" };
  }
}
