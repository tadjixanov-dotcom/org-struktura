"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ScriptToggle } from "@/components/Toggles";
import { useScript } from "@/components/ScriptProvider";
import { buildTree, flatten, pathToRoot, statistics } from "@/lib/tree";
import type { OrgNode, OrgTreeNode, Project } from "@/lib/types";

const SECTIONS: {
  key: keyof Pick<OrgNode, "duties" | "responsibilities" | "authorities" | "kpis" | "requirements">;
  label: string;
}[] = [
  { key: "duties", label: "Vazifalari — nima ish qiladi" },
  { key: "responsibilities", label: "Javobgarligi — nimaga javob beradi" },
  { key: "authorities", label: "Vakolatlari" },
  { key: "kpis", label: "Baholash mezonlari (KPI)" },
  { key: "requirements", label: "Lavozimga talablar" },
];

const TONES = ["#0071e3", "#5e5ce6", "#30b0c7", "#34c759", "#ff9f0a", "#ff375f"];

function OutlineRow({ node, index }: { node: OrgTreeNode; index: string }) {
  const { t } = useScript();
  const tone = node.accent || TONES[node.depth % TONES.length];
  return (
    <>
      <div
        className="print-block flex items-baseline gap-2 py-[5px]"
        style={{ paddingLeft: node.depth * 22, borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <span className="t-mono shrink-0" style={{ color: "#86868b", minWidth: 46 }}>
          {index}
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone }} />
        <span className="text-[13.5px] font-semibold" style={{ color: "#1d1d1f" }}>
          {t(node.title)}
        </span>
        {node.personName ? (
          <span className="text-[12.5px]" style={{ color: "#6e6e73" }}>
            — {t(node.personName)}
          </span>
        ) : null}
        {node.department ? (
          <span className="ml-auto shrink-0 text-[11.5px]" style={{ color: "#86868b" }}>
            {t(node.department)}
          </span>
        ) : null}
      </div>
      {node.children.map((c, i) => (
        <OutlineRow key={c.id} node={c} index={`${index}.${i + 1}`} />
      ))}
    </>
  );
}

