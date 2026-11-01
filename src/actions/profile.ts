"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AVATAR_MAX_CHARS, AVATAR_RE, passwordChangeSchema, profileSchema } from "@/lib/validation";
import type { AuthState } from "./types";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

/** Name, university, phone and profile photo. Email and username are not editable. */
export async function updateProfileAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const id = (await auth())?.user?.id;
  if (!id) return { ok: false, code: "UNAUTHENTICATED" };

  const values = { name: str(fd.get("name")), university: str(fd.get("university")), phone: str(fd.get("phone")) };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", fields: Object.keys(parsed.error.flatten().fieldErrors), values };
  }

  // undefined = leave the photo alone, null = remove it, string = replace it
  let avatarUrl: string | null | undefined;
  const avatar = str(fd.get("avatar"));
  if (str(fd.get("removeAvatar")) === "1") avatarUrl = null;
  else if (avatar) {
    if (avatar.length > AVATAR_MAX_CHARS || !AVATAR_RE.test(avatar)) {
      return { ok: false, code: "VALIDATION", fields: ["avatar"], values };
    }
    avatarUrl = avatar;
  }

  const { name, university, phone } = parsed.data;
  try {
    await prisma.user.update({
      where: { id },
      data: { name, university: university || null, phone: phone || null, ...(avatarUrl !== undefined && { avatarUrl }) },
    });
  } catch {
    return { ok: false, code: "GENERIC", values };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePasswordAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const id = (await auth())?.user?.id;
  if (!id) return { ok: false, code: "UNAUTHENTICATED" };

  const parsed = passwordChangeSchema.safeParse({ currentPassword: str(fd.get("currentPassword")), password: str(fd.get("password")) });
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", fields: Object.keys(parsed.error.flatten().fieldErrors) };
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true } });
  if (!user) return { ok: false, code: "UNAUTHENTICATED" };
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { ok: false, code: "WRONG_PASSWORD", fields: ["currentPassword"] };
  }

  try {
    await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } });
  } catch {
    return { ok: false, code: "GENERIC" };
  }
  return { ok: true };
}
