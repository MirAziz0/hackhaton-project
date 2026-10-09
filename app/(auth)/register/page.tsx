import { AuthForm } from "@/components/auth/auth-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("Qeydiyyat")} — Growenta` };
}

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
