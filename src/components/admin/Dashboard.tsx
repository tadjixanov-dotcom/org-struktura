"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { Logo } from "@/components/SiteHeader";
import { ScriptToggle, ThemeToggle } from "@/components/Toggles";
import { Modal } from "@/components/Modal";
import { useScript } from "@/components/ScriptProvider";
import { TEMPLATES } from "@/lib/templates";
import type { Project } from "@/lib/types";

const ACCENTS = ["#0071e3", "#5e5ce6", "#30b0c7", "#34c759", "#ff9f0a", "#ff375f", "#1d1d1f"];

export function Dashboard({ projects, username }: { projects: Project[]; username: string }) {
  const { t } = useScript();
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Yangi loyiha maydonlari
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [isPublic, setIsPublic] = useState(true);
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [error, setError] = useState<string | null>(null);

  // Parol
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwMessage, setPwMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function createProject() {
    if (!name.trim()) {
      setError("Loyiha nomini kiriting");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, companyName, description, accent, isPublic, template }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik");
        setBusy(false);
        return;
      }
      setCreateOpen(false);
      setName("");
      setCompanyName("");
      setDescription("");
      router.push(`/admin/p/${data.id}`);
    } catch {
      setError("Tarmoq xatosi");
      setBusy(false);
    }
  }

  async function removeProject() {
    if (!deleteTarget) return;
    setBusy(true);
    await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setBusy(false);
    router.refresh();
  }

  async function savePassword() {
    setBusy(true);
    setPwMessage(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setPwMessage({ ok: false, text: data.error ?? "Xatolik" });
      return;
    }
    setPwMessage({ ok: true, text: "Parol yangilandi" });
    setCurrent("");
    setNext("");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function copyLink(p: Project) {
    const url = `${window.location.origin}/s/${p.slug}`;
    navigator.clipboard?.writeText(url);
    setCopied(p.id);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="min-h-[100dvh]">
      <header className="glass sticky top-0 z-40 border-b" style={{ borderColor: "var(--separator)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[16px] font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
              Org Struktura
            </span>
          </Link>
          <span
            className="ml-1 hidden rounded-full px-2.5 py-1 text-[11.5px] font-semibold sm:inline-block"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {t("Admin")}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <ScriptToggle compact />
            <ThemeToggle />
            <button
              type="button"
              className="btn btn-ghost h-9 w-9 !p-0"
              onClick={() => setSettingsOpen(true)}
              title={t("Sozlamalar")}
              aria-label={t("Sozlamalar")}
            >
              <Settings size={17} strokeWidth={2.2} />
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
              <LogOut size={14} strokeWidth={2.3} />
              <span className="hidden sm:inline">{t("Chiqish")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="t-title" style={{ color: "var(--text)" }}>
              {t("Loyihalar")}
            </h1>
            <p className="t-caption mt-2">
              {t("Salom")}, {username} · {projects.length} {t("ta loyiha")}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} strokeWidth={2.6} />
            {t("Yangi loyiha")}
          </button>
        </div>

        {projects.length === 0 ? (
          <div
            className="mt-10 rounded-[22px] border border-dashed px-6 py-20 text-center"
            style={{ borderColor: "var(--separator-strong)" }}
          >
            <div className="mb-4 flex justify-center opacity-60">
              <Logo size={44} />
            </div>
            <p className="t-heading" style={{ color: "var(--text)" }}>
              {t("Hali loyiha yaratilmagan")}
            </p>
            <p className="t-caption mx-auto mt-2 max-w-md">
              {t("Har bir korxona yoki filial uchun alohida loyiha oching. Namunaviy tuzilmani tanlab, bir necha soniyada boshlashingiz mumkin.")}
            </p>
            <button type="button" className="btn btn-primary mt-6" onClick={() => setCreateOpen(true)}>
              <Plus size={16} strokeWidth={2.6} />
              {t("Birinchi loyihani yaratish")}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div key={p.id} className="card flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[13px] font-bold"
                    style={{ background: `${p.accent}1a`, color: p.accent }}
                  >
                    {(p.companyName || p.name).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-semibold" style={{ color: "var(--text)" }}>
                      {t(p.name)}
                    </h2>
                    {p.companyName ? (
                      <p className="truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>
                        {t(p.companyName)}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-[3px] text-[10.5px] font-semibold"
                    style={
                      p.isPublic
                        ? { background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }
                        : { background: "var(--bg-subtle)", color: "var(--text-tertiary)" }
                    }
                    title={t(p.isPublic ? "Havola orqali hamma korishi mumkin" : "Faqat login bilan korinadi")}
                  >
                    {p.isPublic ? t("Ochiq") : t("Yopiq")}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3 text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
                  <span className="flex items-center gap-1.5">
                    <Users size={13} strokeWidth={2.2} />
                    {p.nodeCount ?? 0} {t("lavozim")}
                  </span>
                  <span className="t-mono truncate">/s/{p.slug}</span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t pt-4" style={{ borderColor: "var(--separator)" }}>
                  <Link href={`/admin/p/${p.id}`} className="btn btn-primary btn-sm">
                    <Pencil size={13} strokeWidth={2.4} />
                    {t("Tahrirlash")}
                  </Link>
                  <a href={`/s/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    <ExternalLink size={13} strokeWidth={2.4} />
                    {t("Koʻrish")}
                  </a>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyLink(p)}>
                    {copied === p.id ? (
                      <Check size={13} strokeWidth={2.6} style={{ color: "var(--success)" }} />
                    ) : (
                      <Copy size={13} strokeWidth={2.4} />
                    )}
                    {t(copied === p.id ? "Nusxalandi" : "Havola")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm ml-auto"
                    style={{ color: "var(--danger)" }}
                    onClick={() => setDeleteTarget(p)}
                    aria-label={t("Ochirish")}
                  >
                    <Trash2 size={13} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Yangi loyiha */}
      <Modal
        open={createOpen}
        onClose={() => !busy && setCreateOpen(false)}
        title="Yangi loyiha"
        subtitle="Korxona nomini kiriting va namunaviy tuzilmani tanlang"
        width={580}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreateOpen(false)} disabled={busy}>
              {t("Bekor qilish")}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={createProject} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} strokeWidth={2.5} />}
              {t("Yaratish")}
            </button>
          </>
        }
      >
        <label className="field-label">{t("Loyiha nomi")} *</label>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("Masalan: 2026-yil tashkiliy tuzilmasi")}
          autoFocus
        />

        <label className="field-label mt-4">{t("Korxona nomi")}</label>
        <input
          className="field"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder={t("Masalan: “Bismillah Savdo” MChJ")}
        />

        <label className="field-label mt-4">{t("Qisqacha tavsif")}</label>
        <textarea
          className="field min-h-[76px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("Loyiha haqida bir-ikki jumla")}
        />

        <label className="field-label mt-5">{t("Namunaviy tuzilma")}</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setTemplate(tpl.id)}
              className="rounded-[13px] border p-3 text-left transition-all duration-200"
              style={{
                borderColor: template === tpl.id ? "var(--accent)" : "var(--separator-strong)",
                background: template === tpl.id ? "var(--accent-soft)" : "transparent",
              }}
            >
              <div className="text-[13.5px] font-semibold" style={{ color: "var(--text)" }}>
                {t(tpl.name)}
              </div>
              <div className="mt-1 text-[12px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                {t(tpl.description)}
              </div>
            </button>
          ))}
        </div>

        <label className="field-label mt-5">{t("Asosiy rang")}</label>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAccent(c)}
              aria-label={c}
              className="h-8 w-8 rounded-full transition-transform duration-200"
              style={{
                background: c,
                transform: accent === c ? "scale(1.12)" : "scale(1)",
                boxShadow: accent === c ? `0 0 0 3px var(--bg-elevated), 0 0 0 5px ${c}` : "none",
              }}
            />
          ))}
        </div>

        <label
          className="mt-5 flex cursor-pointer items-start gap-3 rounded-[13px] px-3.5 py-3"
          style={{ background: "var(--bg-subtle)" }}
        >
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: "var(--text)" }}>
              {isPublic ? <Eye size={14} strokeWidth={2.3} /> : <EyeOff size={14} strokeWidth={2.3} />}
              {t("Ochiq havola")}
            </span>
            <span className="mt-0.5 block text-[12px]" style={{ color: "var(--text-secondary)" }}>
              {t("Yoqilsa, havolaga ega har kim tuzilmani koʻra oladi. Tahrirlash baribir faqat admin uchun.")}
            </span>
          </span>
        </label>

        {error ? (
          <p className="mt-4 text-[13px]" style={{ color: "var(--danger)" }}>
            {t(error)}
          </p>
        ) : null}
      </Modal>

      {/* Sozlamalar */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Sozlamalar"
        subtitle="Admin parolini oʻzgartirish"
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSettingsOpen(false)}>
              {t("Yopish")}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={savePassword}
              disabled={busy || !current || !next}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              {t("Saqlash")}
            </button>
          </>
        }
      >
        <div className="mb-5 rounded-[13px] px-3.5 py-3" style={{ background: "var(--bg-subtle)" }}>
          <div className="t-caption">{t("Foydalanuvchi nomi")}</div>
          <div className="mt-0.5 text-[14px] font-semibold" style={{ color: "var(--text)" }}>
            {username}
          </div>
        </div>

        <label className="field-label">{t("Joriy parol")}</label>
        <input
          type="password"
          className="field"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />

        <label className="field-label mt-4">{t("Yangi parol")}</label>
        <input
          type="password"
          className="field"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          placeholder={t("Kamida 6 ta belgi")}
        />

        {pwMessage ? (
          <p
            className="mt-4 text-[13px]"
            style={{ color: pwMessage.ok ? "var(--success)" : "var(--danger)" }}
          >
            {t(pwMessage.text)}
          </p>
        ) : null}
      </Modal>

      {/* O'chirish tasdiqlash */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => !busy && setDeleteTarget(null)}
        title="Loyihani oʻchirish"
        width={430}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)} disabled={busy}>
              {t("Bekor qilish")}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "var(--danger)", color: "#fff" }}
              onClick={removeProject}
              disabled={busy}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} strokeWidth={2.4} />}
              {t("Oʻchirish")}
            </button>
          </>
        }
      >
        <p className="t-body" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text)" }}>{deleteTarget ? t(deleteTarget.name) : ""}</strong>{" "}
          {t("loyihasi va undagi barcha lavozimlar butunlay oʻchiriladi. Bu amalni ortga qaytarib boʻlmaydi.")}
        </p>
      </Modal>
    </div>
  );
}
