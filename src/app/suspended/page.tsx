import { logoutAction } from "@/actions/auth";
import { getCopy } from "@/lib/copy";

export default async function SuspendedPage() {
  const t = await getCopy();
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center">
      <section className="max-w-md">
        <h1 className="text-3xl font-bold">{t.profile.suspendedTitle}</h1>
        <p className="mt-3 text-sub">{t.profile.suspendedText}</p>
        <form action={logoutAction} className="mt-6">
          <button className="rounded-lg bg-navy px-5 py-3 font-bold text-on-navy">{t.home.logout}</button>
        </form>
      </section>
    </main>
  );
}