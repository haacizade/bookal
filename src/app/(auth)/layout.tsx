import Link from "next/link";
import { getCopy } from "@/lib/copy";

// Book spines on a gold shelf: the same motif as the hero on the current homepage.
const SPINES = [
  { h: 150, w: 34, c: "#26398F" }, { h: 190, w: 28, c: "#A63A4E" }, { h: 130, w: 40, c: "#17706E" },
  { h: 210, w: 30, c: "#6B4FA3" }, { h: 165, w: 36, c: "#D9A441" }, { h: 120, w: 26, c: "#2B3A8C" },
  { h: 185, w: 32, c: "#4B5573" },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getCopy();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[5fr_6fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-b from-hero to-hero-2 px-12 pt-12 text-white lg:flex">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">{t.brand}</Link>
        <div className="max-w-sm pb-12">
          <p className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance">{t.panelTitle}</p>
          <p className="mt-4 text-[#BCC3E8]">{t.panelText}</p>
        </div>
        <div className="relative -mx-12 flex items-end justify-center gap-1 px-12 pb-5" aria-hidden="true">
          {SPINES.map((s, i) => (
            <span key={i} className="rounded-t-[3px] shadow-[inset_3px_0_0_rgb(255_255_255/.14),inset_-5px_0_0_rgb(0_0_0/.22)]"
              style={{ height: s.h, width: s.w, background: s.c }} />
          ))}
          <span className="absolute inset-x-0 bottom-0 h-5 border-t-[3px] border-gold bg-hero-2" />
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block font-display text-2xl font-extrabold tracking-tight lg:hidden">{t.brand}</Link>
          <div className="rounded-[14px] border border-line bg-card p-6 shadow-sm sm:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
