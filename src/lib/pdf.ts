"use client";

/**
 * Sxemani PDF/PNG ko'rinishida eksport qilish.
 *
 * Sarlavha va izohlar brauzer canvas'ida chiziladi — shu sababli
 * lotin va kirill yozuvlari, apostroflar va barcha Unicode belgilar
 * qo'shimcha shrift yuklamasdan to'g'ri chiqadi.
 */

export type PageFormat = "a4" | "a3";

export type ChartExportMeta = {
  title: string;
  subtitle?: string;
  footer?: string;
};

type Rendered = { dataUrl: string; width: number; height: number };

const HEADER_H = 132;
const FOOTER_H = 58;

function px(scale: number, v: number) {
  return Math.round(v * scale);
}

/** Sxema rasmiga sarlavha va pastki qatorni qo'shib, yagona rasm hosil qiladi. */
export async function composeSheet(
  chart: Rendered,
  meta: ChartExportMeta,
  background = "#ffffff"
): Promise<Rendered> {
  const scale = Math.max(1, Math.min(chart.width / 1200, 2));
  const headerH = px(scale, HEADER_H);
  const footerH = px(scale, FOOTER_H);
  const pad = px(scale, 56);

  const canvas = document.createElement("canvas");
  canvas.width = chart.width;
  canvas.height = chart.height + headerH + footerH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return chart;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const font = `-apple-system, "Segoe UI", Inter, Roboto, system-ui, sans-serif`;

  // Sarlavha
  ctx.fillStyle = "#1d1d1f";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${px(scale, 34)}px ${font}`;
  ctx.fillText(meta.title, pad, px(scale, 58));

  if (meta.subtitle) {
    ctx.fillStyle = "#6e6e73";
    ctx.font = `400 ${px(scale, 19)}px ${font}`;
    ctx.fillText(meta.subtitle, pad, px(scale, 90));
  }

  // Ajratuvchi chiziq
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.fillRect(pad, headerH - px(scale, 18), canvas.width - pad * 2, Math.max(1, px(scale, 1)));

  // Sxema
  const img = await loadImage(chart.dataUrl);
  ctx.drawImage(img, 0, headerH, chart.width, chart.height);

  // Pastki qator
  if (meta.footer) {
    ctx.fillStyle = "#86868b";
    ctx.font = `400 ${px(scale, 16)}px ${font}`;
    ctx.fillText(meta.footer, pad, canvas.height - px(scale, 22));
  }

  return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const PAGE_PT: Record<PageFormat, [number, number]> = {
  a4: [595.28, 841.89],
  a3: [841.89, 1190.55],
};

/** Rasmni PDF sahifasiga "to'liq sig'diradi" va yuklab beradi. */
export async function downloadPdf(
  sheet: Rendered,
  filename: string,
  format: PageFormat = "a4"
) {
  const { jsPDF } = await import("jspdf");
  const landscape = sheet.width >= sheet.height;
  const [shortSide, longSide] = PAGE_PT[format];
  const pageW = landscape ? longSide : shortSide;
  const pageH = landscape ? shortSide : longSide;

  const doc = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "pt",
    format,
    compress: true,
  });

  const margin = 18;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = Math.min(maxW / sheet.width, maxH / sheet.height);
  const w = sheet.width * ratio;
  const h = sheet.height * ratio;

  doc.addImage(sheet.dataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h, undefined, "FAST");
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function safeFilename(input: string): string {
  return (
    input
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "org-struktura"
  );
}
