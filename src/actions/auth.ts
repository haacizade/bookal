"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema, loginSchema, resendSchema } from "@/lib/validation";
import { issueToken, canIssueToken, consumeToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { uniqueUsername } from "@/lib/username";
import type { AuthState, ErrorCode } from "./types";

/** Only same-site relative paths, so `?next=` can't be used for open redirects. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/dashboard";
};

async function sendVerification(user: { id: string; email: string; name: string }) {
  if (!(await canIssueToken(user.id, "VERIFY_EMAIL"))) return;   // 1 mail / minute / user
  await sendVerificationEmail(user.email, user.name, await issueToken(user.id, "VERIFY_EMAIL"));
}

// ───────────── register ─────────────
export async function registerAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const input = Object.fromEntries(fd) as Record<string, string>;
  const values = { name: input.name ?? "", email: input.email ?? "", university: input.university ?? "", phone: input.phone ?? "" };

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", fields: Object.keys(parsed.error.flatten().fieldErrors), values };
  }
  const { name, email, password, university, phone } = parsed.data;

  // Same response whether or not the email is taken, so the form can't be used to enumerate accounts.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.emailVerified) await sendVerification(existing);
    redirect(`/check-email?email=${encodeURIComponent(email)}`);
  }

  let created: { id: string; email: string; name: string } | null = null;
  try {
    created = await prisma.user.create({
      data: {
        name, email, university: university || null, phone: phone || null,
        passwordHash: await bcrypt.hash(password, 12),
        username: await uniqueUsername(name),
      },
      select: { id: true, email: true, name: true },
    });
  } catch (e) {
    // lost a race with a parallel sign-up for the same email: treat like "already exists"
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
  if (created) await sendVerification(created);

  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

// ───────────── verify email ─────────────
export async function verifyEmailAction(token: string): Promise<{ ok: boolean }> {
  if (!token || token.length > 200) return { ok: false };
  const ok = await prisma.$transaction(async (tx) => {
    const userId = await consumeToken(token, "VERIFY_EMAIL", tx);
    if (!userId) return false;
    await tx.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
    return true;
  });
  return { ok };
}

// ───────────── resend verification ─────────────
/** Always answers "ok": the response must not reveal whether the address has an account. */
export async function resendVerificationAction(_prev: { ok: true } | null, fd: FormData): Promise<{ ok: true }> {
  const parsed = resendSchema.safeParse({ email: fd.get("email") });
  if (parsed.success) {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user && !user.emailVerified) await sendVerification(user);
  }
  return { ok: true };
}

// ───────────── login / logout ─────────────
export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const values = { email: String(fd.get("email") ?? "") };
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { ok: false, code: "INVALID_CREDENTIALS", values };

  let failure: ErrorCode | null = null;
  try {
    const res: unknown = await signIn("credentials", { ...parsed.data, redirect: false });
    // Depending on how Auth.js is called it either throws or returns /login?error=…&code=…
    if (typeof res === "string" && res.includes("error=")) {
      const q = new URL(res, "http://local").searchParams;
      failure = q.get("error") === "CredentialsSignin" ? mapCode(q.get("code")) : "GENERIC";
    }
  } catch (e) {
    if (!(e instanceof AuthError)) throw e;
    failure = e instanceof CredentialsSignin ? mapCode(e.code) : "GENERIC";
  }
  if (failure) return { ok: false, code: failure, values };

  redirect(safeNext(fd.get("next")));
}

const mapCode = (code: string | null | undefined): ErrorCode =>
  code === "email_not_verified" ? "EMAIL_NOT_VERIFIED" : "INVALID_CREDENTIALS";

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
