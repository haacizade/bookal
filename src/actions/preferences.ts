"use server";

import { cookies } from "next/headers";
import type { Locale } from "@/lib/copy";

export async function setLocaleAction(formData: FormData) {
  const value = formData.get("locale");
  if (value !== "az" && value !== "tr" && value !== "en") return;
  (await cookies()).set("lang", value satisfies Locale, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}