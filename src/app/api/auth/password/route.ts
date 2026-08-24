import { changePassword } from "@/lib/auth";
import { fail, ok, requireAuth } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  let body: { current?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Notogri sorov");
  }

  const result = await changePassword(auth.session.sub, body.current ?? "", body.next ?? "");
  if (!result.ok) return fail(result.error ?? "Xatolik", 400);
  return ok({ ok: true });
}
