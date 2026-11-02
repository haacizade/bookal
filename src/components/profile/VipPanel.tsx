"use client";

import { useActionState } from "react";
import { requestVipAction } from "@/actions/vip";
import type { VipRequestState } from "@/actions/types";
import type { Copy } from "@/lib/copy";

export function VipPanel({ t, errors, dateLocale, active, expiresAt, pendingRequest }: {
  t: Copy["profile"];
  errors: Copy["errors"];
  dateLocale: string;
  active: boolean;
  expiresAt: string | null;
  pendingRequest: boolean;
}) {
  const [state, action, pending] = useActionState<VipRequestState, FormData>(requestVipAction, null);
  const requested = state?.ok || pendingRequest;

  return (
    <section className="pf-card vip-panel">
      <h2>{t.vipTitle}</h2>
      <p className="pf-sub">{t.vipSub}</p>
      <p className="vip-state"><strong>{t.vipStatus}:</strong> {active
        ? `${t.vip} · ${t.vipActiveUntil} ${expiresAt ? new Date(expiresAt).toLocaleDateString(dateLocale) : t.vipInactive}`
        : t.vipInactive}</p>
      {state && !state.ok && <p className="pf-alert bad" role="alert">{errors[state.code]}</p>}
      {!active && (requested
        ? <p className="vip-pending" role="status">{t.vipRequestPending}: {t.vipPending}</p>
        : <form action={action}><button className="btn btn-mustard" disabled={pending}>{pending ? "..." : t.vipRequest}</button></form>)}
    </section>
  );
}