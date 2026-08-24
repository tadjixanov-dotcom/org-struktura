import { ensureSchema, getProjectById, mapProject, pool } from "@/lib/db";
import { bool, fail, ok, requireAuth, str } from "@/lib/api";
import { randomSuffix, slugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return fail("Loyiha topilmadi", 404);
  return ok(project);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Notogri sorov");
  }

  await ensureSchema();
  const existing = await getProjectById(id);
  if (!existing) return fail("Loyiha topilmadi", 404);

  const name = "name" in body ? (str(body.name, 160) ?? existing.name) : existing.name;
  const companyName = "companyName" in body ? str(body.companyName, 160) : existing.companyName;
  const description = "description" in body ? str(body.description, 1200) : existing.description;
  const logoUrl = "logoUrl" in body ? str(body.logoUrl, 600) : existing.logoUrl;
  const accent = "accent" in body ? (str(body.accent, 16) ?? existing.accent) : existing.accent;
  const isPublic = "isPublic" in body ? bool(body.isPublic, existing.isPublic) : existing.isPublic;

  let slug = existing.slug;
  const requested = str(body.slug, 60);
  if (requested && slugify(requested) !== existing.slug) {
    slug = slugify(requested);
    const { rows } = await pool().query("SELECT 1 FROM projects WHERE slug = $1 AND id <> $2", [slug, id]);
    if (rows.length > 0) slug = `${slug}-${randomSuffix()}`;
  }

  const { rows } = await pool().query(
    `UPDATE projects SET name=$1, company_name=$2, description=$3, logo_url=$4,
       accent=$5, is_public=$6, slug=$7, updated_at=now()
     WHERE id=$8 RETURNING *`,
    [name, companyName, description, logoUrl, accent, isPublic, slug, id]
  );
  return ok(mapProject(rows[0]));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id } = await params;
  await ensureSchema();
  await pool().query("DELETE FROM projects WHERE id = $1", [id]);
  return ok({ ok: true });
}
