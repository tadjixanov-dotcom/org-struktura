import { Home } from "@/components/Home";
import { listPublicProjects } from "@/lib/db";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  let projects: Project[] = [];
  try {
    projects = await listPublicProjects();
  } catch (err) {
    console.error("Bosh sahifa: bazaga ulanib bo'lmadi", err);
  }
  return <Home projects={projects} />;
}
