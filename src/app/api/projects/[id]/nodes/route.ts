import { ensureSchema, listNodes, mapNode, pool } from "@/lib/db";
import { fail, num, ok, requireAuth, str, strList } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id } = await params;
  return ok(await listNodes(id));
}

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id: projectId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Notogri sorov");
  }

  const title = str(body.title, 160) ?? "Yangi lavozim";
  const parentId = str(body.parentId, 64);

  await ensureSchema();

  if (parentId) {
    const { rows } = await pool().query("SELECT 1 FROM nodes WHERE id = $1 AND project_id = $2", [
      parentId,
      projectId,
    ]);
    if (rows.length === 0) return fail("Rahbar lavozim topilmadi", 400);
  }

  const { rows: orderRows } = await pool().query(
    "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM nodes WHERE project_id = $1",
    [projectId]
  );

  const { rows } = await pool().query(
    `INSERT INTO nodes
      (project_id, parent_id, title, person_name, department, email, phone, photo_url, summary,
       duties, responsibilities, authorities, kpis, requirements, accent, x, y, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16,$17,$18)
     RETURNING *`,
    [
      projectId,
      parentId,
      title,
      str(body.personName, 160),
      str(body.department, 120),
      str(body.email, 160),
      str(body.phone, 60),
      str(body.photoUrl, 600),
      str(body.summary, 1500),
      JSON.stringify(strList(body.duties)),
      JSON.stringify(strList(body.responsibilities)),
      JSON.stringify(strList(body.authorities)),
      JSON.stringify(strList(body.kpis)),
      JSON.stringify(strList(body.requirements)),
      str(body.accent, 16),
      num(body.x, 0),
      num(body.y, 0),
      Number(orderRows[0].next) || 0,
    ]
  );

  await pool().query("UPDATE projects SET updated_at = now() WHERE id = $1", [projectId]);
  return ok(mapNode(rows[0]), { status: 201 });
}
