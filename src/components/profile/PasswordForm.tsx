"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/actions/profile";
import type { AuthState } from "@/actions/types";
import type { Copy } from "@/lib/copy";

export function PasswordForm({ t, errors, fieldErrors }: { t: Copy["profile"]; errors: Copy["errors"]; fieldErrors: Copy["fields"] }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(changePasswordAction, null);
  const failed = state && !state.ok ? state : null;
  const err = (f: keyof Copy["fields"]) => (failed?.fields?.includes(f) ? fieldErrors[f] : undefined);

  return (
    <form action={action} className="pf-card" noValidate>
      <h2>{t.passwordTitle}</h2>
      <p className="pf-sub">{t.passwordSub}</p>

      {state?.ok && <div className="pf-alert ok" role="status">{t.passwordChanged}</div>}
      {failed && failed.code !== "VALIDATION" && failed.code !== "WRONG_PASSWORD" && <div className="pf-alert bad" role="alert">{errors[failed.code]}</div>}

      <label className="pf-label" htmlFor="currentPassword">{t.currentPassword}</label>
      <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required
        className={`pf-input${failed?.code === "WRONG_PASSWORD" || err("currentPassword") ? " bad" : ""}`} />
      {failed?.code === "WRONG_PASSWORD" ? <p className="pf-err">{errors.WRONG_PASSWORD}</p>
        : err("currentPassword") && <p className="pf-err">{err("currentPassword")}</p>}

      <label className="pf-label" htmlFor="password">{t.newPassword}</label>
      <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8}
        className={`pf-input${err("password") ? " bad" : ""}`} />
      {err("password") ? <p className="pf-err">{err("password")}</p> : <p className="pf-hint">{t.newPasswordHint}</p>}

      <div className="pf-actions">
        <button className="btn btn-primary" disabled={pending}>{t.changePassword}</button>
      </div>
    </form>
  );
}
