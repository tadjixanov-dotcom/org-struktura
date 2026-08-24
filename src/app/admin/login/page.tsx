import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kirish" };

export default async function Page() {
  const session = await getSession();
  if (session) redirect("/admin");
  return <LoginForm />;
}
