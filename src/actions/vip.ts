"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveUser } from "@/lib/session";
import type { VipRequestState } from "./types";

export async function requestVipAction(_previous: VipRequestState, _formData: FormData): Promise<VipRequestState> {
  const user = await getActiveUser();
  if (!user) return { ok: false, code: "UNAUTHENTICATED" };

  if (user.isVip && user.vipExpiresAt && user.vipExpiresAt > new Date()) return { ok: false, code: "FORBIDDEN" };
  const pending = await prisma.vipRequest.findFirst({ where: { userId: user.id, status: "PENDING" }, select: { id: true } });
  if (pending) return { ok: false, code: "ALREADY_REQUESTED" };

  try {
    await prisma.vipRequest.create({ data: { userId: user.id } });
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, code: "ALREADY_REQUESTED" };
    }
    console.error("[requestVipAction]", error);
    return { ok: false, code: "GENERIC" };
  }
}