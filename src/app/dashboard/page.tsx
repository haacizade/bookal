import { logoutAction } from "@/actions/auth";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-8">
      <h1 className="text-3xl">Salam, {user.name}</h1>
      <p className="text-sub">{user.email} · {user.role}</p>
      <form action={logoutAction}>
        <button className="h-11 rounded-full border-[1.5px] border-line px-5 text-sm font-extrabold hover:border-navy">Çıxış</button>
      </form>
    </main>
  );
}
