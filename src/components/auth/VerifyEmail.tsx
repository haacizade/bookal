"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { verifyEmailAction } from "@/actions/auth";
import type { Copy } from "@/lib/copy";

/**
 * The token is consumed from here (a client-side effect), not from the page's server render:
 * mail scanners that pre-fetch links don't run JavaScript, so they can't burn the one-time token.
 */
export function VerifyEmail({ token, t }: { token: string; t: Copy["verify"] }) {
  const [status, setStatus] = useState<"pending" | "ok" | "fail">(token ? "pending" : "fail");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;           // guard: React StrictMode runs effects twice in dev
    started.current = true;
    verifyEmailAction(token).then((r) => setStatus(r.ok ? "ok" : "fail"), () => setStatus("fail"));
  }, [token]);

  if (status === "pending") return <p role="status" className="text-sub">{t.pending}</p>;

  const ok = status === "ok";
  return (
    <div className="space-y-5" role="status">
      <h1 className="text-3xl">{ok ? t.okTitle : t.failTitle}</h1>
      <p className="text-sub">{ok ? t.okBody : t.failBody}</p>
      <Link
        href={ok ? "/login?verified=1" : "/login"}
        className="inline-flex h-12 items-center rounded-full bg-navy px-6 text-sm font-extrabold text-on-navy transition hover:shadow-pop"
      >
        {ok ? t.okCta : t.failCta}
      </Link>
    </div>
  );
}
