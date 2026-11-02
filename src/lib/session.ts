import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Server-side guard for pages/actions. JWT role/isVip can be stale: re-read the DB for admin-only work. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = await prisma.user.findFirst({
    where: { id: session.user.id, isSuspended: false },
    select: { id: true, role: true, isVip: true },
  });
  if (!user) redirect("/suspended");
  return user;
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
    where: { id, isSuspended: false },
    select: { id: true, role: true, isVip: true, vipExpiresAt: true, phone: true },
  });
}

/** Fresh name / avatar / VIP flag for the header (the JWT copy goes stale after a profile edit). Null when logged out. */
export async function getViewer() {
  const id = (await auth())?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, avatarUrl: true, isVip: true, vipExpiresAt: true, role: true, isSuspended: true } });
  if (!user) return null;
  return { ...user, isVip: user.isVip && !!user.vipExpiresAt && user.vipExpiresAt > new Date() };
}

export async function requireAdmin() {
  const user = await getActiveUser();
  if (!user || user.role !== "ADMIN") redirect("/");
  return user;
}
