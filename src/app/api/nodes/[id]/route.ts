import { ensureSchema, listNodes, mapNode, pool } from "@/lib/db";
import { fail, num, ok, requireAuth, str, strList } from "@/lib/api";
import { descendantIds } from "@/lib/tree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const TEXT_FIELDS: Record<string, [string, number]> = {
  title: ["title", 160],
  personName: ["person_name", 160],
  department: ["department", 120],
  email: ["email", 160],
  phone: ["phone", 60],
  photoUrl: ["photo_url", 600],
  summary: ["summary", 2000],
  accent: ["accent", 16],
};

const LIST_FIELDS: Record<string, string> = {
  duties: "duties",
  responsibilities: "responsibilities",
  authorities: "authorities",
  kpis: "kpis",
  requirements: "requirements",
};

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
  const { rows: current } = await pool().query("SELECT * FROM nodes WHERE id = $1", [id]);
  if (!current[0]) return fail("Lavozim topilmadi", 404);
  const projectId: string = current[0].project_id;

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, [column, max]] of Object.entries(TEXT_FIELDS)) {
    if (!(key in body)) continue;
    let value = str(body[key], max);
    if (key === "title" && !value) value = "Nomsiz lavozim";
    sets.push(`${column} = $${i++}`);
    values.push(value);
  }

  for (const [key, column] of Object.entries(LIST_FIELDS)) {
    if (!(key in body)) continue;
    sets.push(`${column} = $${i++}::jsonb`);
    values.push(JSON.stringify(strList(body[key])));
  }

  if ("x" in body) {
    sets.push(`x = $${i++}`);
    values.push(num(body.x, 0));
  }
  if ("y" in body) {
    sets.push(`y = $${i++}`);
    values.push(num(body.y, 0));
  }
  if ("sortOrder" in body) {
    sets.push(`sort_order = $${i++}`);
    values.push(Math.trunc(num(body.sortOrder, 0)));
  }

  if ("parentId" in body) {
    const parentId = str(body.parentId, 64);
    if (parentId === id) return fail("Lavozim ozini ozi boysundira olmaydi", 400);
    if (parentId) {
      const nodes = await listNodes(projectId);
      if (!nodes.some((n) => n.id === parentId)) return fail("Rahbar lavozim topilmadi", 400);
      if (descendantIds(nodes, id).has(parentId))
        return fail("Halqa hosil boladi: boysunuvchini rahbar qilib bolmaydi", 400);
    }
    sets.push(`parent_id = $${i++}`);
    values.push(parentId);
  }

  if (sets.length === 0) return ok(mapNode(current[0]));

  sets.push("updated_at = now()");
  values.push(id);
  const { rows } = await pool().query(
    `UPDATE nodes SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  await pool().query("UPDATE projects SET updated_at = now() WHERE id = $1", [projectId]);
  return ok(mapNode(rows[0]));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id } = await params;
  const mode = new URL(req.url).searchParams.get("mode") ?? "promote";

  await ensureSchema();
  const { rows: current } = await pool().query(
    "SELECT id, project_id, parent_id FROM nodes WHERE id = $1",
    [id]
  );
  if (!current[0]) return fail("Lavozim topilmadi", 404);

  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    if (mode !== "cascade") {
      // Bo'ysunuvchilar yuqori bo'g'inga o'tadi — ma'lumot yo'qolmaydi
      await client.query("UPDATE nodes SET parent_id = $1 WHERE parent_id = $2", [
        current[0].parent_id,
        id,
      ]);
    }
    await client.query("DELETE FROM nodes WHERE id = $1", [id]);
    await client.query("UPDATE projects SET updated_at = now() WHERE id = $1", [current[0].project_id]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("node delete", err);
    return fail("Ochirib bolmadi", 500);
  } finally {
    client.release();
  }

  return ok({ ok: true, nodes: await listNodes(current[0].project_id) });
}
