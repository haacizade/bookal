"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfileAction } from "@/actions/profile";
import type { AuthState } from "@/actions/types";
import type { Copy } from "@/lib/copy";
import { Avatar } from "@/components/site/Avatar";

const SIZE = 256;
const MAX_CHARS = 100_000;

/** Centre-crops the picked image to a square, scales it to 256px and returns a small JPEG data URL. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  const side = Math.min(bmp.width, bmp.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bmp.close();
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error("too large");
}

export function ProfileForm({ t, errors, fieldErrors, initial, email }: {
  t: Copy["profile"]; errors: Copy["errors"]; fieldErrors: Copy["fields"];
  initial: { name: string; university: string; phone: string; avatarUrl: string | null };
  email: string;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updateProfileAction, null);
  const failed = state && !state.ok ? state : null;
  const saved = state?.ok === true;

  const [picked, setPicked] = useState<string | null>(null);   // new photo, not saved yet
  const [removed, setRemoved] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (saved) { setPicked(null); setRemoved(false); } }, [saved, state]);

  const shown = removed ? null : (picked ?? initial.avatarUrl);
  const err = (f: keyof Copy["fields"]) => (failed?.fields?.includes(f) ? fieldErrors[f] : undefined);
  const v = (f: "name" | "university" | "phone") => failed?.values?.[f] ?? initial[f];

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(false);
    try {
      setPicked(await toAvatarDataUrl(file));
      setRemoved(false);
    } catch {
      setPhotoError(true);
    }
  }

  return (
    <form action={action} className="pf-card" noValidate>
      <h2>{t.infoTitle}</h2>
      <p className="pf-sub">{t.infoSub}</p>

      {saved && <div className="pf-alert ok" role="status">{t.saved}</div>}
      {failed && failed.code !== "VALIDATION" && <div className="pf-alert bad" role="alert">{errors[failed.code]}</div>}

      <div className="pf-photo">
        <Avatar name={v("name") || initial.name} src={shown} size={84} />
        <div>
          <strong className="pf-label-strong">{t.photo}</strong>
          <div className="pf-actions tight">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>{t.changePhoto}</button>
            {shown && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPicked(null); setRemoved(true); }}>{t.removePhoto}</button>}
          </div>
          <p className="pf-hint">{t.photoHint}</p>
          {(photoError || err("avatar")) && <p className="pf-err">{fieldErrors.avatar}</p>}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPick} />
        <input type="hidden" name="avatar" value={picked ?? ""} />
        <input type="hidden" name="removeAvatar" value={removed ? "1" : ""} />
      </div>

      <label className="pf-label" htmlFor="name">{t.name}</label>
      <input id="name" name="name" className={`pf-input${err("name") ? " bad" : ""}`} defaultValue={v("name")} autoComplete="name" required />
      {err("name") && <p className="pf-err">{err("name")}</p>}

      <label className="pf-label" htmlFor="email">{t.email}</label>
      <input id="email" className="pf-input" value={email} readOnly disabled />
      <p className="pf-hint">{t.emailHint}</p>

      <div className="pf-grid">
        <div>
          <label className="pf-label" htmlFor="phone">{t.phone}</label>
          <input id="phone" name="phone" type="tel" className={`pf-input${err("phone") ? " bad" : ""}`} defaultValue={v("phone")} placeholder={t.phonePh} autoComplete="tel" />
          {err("phone") ? <p className="pf-err">{err("phone")}</p> : <p className="pf-hint">{t.phoneHint}</p>}
        </div>
        <div>
          <label className="pf-label" htmlFor="university">{t.university}</label>
          <input id="university" name="university" className={`pf-input${err("university") ? " bad" : ""}`} defaultValue={v("university")} placeholder={t.universityPh} autoComplete="organization" />
          {err("university") && <p className="pf-err">{err("university")}</p>}
        </div>
      </div>

      <div className="pf-actions">
        <button className="btn btn-primary" disabled={pending}>{t.save}</button>
      </div>
    </form>
  );
}
