"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Layers, Maximize2, Search, Users, X } from "lucide-react";
import { OrgCanvas, type CanvasApi } from "./OrgCanvas";
import { NodeDetail } from "./NodeDetail";
import { ExportMenu } from "./ExportMenu";
import { Logo } from "@/components/SiteHeader";
import { ScriptToggle, ThemeToggle } from "@/components/Toggles";
import { useScript } from "@/components/ScriptProvider";
import { statistics } from "@/lib/tree";
import type { OrgNode, Project } from "@/lib/types";

export function StructureViewer({ project, nodes }: { project: Project; nodes: OrgNode[] }) {
  const { t } = useScript();
  const [api, setApi] = useState<CanvasApi | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);
  const stats = useMemo(() => statistics(nodes), [nodes]);
  const onReady = useCallback((a: CanvasApi) => setApi(a), []);

  const navigate = useCallback(
    (id: string) => {
      setSelectedId(id);
      api?.focusNode(id);
    },
    [api]
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Yuqori panel */}
      <header
        className="glass z-40 shrink-0 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="flex h-[60px] items-center gap-3 px-4">
          <Link href="/" className="btn btn-ghost h-9 w-9 !p-0 shrink-0" aria-label={t("Bosh sahifa")}>
            <ArrowLeft size={18} strokeWidth={2.3} />
          </Link>

          <div className="hidden shrink-0 sm:block">
            <Logo size={28} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold leading-tight" style={{ color: "var(--text)" }}>
              {t(project.companyName || project.name)}
            </h1>
            <p className="truncate text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              {t(project.companyName ? project.name : "Tashkiliy tuzilma")}
            </p>
          </div>

          <div className="relative hidden md:block">
            <Search
              size={15}
              strokeWidth={2.3}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Lavozim yoki ism boyicha qidirish")}
              className="field !w-[268px] !rounded-full !py-2 !pl-9 !pr-8 text-[13.5px]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-tertiary)" }}
                aria-label={t("Tozalash")}
              >
                <X size={14} strokeWidth={2.4} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => api?.fitView()}
            className="btn btn-secondary btn-sm hidden shrink-0 lg:inline-flex"
            title={t("Ekranga sigdirish")}
          >
            <Maximize2 size={14} strokeWidth={2.3} />
            {t("Sigʻdirish")}
          </button>

          <ExportMenu
            api={api}
            project={project}
            nodeCount={nodes.length}
            printHref={`/s/${project.slug}/print`}
          />

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <ScriptToggle compact />
            <ThemeToggle />
          </div>
        </div>

        {/* Statistika */}
        <div
          className="flex items-center gap-4 overflow-x-auto border-t px-4 py-2 text-[12px]"
          style={{ borderColor: "var(--separator)", color: "var(--text-secondary)" }}
        >
          <span className="flex shrink-0 items-center gap-1.5">
            <Users size={12.5} strokeWidth={2.3} />
            {stats.total} {t("lavozim")}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Layers size={12.5} strokeWidth={2.3} />
            {stats.depth} {t("bosqich")}
          </span>
          <span className="shrink-0">
            {stats.managers} {t("rahbar")} · {stats.performers} {t("ijrochi")}
          </span>
          {stats.departments > 0 ? (
            <span className="shrink-0">
              {stats.departments} {t("boʻlim")}
            </span>
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
            <ScriptToggle compact />
          </div>
        </div>
      </header>

      {/* Sxema + panel */}
      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center" style={{ background: "var(--bg-canvas)" }}>
              <div>
                <p className="t-heading" style={{ color: "var(--text)" }}>
                  {t("Bu loyihada hali lavozim yoʻq")}
                </p>
                <p className="t-caption mt-2">{t("Admin panel orqali lavozimlarni qoʻshing.")}</p>
              </div>
            </div>
          ) : (
            <OrgCanvas
              nodes={nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              search={search}
              onReady={onReady}
            />
          )}
        </div>

        <AnimatePresence>
          {selected ? (
            <motion.aside
              key="detail"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.36 }}
              className="absolute inset-y-0 right-0 z-30 w-full border-l sm:w-[404px]"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--separator)", boxShadow: "var(--shadow-lg)" }}
            >
              <NodeDetail
                node={selected}
                allNodes={nodes}
                onClose={() => setSelectedId(null)}
                onNavigate={navigate}
              />
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
