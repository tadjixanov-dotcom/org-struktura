import { createSession, verifyCredentials } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = rateLimit(`login:${clientIp(req)}`, 8, 60_000);
  if (!gate.ok) {
    return fail(
      `Juda ko'p urinish. ${gate.retryAfter} soniyadan keyin qayta urinib ko'ring.`,
      429
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return fail("Notogri sorov");
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  if (!username || !password) return fail("Login va parolni kiriting");

  try {
    const session = await verifyCredentials(username, password);
    if (!session) return fail("Login yoki parol notogri", 401);
    await createSession(session);
    return ok({ ok: true, username: session.username });
  } catch (err) {
    console.error("login error", err);
    return fail("Server xatosi. Malumotlar bazasi ulanishini tekshiring.", 500);
  }
}
