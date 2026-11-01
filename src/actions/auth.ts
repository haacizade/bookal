"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema, loginSchema } from "@/lib/validation";
import { uniqueUsername } from "@/lib/username";
import type { AuthState, ErrorCode } from "./types";

/** Only same-site relative paths, so `?next=` can't be used for open redirects. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
};

/** Signs the user in with email + password. Returns null on success, or the error code to show. */
async function signInWithPassword(email: string, password: string): Promise<ErrorCode | null> {
  try {
    const res: unknown = await signIn("credentials", { email, password, redirect: false });
    // Depending on how Auth.js is called it either throws or returns /login?error=…&code=…
    if (typeof res === "string" && res.includes("error=")) {
      const q = new URL(res, "http://local").searchParams;
      return q.get("error") === "CredentialsSignin" ? "INVALID_CREDENTIALS" : "GENERIC";
    }
    return null;
  } catch (e) {
    if (!(e instanceof AuthError)) throw e;
    return e instanceof CredentialsSignin ? "INVALID_CREDENTIALS" : "GENERIC";
  }
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

  const emailTaken = (): AuthState => ({ ok: false, code: "EMAIL_TAKEN", fields: ["email"], values });
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return emailTaken();

  const passwordHash = await bcrypt.hash(password, 12);
  let created = false;
  // Two attempts: a P2002 can be the email (lost a race with a parallel sign-up) or the generated username.
  for (let attempt = 0; attempt < 2 && !created; attempt++) {
    try {
      await prisma.user.create({
        data: {
          name, email, passwordHash, university: university || null, phone: phone || null,
          username: await uniqueUsername(name),
        },
      });
      created = true;
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return emailTaken();
    }
  }
  if (!created) return { ok: false, code: "GENERIC", values };

  // The account is active immediately: sign in right away.
  const failure = await signInWithPassword(email, password);
  redirect(failure ? "/login" : "/");
}

// ───────────── login / logout ─────────────
export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const values = { email: String(fd.get("email") ?? "") };
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { ok: false, code: "INVALID_CREDENTIALS", values };

  const failure = await signInWithPassword(parsed.data.email, parsed.data.password);
  if (failure) return { ok: false, code: failure, values };

  redirect(safeNext(fd.get("next")));
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
