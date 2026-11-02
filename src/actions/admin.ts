"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { idSchema } from "@/lib/validation";

const formString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function reviewListingAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formString(formData, "listingId"));
  const status = formString(formData, "status");
  if (!id.success || (status !== "ACTIVE" && status !== "ARCHIVED")) return;

  await prisma.$transaction(async (db) => {
    const updated = await db.listing.updateMany({
      where: { id: id.data, status: status === "ACTIVE" ? "PENDING_APPROVAL" : { in: ["PENDING_APPROVAL", "ACTIVE", "RESERVED"] } },
      data: { status },
    });
    if (updated.count > 0 && status === "ARCHIVED") {
      await db.transaction.updateMany({ where: { listingId: id.data, status: "PENDING" }, data: { status: "CANCELLED" } });
    }
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

export async function setUserSuspendedAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formString(formData, "userId"));
  const isSuspended = formString(formData, "suspend") === "true";
  if (!id.success || id.data === admin.id) return;

  await prisma.user.updateMany({ where: { id: id.data, role: "USER" }, data: { isSuspended } });
  revalidatePath("/admin");
}

export async function reviewVipRequestAction(formData: FormData) {
  await requireAdmin();
  const id = idSchema.safeParse(formString(formData, "requestId"));
  const decision = formString(formData, "decision");
  if (!id.success || (decision !== "APPROVED" && decision !== "REJECTED")) return;

  await prisma.$transaction(async (db) => {
    const request = await db.vipRequest.findUnique({ where: { id: id.data }, select: { userId: true, status: true } });
    if (!request || request.status !== "PENDING") return;
    const changed = await db.vipRequest.updateMany({
      where: { id: id.data, status: "PENDING" },
      data: { status: decision, reviewedAt: new Date() },
    });
    if (changed.count !== 1 || decision !== "APPROVED") return;

    const now = new Date();
    await db.user.update({
      where: { id: request.userId },
      data: {
        isVip: true,
        vipExpiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}