export function PrintReport({
  project,
  nodes,
  autoPrint = true,
}: {
  project: Project;
  nodes: OrgNode[];
  autoPrint?: boolean;
}) {
  const { t } = useScript();
  const [printed, setPrinted] = useState(false);

  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const ordered = useMemo(() => flatten(tree), [tree]);
  const stats = useMemo(() => statistics(nodes), [nodes]);

  const indexOf = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (list: OrgTreeNode[], prefix: string) => {
      list.forEach((n, i) => {
        const idx = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
        map.set(n.id, idx);
        walk(n.children, idx);
      });
    };
    walk(tree, "");
    return map;
  }, [tree]);

  useEffect(() => {
    if (!autoPrint || printed || nodes.length === 0) return;
    const id = window.setTimeout(() => {
      setPrinted(true);
      window.print();
    }, 900);
    return () => window.clearTimeout(id);
  }, [autoPrint, printed, nodes.length]);

  const today = new Date().toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ background: "#f5f5f7", minHeight: "100dvh" }}>
      {/* Boshqaruv paneli — chop etishda ko'rinmaydi */}
      <div
        className="no-print glass sticky top-0 z-50 border-b"
        style={{ borderColor: "var(--separator)" }}
      >
        <div className="mx-auto flex h-14 max-w-[900px] items-center gap-3 px-4">
          <Link href={`/s/${project.slug}`} className="btn btn-ghost h-9 w-9 !p-0" aria-label={t("Orqaga")}>
            <ArrowLeft size={18} strokeWidth={2.3} />
          </Link>
          <span className="truncate text-[14px] font-semibold" style={{ color: "var(--text)" }}>
            {t("Toʻliq hisobot")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ScriptToggle compact />
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={15} strokeWidth={2.3} />
              {t("PDF saqlash")}
            </button>
          </div>
        </div>
      </div>

      {/* Hujjat */}
      <article
        className="mx-auto my-6 max-w-[900px] bg-white px-12 py-12 print:my-0 print:max-w-none print:px-0 print:py-0"
        style={{ color: "#1d1d1f", boxShadow: "0 4px 24px rgba(0,0,0,.08)", borderRadius: 12 }}
      >
        {/* Muqova */}
        <header className="print-block border-b pb-7" style={{ borderColor: "rgba(0,0,0,.1)" }}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: project.accent }}>
            {t("Tashkiliy tuzilma")}
          </p>
          <h1 className="mt-2 text-[34px] font-bold leading-[1.1] tracking-[-0.025em]">
            {t(project.companyName || project.name)}
          </h1>
          {project.companyName ? (
            <p className="mt-1 text-[16px]" style={{ color: "#6e6e73" }}>
              {t(project.name)}
            </p>
          ) : null}
          {project.description ? (
            <p className="mt-4 max-w-[62ch] text-[14px] leading-relaxed" style={{ color: "#6e6e73" }}>
              {t(project.description)}
            </p>
          ) : null}

          <dl className="mt-6 flex flex-wrap gap-x-9 gap-y-3 text-[13px]">
            {[
              [t("Lavozimlar"), `${stats.total}`],
              [t("Boshqaruv bosqichlari"), `${stats.depth}`],
              [t("Rahbarlar"), `${stats.managers}`],
              [t("Ijrochilar"), `${stats.performers}`],
              [t("Sana"), today],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-wide" style={{ color: "#86868b" }}>
                  {k}
                </dt>
                <dd className="mt-0.5 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* Tuzilma sxemasi (matnli) */}
        <section className="mt-9">
          <h2 className="mb-3 text-[18px] font-bold tracking-[-0.02em]">
            {t("1. Tuzilma sxemasi")}
          </h2>
          <div className="rounded-[10px] border px-4 py-2" style={{ borderColor: "rgba(0,0,0,.1)" }}>
            {tree.map((n, i) => (
              <OutlineRow key={n.id} node={n} index={`${i + 1}`} />
            ))}
          </div>
        </section>

        {/* Batafsil tavsiflar */}
        <section className="mt-10">
          <h2 className="mb-1 text-[18px] font-bold tracking-[-0.02em]">
            {t("2. Lavozimlarning batafsil tavsifi")}
          </h2>
          <p className="mb-5 text-[13px]" style={{ color: "#86868b" }}>
            {t("Har bir lavozim boʻyicha: kimga boʻysunadi, kim boʻysunadi, qanday vazifa bajaradi, nimaga javob beradi.")}
          </p>

          <div className="space-y-7">
            {ordered.map((node) => {
              const tone = node.accent || TONES[node.depth % TONES.length];
              const chain = pathToRoot(nodes, node.id).slice(0, -1);
              const manager = chain.length ? chain[chain.length - 1] : null;
              const reports = nodes.filter((n) => n.parentId === node.id);
              const filled = SECTIONS.filter((s) => node[s.key].length > 0);

              return (
                <div
                  key={node.id}
                  className="print-block rounded-[12px] border px-5 py-5"
                  style={{ borderColor: "rgba(0,0,0,.1)", borderLeft: `3px solid ${tone}` }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="t-mono" style={{ color: "#86868b" }}>
                      {indexOf.get(node.id)}
                    </span>
                    <h3 className="text-[17px] font-bold tracking-[-0.02em]">{t(node.title)}</h3>
                    {node.personName ? (
                      <span className="text-[14px]" style={{ color: "#6e6e73" }}>
                        {t(node.personName)}
                      </span>
                    ) : (
                      <span className="text-[13px] italic" style={{ color: "#86868b" }}>
                        {t("vakant")}
                      </span>
                    )}
                    {node.department ? (
                      <span
                        className="rounded-full px-2 py-[2px] text-[11.5px]"
                        style={{ background: "#f5f5f7", color: "#6e6e73" }}
                      >
                        {t(node.department)}
                      </span>
                    ) : null}
                  </div>

                  {node.summary ? (
                    <p className="mt-2.5 max-w-[70ch] text-[13.5px] leading-relaxed" style={{ color: "#3a3a3c" }}>
                      {t(node.summary)}
                    </p>
                  ) : null}

                  <div className="mt-3.5 grid gap-x-8 gap-y-2 text-[13px] sm:grid-cols-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: "#86868b" }}>
                        {t("Kimga boʻysunadi")}
                      </span>
                      <div className="mt-0.5 font-medium">
                        {manager ? t(manager.title) : t("Bevosita boʻysunmaydi (yuqori bogʻin)")}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: "#86868b" }}>
                        {t("Kim boʻysunadi")}
                      </span>
                      <div className="mt-0.5 font-medium">
                        {reports.length === 0
                          ? t("Boʻysunuvchilari yoʻq")
                          : reports.map((r) => t(r.title)).join(", ")}
                      </div>
                    </div>
                    {node.email || node.phone ? (
                      <div className="sm:col-span-2">
                        <span className="text-[11px] uppercase tracking-wide" style={{ color: "#86868b" }}>
                          {t("Aloqa")}
                        </span>
                        <div className="mt-0.5 font-medium">
                          {[node.email, node.phone].filter(Boolean).join("  ·  ")}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {filled.map(({ key, label }) => (
                    <div key={key} className="mt-4">
                      <h4 className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: tone }}>
                        {t(label)}
                      </h4>
                      <ol className="mt-1.5 space-y-1">
                        {node[key].map((item, i) => (
                          <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed">
                            <span className="shrink-0 tabular-nums" style={{ color: "#86868b" }}>
                              {i + 1}.
                            </span>
                            <span style={{ color: "#3a3a3c" }}>{t(item)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 border-t pt-4 text-[11.5px]" style={{ borderColor: "rgba(0,0,0,.1)", color: "#86868b" }}>
          {t("Hujjat Org Struktura xizmatida shakllantirildi")} · {today}
        </footer>
      </article>
    </div>
  );
}
