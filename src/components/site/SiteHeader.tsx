import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import type { Copy } from "@/lib/copy";
import { Avatar } from "./Avatar";
import "@/app/home.css";
import "@/app/profile.css";

export type HeaderViewer = { name: string; avatarUrl: string | null; isVip: boolean } | null;

export function SiteHeader({ t, viewer, active }: { t: Copy; viewer: HeaderViewer; active: "home" | "profile" }) {
  const h = t.home;
  return (
    <header className="bk-header">
      <div className="hd-row">
        <Link href="/" className="logo" aria-label="Bookal">
          <svg className="logo-mark" viewBox="0 0 48 48" role="img" aria-label="Bookal">
            <rect width="48" height="48" rx="12" fill="#16215B" />
            <path d="M12 14.5c4.5-1.6 8.7-1.2 12 1.2v18.2c-3.3-2.4-7.5-2.8-12-1.2z" fill="#D9A441" />
            <path d="M36 14.5c-4.5-1.6-8.7-1.2-12 1.2v18.2c3.3-2.4 7.5-2.8 12-1.2z" fill="#F6E8CB" />
          </svg>
          <span className="logo-text"><span>{t.brand}</span><span>{h.tagline}</span></span>
        </Link>
        <nav className="pagenav">
          <Link href="/" className={active === "home" ? "active" : undefined}>{h.navHome}</Link>
          <Link href="/#elanlar">{h.navListings}</Link>
          {viewer && <Link href="/dashboard" className={active === "profile" ? "active" : undefined}>{t.profile.title}</Link>}
        </nav>
        <div className="hd-right">
          {viewer ? (
            <>
              <Link href="/dashboard" className="pill-user">
                <Avatar name={viewer.name} src={viewer.avatarUrl} size={26} />
                <span className="pill-name">{viewer.name}</span>
                {viewer.isVip && <span className="vip-badge">VIP</span>}
              </Link>
              <form action={logoutAction}><button className="btn btn-ghost">{h.logout}</button></form>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">{h.navLogin}</Link>
          )}
        </div>
      </div>
    </header>
  );
}
