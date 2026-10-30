import { getCopy } from "@/lib/copy";
import { VerifyEmail } from "@/components/auth/VerifyEmail";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [t, { token = "" }] = await Promise.all([getCopy(), searchParams]);
  return <VerifyEmail token={token} t={t.verify} />;
}
