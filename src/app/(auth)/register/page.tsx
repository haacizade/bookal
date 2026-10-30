import { getCopy } from "@/lib/copy";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const t = await getCopy();
  return <RegisterForm t={t.register} login={t.login} errors={t.errors} fieldErrors={t.fields} />;
}
