import { createHash, randomBytes } from "node:crypto";
import type { Prisma, PrismaClient, TokenType } from "@prisma/client";
import { prisma } from "./prisma";

type Db = PrismaClient | Prisma.TransactionClient;

const TTL_MS: Record<TokenType, number> = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 60 * 60 * 1000,
};
const RESEND_COOLDOWN_MS = 60 * 1000;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Creates a token, invalidating any unused one. Returns the raw value to put in the email link. */
export async function issueToken(userId: string, type: TokenType) {
  const raw = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.authToken.create({
      data: { userId, type, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + TTL_MS[type]) },
    }),
  ]);
  return raw;
}

/** False if a token of this type was issued in the last minute. */
export async function canIssueToken(userId: string, type: TokenType) {
  const last = await prisma.authToken.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return !last || Date.now() - last.createdAt.getTime() > RESEND_COOLDOWN_MS;
}

/**
 * Atomically marks the token used. The `updateMany` with `usedAt: null` in the WHERE clause
 * means two concurrent requests can never both succeed. Returns the owner's id, or null.
 */
export async function consumeToken(raw: string, type: TokenType, db: Db = prisma) {
  const tokenHash = sha256(raw);
  const { count } = await db.authToken.updateMany({
    where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) return null;
  const row = await db.authToken.findUnique({ where: { tokenHash }, select: { userId: true } });
  return row?.userId ?? null;
}
