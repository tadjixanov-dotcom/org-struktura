import { notFound } from "next/navigation";
import { getProjectBySlug, listNodes } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PrintReport } from "@/components/org/PrintReport";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { slug } = await params;
  const { auto } = await searchParams;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  if (!project.isPublic) {
    const session = await getSession();
    if (!session) notFound();
  }

  const nodes = await listNodes(project.id);
  return <PrintReport project={project} nodes={nodes} autoPrint={auto !== "0"} />;
}
