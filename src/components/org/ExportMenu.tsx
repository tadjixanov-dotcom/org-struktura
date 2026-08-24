"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileText, Image as ImageIcon, Loader2, Printer } from "lucide-react";
import type { CanvasApi } from "./OrgCanvas";
import type { Project } from "@/lib/types";
import { useScript } from "@/components/ScriptProvider";
import { composeSheet, downloadDataUrl, downloadPdf, safeFilename, type PageFormat } from "@/lib/pdf";
import { convert } from "@/lib/translit";

export function ExportMenu({
  api,
  project,
  nodeCount,
  printHref,
}: {
  api: CanvasApi | null;
  project: Project;
  nodeCount: number;
  printHref: string;
}) {
  const { t, script } = useScript();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const baseName = safeFilename(convert(project.companyName || project.name, script));

  async function buildSheet() {
    if (!api) return null;
    const chart = await api.toPng();
    if (!chart) return null;
    const stamp = new Date().toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return composeSheet(chart, {
      title: convert(project.companyName || project.name, script),
      subtitle: [convert(project.name, script), `${nodeCount} ${t("lavozim")}`]
        .filter(Boolean)
        .join("  ·  "),
      footer: `${t("Sana")}: ${stamp}   ·   Org Struktura`,
    });
  }

  async function handlePdf(format: PageFormat) {
    setBusy(format);
    try {
      const sheet = await buildSheet();
      if (sheet) await downloadPdf(sheet, `${baseName}-${format}.pdf`, format);
    } catch (err) {
      console.error(err);
      alert(t("Eksport qilishda xatolik yuz berdi."));
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  async function handlePng() {
    setBusy("png");
    try {
      const sheet = await buildSheet();
      if (sheet) downloadDataUrl(sheet.dataUrl, `${baseName}.png`);
    } catch (err) {
      console.error(err);
      alert(t("Eksport qilishda xatolik yuz berdi."));
    } finally {
      setBusy(null);
      setOpen(false);
    }
  }

  const items = [
    { key: "a4", label: "Sxema — PDF, A4 (1 varaq)", Icon: Download, run: () => handlePdf("a4") },
    { key: "a3", label: "Sxema — PDF, A3 (1 varaq, yirikroq)", Icon: Download, run: () => handlePdf("a3") },
    { key: "png", label: "Sxema — PNG rasm", Icon: ImageIcon, run: handlePng },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => setOpen((v) => !v)}
        disabled={!api || nodeCount === 0}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} strokeWidth={2.3} />}
        {t("Eksport")}
        <ChevronDown size={14} strokeWidth={2.6} style={{ opacity: 0.8 }} />
      </button>

      {open ? (
        <div
          role="menu"
          className="glass absolute right-0 z-50 mt-2 w-[268px] overflow-hidden rounded-[16px] border p-1.5"
          style={{ borderColor: "var(--separator)", boxShadow: "var(--shadow-lg)" }}
        >
          {items.map(({ key, label, Icon, run }) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              onClick={run}
              disabled={busy !== null}
              className="flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-[13.5px] transition-colors duration-150 hover:bg-[var(--accent-soft)] disabled:opacity-50"
              style={{ color: "var(--text)" }}
            >
              {busy === key ? (
                <Loader2 size={15} className="animate-spin" style={{ color: "var(--accent)" }} />
              ) : (
                <Icon size={15} strokeWidth={2.2} style={{ color: "var(--accent)" }} />
              )}
              {t(label)}
            </button>
          ))}

          <div className="my-1.5 h-px" style={{ background: "var(--separator)" }} />

          <a
            href={printHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-start gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-[13.5px] transition-colors duration-150 hover:bg-[var(--accent-soft)]"
            style={{ color: "var(--text)" }}
          >
            <FileText size={15} strokeWidth={2.2} style={{ color: "var(--accent)", marginTop: 2 }} />
            <span>
              {t("Toʻliq hisobot — PDF")}
              <span className="mt-0.5 block text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
                {t("Har bir lavozim tavsifi bilan, chop etish oynasi ochiladi")}
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2 px-3 pb-1.5 pt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            <Printer size={11} strokeWidth={2.2} />
            {t("Chop etish oynasida “PDF sifatida saqlash”ni tanlang")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
