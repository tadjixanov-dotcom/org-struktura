"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  CloudOff,
  ExternalLink,
  Layers,
  Loader2,
  Maximize2,
  MousePointerClick,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { OrgCanvas, type CanvasApi } from "@/components/org/OrgCanvas";
import { ExportMenu } from "@/components/org/ExportMenu";
import { NodeForm } from "./NodeForm";
import { Modal } from "@/components/Modal";
import { ScriptToggle, ThemeToggle } from "@/components/Toggles";
import { useScript } from "@/components/ScriptProvider";
import { buildTree, flatten, statistics } from "@/lib/tree";
import type { OrgNode, OrgTreeNode, Project } from "@/lib/types";

const ACCENTS = ["#0071e3", "#5e5ce6", "#30b0c7", "#34c759", "#ff9f0a", "#ff375f", "#1d1d1f"];
type SaveState = "idle" | "saving" | "saved" | "error";

export function Builder({
  project: initialProject,
  nodes: initialNodes,
}: {
  project: Project;
  nodes: OrgNode[];
}) {
  const { t } = useScript();
  const router = useRouter();

  const [project, setProject] = useState(initialProject);
  const [nodes, setNodes] = useState<OrgNode[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [api, setApi] = useState<CanvasApi | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [railOpen, setRailOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [layouting, setLayouting] = useState(false);
  const [hintSeen, setHintSeen] = useState(true);

  const pending = useRef(new Map<string, Record<string, unknown>>());
  const timer = useRef<number | null>(null);

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);
  const stats = useMemo(() => statistics(nodes), [nodes]);
  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const onReady = useCallback((a: CanvasApi) => setApi(a), []);

  useEffect(() => {
    try {
      setHintSeen(localStorage.getItem("org-builder-hint") === "1");
    } catch {
      setHintSeen(true);
    }
  }, []);

  const dismissHint = () => {
    setHintSeen(true);
    try {
      localStorage.setItem("org-builder-hint", "1");
    } catch {}
  };

  /* ---------------- Saqlash ---------------- */

  const flush = useCallback(async () => {
    if (pending.current.size === 0) return;
    const batch = new Map(pending.current);
    pending.current.clear();
    setSaveState("saving");
    try {
      for (const [id, patch] of batch) {
        const res = await fetch(`/api/nodes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(String(res.status));
      }
      setSaveState("saved");
      window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1800);
    } catch (err) {
      console.error(err);
      setSaveState("error");
    }
  }, []);

  const schedule = useCallback(
    (immediate = false) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, immediate ? 0 : 650);
    },
    [flush]
  );

  useEffect(() => {
    const handler = () => {
      if (pending.current.size > 0) flush();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      handler();
    };
  }, [flush]);

  const patchNode = useCallback(
    (id: string, patch: Partial<OrgNode>, immediate = false) => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
      pending.current.set(id, { ...(pending.current.get(id) ?? {}), ...patch });
      schedule(immediate);
    },
    [schedule]
  );

  /* ---------------- Amallar ---------------- */

  const addNode = useCallback(
    async (parentId: string | null) => {
      const parent = parentId ? nodes.find((n) => n.id === parentId) : null;
      const siblings = nodes.filter((n) => n.parentId === parentId);
      const x = parent ? parent.x + siblings.length * 60 - 30 : 40 + nodes.length * 24;
      const y = parent ? parent.y + 210 : 40;

      setSaveState("saving");
      try {
        const res = await fetch(`/api/projects/${project.id}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Yangi lavozim", parentId, x, y }),
        });
        if (!res.ok) throw new Error();
        const created: OrgNode = await res.json();
        setNodes((prev) => [...prev, created]);
        setSelectedId(created.id);
        setSaveState("saved");
        window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
      } catch {
        setSaveState("error");
      }
    },
    [nodes, project.id]
  );

  const deleteNode = useCallback(async () => {
    if (!selectedId) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/nodes/${selectedId}?mode=promote`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setNodes(data.nodes ?? []);
      setSelectedId(null);
      setSaveState("saved");
      window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch {
      setSaveState("error");
    } finally {
      setDeleteOpen(false);
    }
  }, [selectedId]);

  const reparent = useCallback(
    (childId: string, parentId: string | null) => {
      patchNode(childId, { parentId }, true);
    },
    [patchNode]
  );

  const autoArrange = useCallback(async () => {
    setLayouting(true);
    try {
      await flush();
      const res = await fetch(`/api/projects/${project.id}/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "TB" }),
      });
      if (res.ok) {
        const fresh: OrgNode[] = await res.json();
        setNodes(fresh);
        window.setTimeout(() => api?.fitView(), 90);
      }
    } finally {
      setLayouting(false);
    }
  }, [project.id, api, flush]);

  const saveProject = useCallback(
    async (patch: Partial<Project>) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error();
        const updated: Project = await res.json();
        setProject(updated);
        setSaveState("saved");
        window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
        router.refresh();
      } catch {
        setSaveState("error");
      }
    },
    [project.id, router]
  );

  const focus = useCallback(
    (id: string) => {
      setSelectedId(id);
      api?.focusNode(id);
    },
    [api]
  );

  /* ---------------- Ko'rinish ---------------- */

  const saveBadge = {
    idle: null,
    saving: (
      <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
        <Loader2 size={12} className="animate-spin" />
        {t("Saqlanmoqda")}
      </span>
    ),
    saved: (
      <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--success)" }}>
        <Check size={13} strokeWidth={2.6} />
        {t("Saqlandi")}
      </span>
    ),
    error: (
      <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--danger)" }}>
        <CloudOff size={13} strokeWidth={2.4} />
        {t("Saqlanmadi")}
      </span>
    ),
  }[saveState];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Yuqori panel */}
      <header className="glass z-40 shrink-0 border-b" style={{ borderColor: "var(--separator)" }}>
        <div className="flex h-[60px] items-center gap-2 px-3 sm:px-4">
          <Link href="/admin" className="btn btn-ghost h-9 w-9 !p-0 shrink-0" aria-label={t("Loyihalar")}>
            <ArrowLeft size={18} strokeWidth={2.3} />
          </Link>
          <button
            type="button"
            className="btn btn-ghost hidden h-9 w-9 !p-0 shrink-0 lg:inline-flex"
            onClick={() => setRailOpen((v) => !v)}
            aria-label={t("Royxatni korsatish")}
          >
            {railOpen ? <PanelLeftClose size={17} strokeWidth={2.2} /> : <PanelLeftOpen size={17} strokeWidth={2.2} />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold leading-tight" style={{ color: "var(--text)" }}>
                {t(project.companyName || project.name)}
              </h1>
              {saveBadge}
            </div>
            <p className="truncate text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              {stats.total} {t("lavozim")} · {stats.depth} {t("bosqich")}
            </p>
          </div>

          <div className="relative hidden xl:block">
            <Search
              size={15}
              strokeWidth={2.3}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Qidirish")}
              className="field !w-[210px] !rounded-full !py-2 !pl-9 text-[13.5px]"
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm shrink-0"
            onClick={autoArrange}
            disabled={layouting || nodes.length === 0}
            title={t("Barcha lavozimlarni avtomatik joylashtirish")}
          >
            {layouting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} strokeWidth={2.3} />}
            <span className="hidden sm:inline">{t("Avto joylashuv")}</span>
          </button>

          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => addNode(null)}>
            <Plus size={15} strokeWidth={2.6} />
            <span className="hidden sm:inline">{t("Lavozim")}</span>
          </button>

          <ExportMenu
            api={api}
            project={project}
            nodeCount={nodes.length}
            printHref={`/s/${project.slug}/print`}
          />

          <a
            href={`/s/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost h-9 w-9 !p-0 shrink-0"
            title={t("Ochiq sahifani korish")}
            aria-label={t("Ochiq sahifani korish")}
          >
            <ExternalLink size={16} strokeWidth={2.3} />
          </a>
          <button
            type="button"
            className="btn btn-ghost h-9 w-9 !p-0 shrink-0"
            onClick={() => setSettingsOpen(true)}
            title={t("Loyiha sozlamalari")}
            aria-label={t("Loyiha sozlamalari")}
          >
            <Settings size={16} strokeWidth={2.2} />
          </button>

          <div className="hidden shrink-0 items-center gap-2 2xl:flex">
            <ScriptToggle compact />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Chap ro'yxat */}
        <AnimatePresence initial={false}>
          {railOpen ? (
            <motion.aside
              key="rail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 286, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="hidden shrink-0 overflow-hidden border-r lg:block"
              style={{ borderColor: "var(--separator)", background: "var(--bg-elevated)" }}
            >
              <div className="flex h-full w-[286px] flex-col">
                <div className="shrink-0 px-4 pb-2 pt-4">
                  <div className="relative">
                    <Search
                      size={14}
                      strokeWidth={2.3}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("Lavozim qidirish")}
                      className="field !py-1.5 !pl-8 text-[13px]"
                    />
                  </div>
                </div>
                <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                  <TreeList tree={tree} selectedId={selectedId} onSelect={focus} search={search} onAdd={addNode} />
                  {nodes.length === 0 ? (
                    <p className="t-caption px-3 py-8 text-center">{t("Lavozimlar hali yoʻq")}</p>
                  ) : null}
                </div>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        {/* Sxema */}
        <div className="relative min-w-0 flex-1">
          <OrgCanvas
            nodes={nodes}
            editable
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={(id, x, y) => patchNode(id, { x, y })}
            onReparent={reparent}
            onAddChild={(parentId) => addNode(parentId)}
            search={search}
            onReady={onReady}
          />

          {nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
              <div className="pointer-events-auto">
                <p className="t-heading" style={{ color: "var(--text)" }}>
                  {t("Tuzilma boʻsh")}
                </p>
                <p className="t-caption mx-auto mt-2 max-w-sm">
                  {t("Birinchi lavozimni qoʻshing — masalan, Direktor. Keyin uning ostiga boʻysunuvchilarni joylang.")}
                </p>
                <button type="button" className="btn btn-primary mt-5" onClick={() => addNode(null)}>
                  <Plus size={16} strokeWidth={2.6} />
                  {t("Lavozim qoʻshish")}
                </button>
              </div>
            </div>
          ) : null}

          {/* Yordam eslatmasi */}
          <AnimatePresence>
            {!hintSeen && nodes.length > 0 ? (
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="glass absolute bottom-4 left-1/2 z-20 flex max-w-[92vw] -translate-x-1/2 items-start gap-2.5 rounded-[15px] border px-4 py-3"
                style={{ borderColor: "var(--separator)", boxShadow: "var(--shadow-md)" }}
              >
                <MousePointerClick size={16} strokeWidth={2.2} style={{ color: "var(--accent)", marginTop: 1 }} />
                <p className="text-[12.5px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                  {t("Kartochkani sudrab koʻchiring. Boshqa kartochka ustiga tashlasangiz — oʻsha rahbarga boʻysunadi.")}
                  <br />
                  {t("Kartochka ustiga bosib, oʻng paneldan vazifalarini yozing.")}
                </p>
                <button
                  type="button"
                  onClick={dismissHint}
                  className="shrink-0 rounded-md p-1"
                  style={{ color: "var(--text-tertiary)" }}
                  aria-label={t("Yopish")}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => api?.fitView()}
            className="btn btn-secondary btn-sm absolute right-4 top-4 z-20"
            title={t("Ekranga sigdirish")}
          >
            <Maximize2 size={14} strokeWidth={2.3} />
          </button>
        </div>

        {/* O'ng tahrir paneli */}
        <AnimatePresence>
          {selected ? (
            <motion.aside
              key="form"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.34 }}
              className="absolute inset-y-0 right-0 z-30 w-full border-l sm:w-[396px]"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--separator)", boxShadow: "var(--shadow-lg)" }}
            >
              <NodeForm
                node={selected}
                allNodes={nodes}
                onChange={(patch) => patchNode(selected.id, patch)}
                onDelete={() => setDeleteOpen(true)}
                onClose={() => setSelectedId(null)}
              />
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>

      <ProjectSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        project={project}
        onSave={saveProject}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Lavozimni oʻchirish"
        width={430}
        footer={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteOpen(false)}>
              {t("Bekor qilish")}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "var(--danger)", color: "#fff" }}
              onClick={deleteNode}
            >
              <Trash2 size={15} strokeWidth={2.4} />
              {t("Oʻchirish")}
            </button>
          </>
        }
      >
        <p className="t-body" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text)" }}>{selected ? t(selected.title) : ""}</strong>{" "}
          {t("oʻchiriladi. Uning boʻysunuvchilari bir bosqich yuqoriga koʻtariladi — ular oʻchmaydi.")}
        </p>
      </Modal>
    </div>
  );
}

/* ---------------- Chap ro'yxat ---------------- */

function TreeList({
  tree,
  selectedId,
  onSelect,
  search,
  onAdd,
}: {
  tree: OrgTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onAdd: (parentId: string) => void;
}) {
  const { t } = useScript();
  const q = search.trim().toLowerCase();
  const visible = useMemo(() => {
    const all = flatten(tree);
    if (!q) return all;
    return all.filter((n) =>
      [n.title, n.personName, n.department].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [tree, q]);

  return (
    <ul className="space-y-0.5">
      {visible.map((n) => {
        const active = n.id === selectedId;
        return (
          <li key={n.id}>
            <div
              className="group flex items-center gap-1 rounded-[10px] pr-1 transition-colors duration-150"
              style={{
                background: active ? "var(--accent-soft)" : "transparent",
                paddingLeft: q ? 8 : 8 + n.depth * 13,
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(n.id)}
                className="min-w-0 flex-1 py-2 text-left"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: n.accent || (active ? "var(--accent)" : "var(--text-tertiary)") }}
                  />
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[13px] font-medium"
                      style={{ color: active ? "var(--accent)" : "var(--text)" }}
                    >
                      {t(n.title)}
                    </span>
                    {n.personName ? (
                      <span className="block truncate text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
                        {t(n.personName)}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onAdd(n.id)}
                className="shrink-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                style={{ color: "var(--accent)" }}
                title={t("Boysunuvchi qoshish")}
                aria-label={t("Boysunuvchi qoshish")}
              >
                <Plus size={13} strokeWidth={2.6} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- Loyiha sozlamalari ---------------- */

function ProjectSettings({
  open,
  onClose,
  project,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  onSave: (patch: Partial<Project>) => Promise<void>;
}) {
  const { t } = useScript();
  const [name, setName] = useState(project.name);
  const [companyName, setCompanyName] = useState(project.companyName ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [accent, setAccent] = useState(project.accent);
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project.name);
    setCompanyName(project.companyName ?? "");
    setDescription(project.description ?? "");
    setAccent(project.accent);
    setIsPublic(project.isPublic);
  }, [open, project]);

  async function save() {
    setBusy(true);
    await onSave({ name, companyName, description, accent, isPublic });
    setBusy(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Loyiha sozlamalari"
      width={520}
      footer={
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={busy}>
            {t("Bekor qilish")}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.6} />}
            {t("Saqlash")}
          </button>
        </>
      }
    >
      <label className="field-label">{t("Loyiha nomi")}</label>
      <input className="field" value={name} onChange={(e) => setName(e.target.value)} />

      <label className="field-label mt-4">{t("Korxona nomi")}</label>
      <input className="field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

      <label className="field-label mt-4">{t("Tavsif")}</label>
      <textarea
        className="field min-h-[76px] resize-y"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label className="field-label mt-4">{t("Ochiq havola")}</label>
      <div className="flex items-center gap-2 rounded-[11px] px-3 py-2.5" style={{ background: "var(--bg-subtle)" }}>
        <span className="t-mono truncate" style={{ color: "var(--text-secondary)" }}>
          /s/{project.slug}
        </span>
      </div>

      <label className="field-label mt-4">{t("Asosiy rang")}</label>
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
            <Users size={14} strokeWidth={2.3} />
            {t("Havolaga ega har kim koʻra oladi")}
          </span>
          <span className="mt-0.5 block text-[12px]" style={{ color: "var(--text-secondary)" }}>
            {t("Oʻchirilsa, sahifa faqat admin uchun ochiladi.")}
          </span>
        </span>
      </label>

      <div className="mt-5 flex items-center gap-2 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
        <Layers size={13} strokeWidth={2.2} />
        {t("Oʻzgarishlar darhol ochiq sahifada aks etadi.")}
      </div>
    </Modal>
  );
}
