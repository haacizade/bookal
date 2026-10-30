import Link from "next/link";
import { getCopy } from "@/lib/copy";
import { ResendButton } from "@/components/auth/ResendButton";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const [t, { email = "" }] = await Promise.all([getCopy(), searchParams]);
  const c = t.checkEmail;
  const [before, after] = c.body.split("{email}");
  return (
    <div className="space-y-5">
      <h1 className="text-3xl">{c.title}</h1>
      <p>{before}<strong className="break-all">{email}</strong>{after}</p>
      <p className="text-sm text-sub">{c.spam}</p>
      {email && <ResendButton email={email} t={c} />}
      <Link href="/register" className="block text-sm font-bold underline decoration-gold decoration-2 underline-offset-4">{c.wrongEmail}</Link>
    </div>
  );
}
