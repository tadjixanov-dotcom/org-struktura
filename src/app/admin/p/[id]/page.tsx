import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProjectById, listNodes } from "@/lib/db";
import { Builder } from "@/components/admin/Builder";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const nodes = await listNodes(project.id);
  return <Builder project={project} nodes={nodes} />;
}
