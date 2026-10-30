"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import type { AuthState } from "@/actions/types";
import type { Copy } from "@/lib/copy";
import { Alert, Field, SubmitButton } from "./ui";
import { ResendButton } from "./ResendButton";

export function LoginForm({ t, errors, checkEmail, next, verified }: {
  t: Copy["login"]; errors: Copy["errors"]; checkEmail: Copy["checkEmail"]; next?: string; verified?: boolean;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);
  const failed = state && !state.ok ? state : null;

  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <h1 className="text-3xl">{t.title}</h1>
        <p className="mt-2 text-sub">{t.sub}</p>
      </div>

      {verified && !failed && <Alert tone="info">{t.verifiedBanner}</Alert>}
      {failed && <Alert>{errors[failed.code]}</Alert>}

      {next && <input type="hidden" name="next" value={next} />}
      <Field id="email" type="email" label={t.email} autoComplete="email" required defaultValue={failed?.values?.email} />
      <Field id="password" type="password" label={t.password} autoComplete="current-password" required />
      <SubmitButton pending={pending}>{t.submit}</SubmitButton>

      {failed?.code === "EMAIL_NOT_VERIFIED" && failed.values?.email && (
        <ResendButton email={failed.values.email} t={checkEmail} />
      )}

      <p className="text-sm text-sub">
        {t.noAccount}{" "}
        <Link href="/register" className="font-extrabold text-ink underline decoration-gold decoration-2 underline-offset-4">{t.register}</Link>
      </p>
    </form>
  );
}
