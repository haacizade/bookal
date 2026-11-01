import Link from "next/link";
import type { Copy } from "@/lib/copy";

/** Blurred placeholders (no real data) with a sign-up call to action on top. */
export function GuestLock({ t, hidden }: { t: Copy["home"]; hidden: number }) {
  const text = hidden > 0 ? t.lockText.replace("{n}", String(hidden)) : t.lockTextNoCount;
  return (
    <section className="lock">
      <div className="lock-ghost" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => <div key={i} />)}
      </div>
      <div className="lock-cta">
        <div className="lock-box">
          <h2>{t.lockTitle}</h2>
          <p>{text}</p>
          <div className="lock-actions">
            <Link href="/register" className="btn btn-primary">{t.register}</Link>
            <Link href="/login?next=%2F" className="btn btn-ghost">{t.login}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
