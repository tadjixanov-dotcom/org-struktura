"use client";

import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Building,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { OrgNode } from "@/lib/types";
import { pathToRoot } from "@/lib/tree";
import { useScript } from "@/components/ScriptProvider";

const SECTIONS: {
  key: keyof Pick<OrgNode, "duties" | "responsibilities" | "authorities" | "kpis" | "requirements">;
  label: string;
  Icon: typeof ClipboardList;
  tone: string;
}[] = [
  { key: "duties", label: "Nima ish qiladi (vazifalari)", Icon: ClipboardList, tone: "#0071e3" },
  { key: "responsibilities", label: "Nimaga javob beradi", Icon: ShieldCheck, tone: "#ff3b30" },
  { key: "authorities", label: "Vakolatlari", Icon: BadgeCheck, tone: "#5e5ce6" },
  { key: "kpis", label: "Baholash mezonlari (KPI)", Icon: Award, tone: "#34c759" },
  { key: "requirements", label: "Talablar", Icon: GraduationCap, tone: "#ff9f0a" },
];

export function NodeDetail({
  node,
  allNodes,
  onClose,
  onNavigate,
}: {
  node: OrgNode;
  allNodes: OrgNode[];
  onClose?: () => void;
  onNavigate?: (id: string) => void;
}) {
  const { t } = useScript();
  const chain = pathToRoot(allNodes, node.id).slice(0, -1);
  const manager = chain.length ? chain[chain.length - 1] : null;
  const reports = allNodes
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const accent = node.accent || "#0071e3";
  const filled = SECTIONS.filter((s) => node[s.key].length > 0);

  return (
    <div className="flex h-full flex-col">
      {/* Sarlavha */}
      <div
        className="relative shrink-0 border-b px-5 pb-5 pt-5"
        style={{ borderColor: "var(--separator)" }}
      >
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost absolute right-3 top-3 h-8 w-8 !p-0"
            aria-label={t("Yopish")}
          >
            <X size={17} strokeWidth={2.3} />
          </button>
        ) : null}

        {chain.length > 0 ? (
          <nav className="mb-3 flex flex-wrap items-center gap-1 pr-9 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            {chain.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight size={11} strokeWidth={2.4} /> : null}
                <button
                  type="button"
                  className="max-w-[150px] truncate hover:underline"
                  onClick={() => onNavigate?.(c.id)}
                >
                  {t(c.title)}
                </button>
              </span>
            ))}
          </nav>
        ) : null}

        <div className="flex items-start gap-3.5 pr-9">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-[16px] font-bold"
            style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
          >
            {node.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={node.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (node.personName || node.title || "?")
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("")
            )}
          </div>
          <div className="min-w-0">
            <h2 className="t-heading" style={{ color: "var(--text)" }}>
              {t(node.title)}
            </h2>
            <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-secondary)" }}>
              {node.personName ? t(node.personName) : t("Lavozim vakant")}
            </p>
            {node.department ? (
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
              >
                <Building size={12} strokeWidth={2.2} />
                {t(node.department)}
              </span>
            ) : null}
          </div>
        </div>

        {(node.email || node.phone) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {node.email ? (
              <a
                href={`mailto:${node.email}`}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors"
                style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
              >
                <Mail size={13} strokeWidth={2.2} />
                {node.email}
              </a>
            ) : null}
            {node.phone ? (
              <a
                href={`tel:${node.phone}`}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]"
                style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
              >
                <Phone size={13} strokeWidth={2.2} />
                {node.phone}
              </a>
            ) : null}
          </div>
        )}
      </div>

      {/* Tanasi */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {node.summary ? (
          <p
            className="mb-6 rounded-[14px] px-4 py-3.5 text-[14px] leading-relaxed"
            style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}
          >
            {t(node.summary)}
          </p>
        ) : null}

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-[13px] px-3.5 py-3" style={{ background: "var(--bg-subtle)" }}>
            <div className="t-caption flex items-center gap-1.5">
              <ArrowUpRight size={12} strokeWidth={2.4} />
              {t("Kimga boʻysunadi")}
            </div>
            <div className="mt-1.5 text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
              {manager ? (
                <button type="button" className="text-left hover:underline" onClick={() => onNavigate?.(manager.id)}>
                  {t(manager.title)}
                </button>
              ) : (
                t("Yuqori bogʻin yoʻq")
              )}
            </div>
          </div>
          <div className="rounded-[13px] px-3.5 py-3" style={{ background: "var(--bg-subtle)" }}>
            <div className="t-caption flex items-center gap-1.5">
              <Users size={12} strokeWidth={2.4} />
              {t("Bevosita boʻysunuvchilar")}
            </div>
            <div className="mt-1.5 text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
              {reports.length} {t("ta")}
            </div>
          </div>
        </div>

        {reports.length > 0 ? (
          <section className="mb-6">
            <h3 className="t-caption mb-2 font-semibold uppercase tracking-wide">
              {t("Qoʻl ostidagilar")}
            </h3>
            <ul className="space-y-1.5">
              {reports.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(r.id)}
                    className="flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2 text-left transition-colors duration-200 hover:bg-[var(--bg-subtle)]"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: r.accent || accent }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
                        {t(r.title)}
                      </span>
                      {r.personName ? (
                        <span className="block truncate text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                          {t(r.personName)}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight size={14} strokeWidth={2.3} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {filled.map(({ key, label, Icon, tone }) => (
          <section key={key} className="mb-6">
            <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--text)" }}>
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-[7px]"
                style={{ background: `${tone}16`, color: tone }}
              >
                <Icon size={13} strokeWidth={2.3} />
              </span>
              {t(label)}
            </h3>
            <ul className="space-y-2 pl-1">
              {node[key].map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  <span
                    className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full"
                    style={{ background: tone }}
                  />
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {filled.length === 0 && !node.summary ? (
          <p className="t-caption py-8 text-center">
            {t("Bu lavozim uchun hali tavsif kiritilmagan.")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
