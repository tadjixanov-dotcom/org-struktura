import { ensureSchema, listProjects, mapProject, pool } from "@/lib/db";
import { bool, fail, ok, requireAuth, str } from "@/lib/api";
import { randomSuffix, slugify } from "@/lib/slug";
import { getTemplate } from "@/lib/templates";
import { autoLayout } from "@/lib/layout";
import type { OrgNode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  try {
    return ok(await listProjects());
  } catch (err) {
    console.error("projects list", err);
    return fail("Malumotlar bazasiga ulanib bolmadi", 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Notogri sorov");
  }

  const name = str(body.name, 160);
  if (!name) return fail("Loyiha nomini kiriting");

  const companyName = str(body.companyName, 160);
  const description = str(body.description, 1200);
  const accent = str(body.accent, 16) ?? "#0071e3";
  const isPublic = bool(body.isPublic, true);
  const template = getTemplate(str(body.template, 40));

  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");

    let slug = slugify(name);
    for (let attempt = 0; attempt < 6; attempt++) {
      const { rows } = await client.query("SELECT 1 FROM projects WHERE slug = $1", [slug]);
      if (rows.length === 0) break;
      slug = `${slugify(name)}-${randomSuffix()}`;
    }

    const { rows: created } = await client.query(
      `INSERT INTO projects (slug, name, company_name, description, accent, is_public)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [slug, name, companyName, description, accent, isPublic]
    );
    const project = mapProject(created[0]);

    // Namunadagi lavozimlarni qo'shamiz
    const keyToId = new Map<string, string>();
    const inserted: OrgNode[] = [];
    let order = 0;
    for (const tn of template.nodes) {
      const parentId = tn.parent ? (keyToId.get(tn.parent) ?? null) : null;
      const { rows } = await client.query(
        `INSERT INTO nodes
           (project_id, parent_id, title, person_name, department, summary,
            duties, responsibilities, authorities, kpis, requirements, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12)
         RETURNING *`,
        [
          project.id,
          parentId,
          tn.title,
          tn.personName ?? null,
          tn.department ?? null,
          tn.summary ?? null,
          JSON.stringify(tn.duties ?? []),
          JSON.stringify(tn.responsibilities ?? []),
          JSON.stringify(tn.authorities ?? []),
          JSON.stringify(tn.kpis ?? []),
          JSON.stringify(tn.requirements ?? []),
          order++,
        ]
      );
      keyToId.set(tn.key, rows[0].id);
      inserted.push({
        id: rows[0].id,
        projectId: project.id,
        parentId,
        title: tn.title,
        personName: null,
        department: null,
        email: null,
        phone: null,
        photoUrl: null,
        summary: null,
        duties: [],
        responsibilities: [],
        authorities: [],
        kpis: [],
        requirements: [],
        accent: null,
        x: 0,
        y: 0,
        sortOrder: 0,
      });
    }

    if (inserted.length > 0) {
      const positions = autoLayout(inserted);
      for (const [id, p] of Object.entries(positions)) {
        await client.query("UPDATE nodes SET x = $1, y = $2 WHERE id = $3", [p.x, p.y, id]);
      }
    }

    await client.query("COMMIT");
    return ok({ ...project, nodeCount: inserted.length }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("project create", err);
    return fail("Loyihani yaratib bolmadi", 500);
  } finally {
    client.release();
  }
}
