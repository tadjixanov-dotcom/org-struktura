"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileDown,
  Languages,
  LayoutGrid,
  MousePointerClick,
  ShieldCheck,
  Users,
  Building2,
} from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { useScript } from "./ScriptProvider";
import type { Project } from "@/lib/types";

const FEATURES = [
  {
    Icon: MousePointerClick,
    title: "Sichqoncha bilan tuzing",
    body: "Lavozimni sudrab boshqa rahbarning ustiga tashlang — boʻysunish shu zahoti oʻzgaradi. Avtomatik joylashtirish bir tugma bilan.",
  },
  {
    Icon: Users,
    title: "Har bir lavozim toʻliq ochiladi",
    body: "Kim, nima ish qiladi, nimaga javob beradi, qanday vakolatga ega va qaysi koʻrsatkich bilan baholanadi — hammasi bitta kartochkada.",
  },
  {
    Icon: FileDown,
    title: "PDF va PNG eksport",
    body: "Sxemani yuqori sifatda PDF qilib yuklang yoki lavozim tavsiflari bilan toʻliq hisobotni chop eting.",
  },
  {
    Icon: Languages,
    title: "Lotin va kirill",
    body: "Bir marta yozing — sahifa oʻzbek lotin va kirill yozuvlari orasida bir bosishda almashadi.",
  },
  {
    Icon: LayoutGrid,
    title: "Alohida loyihalar",
    body: "Har bir korxona yoki filial uchun alohida loyiha oching. Ular bir-biriga xalaqit bermaydi.",
  },
  {
    Icon: ShieldCheck,
    title: "Yopiq admin panel",
    body: "Tuzilmani faqat login va parol bilan kirgan admin tahrirlaydi. Koʻrish uchun ochiq havola yetarli.",
  },
];

