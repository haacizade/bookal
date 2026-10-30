import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  id, label, error, hint, ...input
}: { id: string; label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const note = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">{label}</label>
      <input
        id={id} name={id} aria-invalid={!!error} aria-describedby={note}
        className={`h-12 w-full rounded-[10px] border bg-bg px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-sub/70 focus-visible:ring-[3px] focus-visible:ring-gold ${error ? "border-danger" : "border-line focus-visible:border-navy"}`}
        {...input}
      />
      {error ? <p id={`${id}-err`} className="mt-1.5 text-sm font-semibold text-danger">{error}</p>
        : hint ? <p id={`${id}-hint`} className="mt-1.5 text-sm text-sub">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit" disabled={pending}
      className="h-12 w-full rounded-full bg-navy px-5 text-sm font-extrabold text-on-navy transition hover:shadow-pop disabled:opacity-60 motion-safe:active:scale-[.97]"
    >
      {children}
    </button>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[10px] border px-4 py-3 text-sm font-semibold ${tone === "error" ? "border-danger/40 bg-danger/10 text-danger" : "border-gold/50 bg-gold-soft text-ink"}`}
    >
      {children}
    </div>
  );
}
