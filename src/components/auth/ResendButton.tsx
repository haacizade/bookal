"use client";

import { useActionState, useEffect, useState } from "react";
import { resendVerificationAction } from "@/actions/auth";
import type { Copy } from "@/lib/copy";

export function ResendButton({ email, t }: { email: string; t: Copy["checkEmail"] }) {
  const [state, action, pending] = useActionState(resendVerificationAction, null);
  const [left, setLeft] = useState(0);

  // client-side cooldown mirrors the 60 s server throttle
  useEffect(() => {
    if (!state) return;
    setLeft(60);
    const id = setInterval(() => setLeft((s) => (s <= 1 ? (clearInterval(id), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [state]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit" disabled={pending || left > 0}
        className="h-11 rounded-full border-[1.5px] border-line px-5 text-sm font-extrabold transition-colors hover:border-navy disabled:opacity-60"
      >
        {left > 0 ? t.resendWait.replace("{s}", String(left)) : t.resend}
      </button>
      {state && <p role="status" className="text-sm text-sub">{t.resendOk}</p>}
    </form>
  );
}
