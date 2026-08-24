import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { ensureSchema, pool } from "./db";

const COOKIE_NAME = "org_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 kun

export type Session = { sub: string; username: string; name: string | null };

function secretKey() {
  const raw = process.env.AUTH_SECRET || "org-struktura-local-dev-secret-key-32+";
  return new TextEncoder().encode(raw.padEnd(32, "0"));
}

export async function verifyCredentials(username: string, password: string): Promise<Session | null> {
  await ensureSchema();
  const { rows } = await pool().query(
    `SELECT id, username, password_hash, full_name FROM admins WHERE lower(username) = lower($1)`,
    [username.trim()]
  );
  const row = rows[0];
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return { sub: row.id, username: row.username, name: row.full_name };
}

export async function createSession(session: Session) {
  const token = await new SignJWT({ username: session.username, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: String(payload.sub),
      username: String(payload.username ?? ""),
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function changePassword(adminId: string, current: string, next: string) {
  await ensureSchema();
  const { rows } = await pool().query(`SELECT password_hash FROM admins WHERE id = $1`, [adminId]);
  if (!rows[0]) return { ok: false, error: "Foydalanuvchi topilmadi" };
  const ok = await bcrypt.compare(current, rows[0].password_hash);
  if (!ok) return { ok: false, error: "Joriy parol noto'g'ri" };
  if (next.length < 6) return { ok: false, error: "Yangi parol kamida 6 ta belgidan iborat bo'lsin" };
  const hash = await bcrypt.hash(next, 10);
  await pool().query(`UPDATE admins SET password_hash = $1 WHERE id = $2`, [hash, adminId]);
  return { ok: true as const };
}
