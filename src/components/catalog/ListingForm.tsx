"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createListingAction } from "@/actions/listings";
import type { CreateListingState } from "@/actions/types";
import type { Copy } from "@/lib/copy";
import { TEXTBOOK_GENRE_SLUG } from "@/lib/listing-params";

type Option = { id: number; slug: string };

export function ListingForm({ t, errors, fields, genres, subjects, genreLabels, initialPhone }: {
  t: Copy["listing"];
  errors: Copy["errors"];
  fields: Copy["fields"];
  genres: Option[];
  subjects: Option[];
  genreLabels: Copy["home"]["genres"];
  initialPhone: string;
}) {
  const [state, action, pending] = useActionState<CreateListingState, FormData>(createListingAction, null);
  const failed = state && !state.ok ? state : null;
  const err = (name: keyof Copy["fields"]) => failed?.fields?.includes(name) ? fields[name] : null;
  const value = (name: string) => failed?.values?.[name] ?? "";
  const [genreId, setGenreId] = useState<string>(value("genreId"));
  const isTextbook = genres.some((g) => String(g.id) === genreId && g.slug === TEXTBOOK_GENRE_SLUG);

  if (state?.ok) {
    return (
      <div className="listing-success" role="status">
        <h2>{t.success}</h2>
        <Link href="/" className="btn btn-primary">{t.back}</Link>
      </div>
    );
  }

  return (
    <form action={action} className="listing-form" noValidate>
      {failed && failed.code !== "VALIDATION" && <p className="pf-alert bad" role="alert">{errors[failed.code]}</p>}
      <div className="listing-form-grid">
        <Field name="title" label={t.titleLabel} error={err("title")} defaultValue={value("title")} />
        <Field name="author" label={t.author} error={err("author")} defaultValue={value("author")} />
        <Field name="genreId" label={t.category} error={err("genreId")} select defaultValue={value("genreId")} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGenreId(e.target.value)}>
          <option value="">{t.choose}</option>
          {genres.map((genre) => <option key={genre.id} value={genre.id}>{genreLabels[genre.slug as keyof typeof genreLabels] ?? genre.slug}</option>)}
        </Field>
        {isTextbook && (
          <Field name="subjectId" label={t.subject} error={err("subjectId")} select defaultValue={value("subjectId")}>
            <option value="">{t.choose}</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{t.subjectNames[subject.slug as keyof typeof t.subjectNames] ?? subject.slug}</option>)}
          </Field>
        )}
        <Field name="language" label={t.language} error={err("language")} select defaultValue={value("language")}>
          <option value="">{t.choose}</option>
          {Object.entries(t.languageNames).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </Field>
        <Field name="condition" label={t.condition} error={err("condition")} select defaultValue={value("condition")}>
          <option value="">{t.choose}</option>
          <option value="NEW">{t.newCondition}</option><option value="USED">{t.usedCondition}</option><option value="HIGHLIGHTED">{t.highlighted}</option>
        </Field>
        <Field name="type" label={t.type} error={err("type")} select defaultValue={value("type") || "SALE"}>
          <option value="SALE">{t.sale}</option><option value="EXCHANGE">{t.exchange}</option>
        </Field>
        <Field name="price" label={t.price} error={err("price")} defaultValue={value("price")} type="number" min="0" max="9999.99" step="0.01" />
        <Field name="coverUrl" label={t.image} error={err("coverUrl")} defaultValue={value("coverUrl")} type="url" placeholder="https://..." />
        <Field name="phone" label={t.phone} error={err("phone")} defaultValue={value("phone") || initialPhone} type="tel" autoComplete="tel" />
        <div className="listing-field listing-field-wide">
          <label htmlFor="description">{t.description}</label>
          <textarea id="description" name="description" defaultValue={value("description")} maxLength={2000} rows={5} />
          {err("description") && <span className="pf-err">{err("description")}</span>}
        </div>
      </div>
      <p className="pf-hint">{t.phoneHint}</p>
      <div className="pf-actions">
        <button className="btn btn-primary" disabled={pending}>{pending ? "..." : t.submit}</button>
        <Link href="/" className="btn btn-ghost">{t.back}</Link>
      </div>
    </form>
  );
}

function Field({ name, label, error, defaultValue, type = "text", select = false, children, onChange, ...inputProps }: {
  name: string;
  label: string;
  error: string | null;
  defaultValue?: string;
  type?: string;
  select?: boolean;
  children?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  [key: string]: unknown;
}) {
  const id = `listing-${name}`;
  return (
    <div className="listing-field">
      <label htmlFor={id}>{label}</label>
      {select
        ? <select id={id} name={name} defaultValue={defaultValue} aria-invalid={!!error} onChange={onChange}>{children}</select>
        : <input id={id} name={name} type={type} defaultValue={defaultValue} aria-invalid={!!error} {...inputProps as React.InputHTMLAttributes<HTMLInputElement>} />}
      {error && <span className="pf-err">{error}</span>}
    </div>
  );
}