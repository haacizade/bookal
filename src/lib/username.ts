import { randomBytes, randomInt } from "node:crypto";
import { prisma } from "./prisma";

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")   // ö→o, ü→u, ç→c, ş→s, ğ→g
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Public profile handle derived from the display name; the user can change it later. */
export async function uniqueUsername(name: string) {
  const base = slugify(name).slice(0, 20) || "user";
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? base : `${base}-${randomInt(1000, 10000)}`;
    const taken = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}
