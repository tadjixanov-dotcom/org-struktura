import { ensureSchema, pool } from "@/lib/db";
import { fail, ok, requireAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Bir nechta tugun koordinatalarini bitta so'rovda saqlaydi (undo uchun). */
export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  const { id: projectId } = await params;

  let body: { positions?: Record<string, { x?: unknown; y?: unknown }> };
  try {
    body = await req.json();
  } catch {
    return fail("Notogri sorov");
  }

  const entries = Object.entries(body.positions ?? {}).slice(0, 500);
  if (entries.length === 0) return ok({ ok: true, updated: 0 });

  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    let updated = 0;
    for (const [nodeId, pos] of entries) {
      const x = Number(pos?.x);
      const y = Number(pos?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const res = await client.query(
        "UPDATE nodes SET x = $1, y = $2, updated_at = now() WHERE id = $3 AND project_id = $4",
        [x, y, nodeId, projectId]
      );
      updated += res.rowCount ?? 0;
    }
    await client.query("UPDATE projects SET updated_at = now() WHERE id = $1", [projectId]);
    await client.query("COMMIT");
    return ok({ ok: true, updated });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("positions", err);
    return fail("Joylashuvni saqlab bolmadi", 500);
  } finally {
    client.release();
  }
}
