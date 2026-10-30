"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import type { AuthState } from "@/actions/types";
import type { Copy } from "@/lib/copy";
import { Alert, Field, SubmitButton } from "./ui";

export function RegisterForm({ t, login, errors, fieldErrors }: {
  t: Copy["register"]; login: Copy["login"]; errors: Copy["errors"]; fieldErrors: Copy["fields"];
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, null);
  const failed = state && !state.ok ? state : null;
  const err = (f: keyof Copy["fields"]) => (failed?.fields?.includes(f) ? fieldErrors[f] : undefined);
  const v = (f: string) => failed?.values?.[f];

  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <h1 className="text-3xl">{t.title}</h1>
        <p className="mt-2 text-sub">{t.sub}</p>
      </div>

      {failed && <Alert>{errors[failed.code]}</Alert>}

      <Field id="name" label={t.name} autoComplete="name" required defaultValue={v("name")} error={err("name")} />
      <Field id="email" type="email" label={login.email} autoComplete="email" required defaultValue={v("email")} error={err("email")} />
      <Field id="password" type="password" label={login.password} autoComplete="new-password" required minLength={8} hint={t.passwordHint} error={err("password")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="university" label={t.university} placeholder={t.universityPh} autoComplete="organization" defaultValue={v("university")} error={err("university")} />
        <Field id="phone" type="tel" label={t.phone} autoComplete="tel" defaultValue={v("phone")} error={err("phone")} />
      </div>
      <SubmitButton pending={pending}>{t.submit}</SubmitButton>

      <p className="text-sm text-sub">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-extrabold text-ink underline decoration-gold decoration-2 underline-offset-4">{t.login}</Link>
      </p>
    </form>
  );
}
