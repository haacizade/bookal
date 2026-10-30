import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Server-side guard for pages/actions. JWT role/isVip can be stale: re-read the DB for admin-only work. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Guard for Server Actions that return a result instead of redirecting.
 * Returns null when logged out. Re-reads the DB because the JWT lives up to 30 days and would
 * otherwise keep working for a deleted account; `role`/`isVip` here are therefore always fresh.
 */
export async function getActiveUser() {
  const id = (await auth())?.user?.id;
  if (!id) return null;
  return prisma.user.findFirst({
    where: { id, emailVerified: { not: null } },
    select: { id: true, role: true, isVip: true },
  });
}
