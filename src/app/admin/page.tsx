import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProjects } from "@/lib/db";
import { Dashboard } from "@/components/admin/Dashboard";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin panel" };

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  let projects: Project[] = [];
  try {
    projects = await listProjects();
  } catch (err) {
    console.error("admin: loyihalarni o'qib bo'lmadi", err);
  }

  return <Dashboard projects={projects} username={session.username} />;
}