function MiniChart() {
  const box = (label: string, sub: string, accent: string, w = 132) => (
    <div
      className="shrink-0 overflow-hidden rounded-[11px]"
      style={{
        width: w,
        background: "var(--bg-elevated)",
        border: "1px solid var(--separator)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ height: 3, background: accent }} />
      <div className="px-2.5 py-2">
        <div className="truncate text-[11.5px] font-semibold" style={{ color: "var(--text)" }}>
          {label}
        </div>
        <div className="truncate text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          {sub}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[24px] p-7"
      style={{
        background: "var(--bg-subtle)",
        border: "1px solid var(--separator)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div className="flex flex-col items-center gap-0">
        {box("Direktor", "Rahbariyat", "#0071e3", 168)}
        <div style={{ width: 1, height: 22, background: "var(--separator-strong)" }} />
        <div className="relative flex w-full items-start justify-center gap-4">
          <div
            className="absolute top-0 hidden h-px sm:block"
            style={{ background: "var(--separator-strong)", left: "16%", right: "16%" }}
          />
          {["Moliya", "Ishlab chiqarish", "Savdo"].map((label, i) => (
            <div key={label} className="flex flex-col items-center">
              <div style={{ width: 1, height: 22, background: "var(--separator-strong)" }} />
              {box(label, "boʻlim", ["#5e5ce6", "#30b0c7", "#34c759"][i])}
              {i === 2 ? (
                <>
                  <div style={{ width: 1, height: 18, background: "var(--separator-strong)" }} />
                  {box("Savdo menejeri", "mutaxassis", "#ff9f0a", 122)}
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Home({ projects }: { projects: Project[] }) {
  const { t } = useScript();

  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-16 sm:pt-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[440px]"
          style={{
            background:
              "radial-gradient(70% 100% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 72%)",
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <span
            className="rise inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <Building2 size={14} strokeWidth={2.3} />
            {t("Korxonalar uchun tashkiliy tuzilma konstruktori")}
          </span>

          <h1 className="t-display rise mt-6" style={{ color: "var(--text)", animationDelay: "60ms" }}>
            {t("Korxonangiz tuzilmasi —")}
            <br />
            <span
              style={{
                background: "linear-gradient(96deg, #0071e3 0%, #5e5ce6 55%, #30b0c7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("bir sahifada.")}
            </span>
          </h1>

          <p
            className="t-body rise mx-auto mt-6 max-w-2xl text-[1.0625rem] sm:text-[1.1875rem]"
            style={{ color: "var(--text-secondary)", animationDelay: "120ms" }}
          >
            {t(
              "Direktordan tortib har bir mutaxassisgacha — kim kimga boʻysunadi, qanday vazifa bajaradi va nimaga javob beradi. Sudrab tuzing, havola bilan ulashing, PDF qilib chop eting."
            )}
          </p>

          <div
            className="rise mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            <Link href="/admin" className="btn btn-primary">
              {t("Struktura tuzishni boshlash")}
              <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
            {projects[0] ? (
              <Link href={`/s/${projects[0].slug}`} className="btn btn-secondary">
                {t("Namunani koʻrish")}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rise mt-14" style={{ animationDelay: "240ms" }}>
          <MiniChart />
        </div>
      </section>

      {/* Imkoniyatlar */}
      <section className="px-5 py-16" style={{ background: "var(--bg-subtle)" }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="t-title text-center" style={{ color: "var(--text)" }}>
            {t("Kerakli hammasi bor")}
          </h2>
          <p className="t-body mx-auto mt-3 max-w-xl text-center" style={{ color: "var(--text-secondary)" }}>
            {t("Ortiqcha sozlamalarsiz. Ochdingiz — tuzdingiz — ulashdingiz.")}
          </p>

          <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="card p-6">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[11px]"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  <Icon size={19} strokeWidth={2.2} />
                </span>
                <h3 className="t-heading mt-4" style={{ color: "var(--text)" }}>
                  {t(title)}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {t(body)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ochiq strukturalar */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="t-title" style={{ color: "var(--text)" }}>
                {t("Ochiq strukturalar")}
              </h2>
              <p className="t-caption mt-2">{t("Havola orqali hamma koʻra oladigan loyihalar")}</p>
            </div>
            <Link href="/admin" className="btn btn-secondary btn-sm">
              {t("Yangi loyiha")}
            </Link>
          </div>

          {projects.length === 0 ? (
            <div
              className="mt-8 rounded-[20px] border border-dashed px-6 py-14 text-center"
              style={{ borderColor: "var(--separator-strong)" }}
            >
              <p className="t-body" style={{ color: "var(--text-secondary)" }}>
                {t("Hozircha ochiq loyiha yoʻq. Admin panelga kirib birinchisini yarating.")}
              </p>
              <Link href="/admin" className="btn btn-primary mt-5">
                {t("Admin panel")}
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/s/${p.slug}`}
                  className="card group p-5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold"
                      style={{ background: `${p.accent}1a`, color: p.accent }}
                    >
                      {(p.companyName || p.name).slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold" style={{ color: "var(--text)" }}>
                        {t(p.name)}
                      </div>
                      {p.companyName ? (
                        <div className="truncate text-[13px]" style={{ color: "var(--text-secondary)" }}>
                          {t(p.companyName)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {p.description ? (
                    <p
                      className="mt-3 line-clamp-2 text-[13.5px] leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {t(p.description)}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-2 text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
                    <Users size={13} strokeWidth={2.2} />
                    {p.nodeCount ?? 0} {t("lavozim")}
                    <ArrowRight
                      size={14}
                      strokeWidth={2.4}
                      className="ml-auto transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: "var(--accent)" }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t px-5 py-10" style={{ borderColor: "var(--separator)" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="t-caption">© {new Date().getFullYear()} Org Struktura</p>
          <Link href="/admin" className="t-caption hover:underline">
            {t("Admin panel")}
          </Link>
        </div>
      </footer>
    </>
  );
}
