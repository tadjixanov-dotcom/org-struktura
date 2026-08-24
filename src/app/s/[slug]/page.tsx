import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectBySlug, listNodes } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { StructureViewer } from "@/components/org/StructureViewer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await getProjectBySlug(slug);
    if (!project) return { title: "Topilmadi" };
    return {
      title: project.companyName || project.name,
      description:
        project.description ?? `${project.companyName || project.name} tashkiliy tuzilmasi.`,
    };
  } catch {
    return { title: "Struktura" };
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  if (!project.isPublic) {
    const session = await getSession();
    if (!session) notFound();
  }

  const nodes = await listNodes(project.id);
  return <StructureViewer project={project} nodes={nodes} />;
}
