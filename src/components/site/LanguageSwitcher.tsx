"use client";

import { setLocaleAction } from "@/actions/preferences";
import type { Locale } from "@/lib/copy";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={setLocaleAction} className="preference-control">
      <label className="sr-only" htmlFor="site-locale">{label}</label>
      <select id="site-locale" name="locale" value={locale} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
        <option value="az">AZ</option>
        <option value="tr">TR</option>
        <option value="en">EN</option>
      </select>
    </form>
  );
}