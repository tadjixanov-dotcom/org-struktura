import { Pool } from "pg";
import bcrypt from "bcryptjs";
import type { OrgNode, Project } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __orgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __orgSchemaReady: Promise<void> | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL o'rnatilmagan. Railway'da Postgres qo'shing yoki .env.local faylida ko'rsating."
    );
  }
  const isLocal = /localhost|127\.0\.0\.1|\.railway\.internal/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  });
}

export function pool(): Pool {
  if (!global.__orgPool) global.__orgPool = createPool();
  return global.__orgPool;
}

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username     text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  company_name text,
  description  text,
  logo_url     text,
  accent       text NOT NULL DEFAULT '#0071e3',
  is_public    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nodes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id    uuid REFERENCES nodes(id) ON DELETE CASCADE,
  title        text NOT NULL,
  person_name  text,
  department   text,
  email        text,
  phone        text,
  photo_url    text,
  summary      text,
  duties           jsonb NOT NULL DEFAULT '[]'::jsonb,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  authorities      jsonb NOT NULL DEFAULT '[]'::jsonb,
  kpis             jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements     jsonb NOT NULL DEFAULT '[]'::jsonb,
  accent       text,
  x            double precision NOT NULL DEFAULT 0,
  y            double precision NOT NULL DEFAULT 0,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nodes_project_idx ON nodes(project_id);
CREATE INDEX IF NOT EXISTS nodes_parent_idx  ON nodes(parent_id);
`;

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim();
  const password = process.env.ADMIN_PASSWORD || "admin12345";
  const { rows } = await pool().query<{ count: string }>("SELECT count(*)::text AS count FROM admins");
  if (Number(rows[0].count) > 0) return;
  const hash = await bcrypt.hash(password, 10);
  await pool().query(
    `INSERT INTO admins (username, password_hash, full_name) VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING`,
    [username, hash, "Administrator"]
  );
}

/** Sxemani bir marta yaratadi (idempotent). */
export function ensureSchema(): Promise<void> {
  if (!global.__orgSchemaReady) {
    global.__orgSchemaReady = (async () => {
      await pool().query(SCHEMA);
      await seedAdmin();
    })().catch((err) => {
      global.__orgSchemaReady = undefined;
      throw err;
    });
  }
  return global.__orgSchemaReady;
}

/* ---------- Mapperlar ---------- */

type Row = Record<string, any>;

export function mapProject(r: Row): Project {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    companyName: r.company_name,
    description: r.description,
    logoUrl: r.logo_url,
    accent: r.accent,
    isPublic: r.is_public,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    ...(r.node_count !== undefined ? { nodeCount: Number(r.node_count) } : {}),
  };
}

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim() !== "") : [];

export function mapNode(r: Row): OrgNode {
  return {
    id: r.id,
    projectId: r.project_id,
    parentId: r.parent_id,
    title: r.title,
    personName: r.person_name,
    department: r.department,
    email: r.email,
    phone: r.phone,
    photoUrl: r.photo_url,
    summary: r.summary,
    duties: arr(r.duties),
    responsibilities: arr(r.responsibilities),
    authorities: arr(r.authorities),
    kpis: arr(r.kpis),
    requirements: arr(r.requirements),
    accent: r.accent,
    x: Number(r.x),
    y: Number(r.y),
    sortOrder: Number(r.sort_order),
  };
}

/* ---------- So'rovlar ---------- */

export async function listProjects(): Promise<Project[]> {
  await ensureSchema();
  const { rows } = await pool().query(
    `SELECT p.*, (SELECT count(*) FROM nodes n WHERE n.project_id = p.id) AS node_count
     FROM projects p ORDER BY p.updated_at DESC`
  );
  return rows.map(mapProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  await ensureSchema();
  const { rows } = await pool().query(`SELECT * FROM projects WHERE slug = $1`, [slug]);
  return rows[0] ? mapProject(rows[0]) : null;
}

export async function getProjectById(id: string): Promise<Project | null> {
  await ensureSchema();
  const { rows } = await pool().query(`SELECT * FROM projects WHERE id = $1`, [id]);
  return rows[0] ? mapProject(rows[0]) : null;
}

export async function listNodes(projectId: string): Promise<OrgNode[]> {
  await ensureSchema();
  const { rows } = await pool().query(
    `SELECT * FROM nodes WHERE project_id = $1 ORDER BY sort_order, created_at`,
    [projectId]
  );
  return rows.map(mapNode);
}

export async function listPublicProjects(): Promise<Project[]> {
  await ensureSchema();
  const { rows } = await pool().query(
    `SELECT p.*, (SELECT count(*) FROM nodes n WHERE n.project_id = p.id) AS node_count
     FROM projects p WHERE p.is_public = true ORDER BY p.updated_at DESC LIMIT 60`
  );
  return rows.map(mapProject);
}
