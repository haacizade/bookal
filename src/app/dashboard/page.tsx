import Link from "next/link";
import { redirect } from "next/navigation";
import { getCopy } from "@/lib/copy";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Avatar } from "@/components/site/Avatar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";

export default async function DashboardPage() {
  const session = await requireUser();
  const [t, user] = await Promise.all([
    getCopy(),
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        name: true, email: true, username: true, university: true, phone: true, avatarUrl: true,
        role: true, isVip: true, ratingAvg: true, ratingCount: true, createdAt: true,
      },
    }),
  ]);
  if (!user) redirect("/login");

  const p = t.profile;
  const since = new Intl.DateTimeFormat(p.dateLocale, { month: "long", year: "numeric" }).format(user.createdAt);
  const rating = user.ratingCount > 0 ? `★ ${user.ratingAvg.toNumber().toFixed(1)} (${user.ratingCount})` : p.noRating;

  return (
    <div className="bk">
      <SiteHeader t={t} viewer={{ name: user.name, avatarUrl: user.avatarUrl, isVip: user.isVip }} active="profile" />

      <main className="wrap profile bk-grow">
        <Link href="/" className="back-link">← {p.back}</Link>
        <h1>{p.title}</h1>
        <p className="profile-sub">{p.sub}</p>

        <section className="id-card">
          <Avatar name={user.name} src={user.avatarUrl} size={88} />
          <div>
            <div className="id-name">
              {user.name}
              {user.isVip && <span className="vip-badge">{p.vip}</span>}
              {user.role === "ADMIN" && <span className="admin-badge">{p.admin}</span>}
            </div>
            <div className="id-meta">@{user.username} · {user.email}</div>
            <div className="id-tags">
              <span className="id-tag">{p.rating}: {rating}</span>
              <span className="id-tag">{p.memberSince}: {since}</span>
            </div>
          </div>
        </section>

        <ProfileForm
          t={p} errors={t.errors} fieldErrors={t.fields} email={user.email}
          initial={{ name: user.name, university: user.university ?? "", phone: user.phone ?? "", avatarUrl: user.avatarUrl }}
        />
        <PasswordForm t={p} errors={t.errors} fieldErrors={t.fields} />
      </main>

      <footer className="bk-footer">{t.home.footer}</footer>
    </div>
  );
}
