import { ensureSchema, listNodes, pool } from "@/lib/db";
import { fail, ok, requireAuth } from "@/lib/api";
import { autoLayout } from "@/lib/layout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Avtomatik joylashuvni hisoblab, saqlaydi. */
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id: projectId } = await params;

  let direction: "TB" | "LR" = "TB";
  try {
    const body = await req.json();
    if (body?.direction === "LR") direction = "LR";
  } catch {
    /* tanasiz so'rov ham qabul qilinadi */
  }

  await ensureSchema();
  const nodes = await listNodes(projectId);
  if (nodes.length === 0) return ok([]);

  const positions = autoLayout(nodes, direction);
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    for (const [id, p] of Object.entries(positions)) {
      await client.query("UPDATE nodes SET x = $1, y = $2, updated_at = now() WHERE id = $3", [
        p.x,
        p.y,
        id,
      ]);
    }
    await client.query("UPDATE projects SET updated_at = now() WHERE id = $1", [projectId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("layout", err);
    return fail("Joylashuvni saqlab bolmadi", 500);
  } finally {
    client.release();
  }

  return ok(await listNodes(projectId));
}
