import { getCopy } from "@/lib/copy";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [t, q] = await Promise.all([getCopy(), searchParams]);
  return <LoginForm t={t.login} errors={t.errors} next={q.next} />;
}
