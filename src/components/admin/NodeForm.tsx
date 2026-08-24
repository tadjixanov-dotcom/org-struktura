"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  ClipboardList,
  GraduationCap,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { OrgNode } from "@/lib/types";
import { descendantIds } from "@/lib/tree";
import { useScript } from "@/components/ScriptProvider";

const ACCENTS = ["#0071e3", "#5e5ce6", "#30b0c7", "#34c759", "#ff9f0a", "#ff375f", "#8e8e93"];

const LIST_FIELDS: {
  key: "duties" | "responsibilities" | "authorities" | "kpis" | "requirements";
  label: string;
  hint: string;
  Icon: typeof ClipboardList;
  tone: string;
}[] = [
  {
    key: "duties",
    label: "Vazifalari — nima ish qiladi",
    hint: "Masalan: Yillik byudjetni tuzish",
    Icon: ClipboardList,
    tone: "#0071e3",
  },
  {
    key: "responsibilities",
    label: "Javobgarligi — nimaga javob beradi",
    hint: "Masalan: Sotuv rejasining bajarilishi",
    Icon: ShieldCheck,
    tone: "#ff3b30",
  },
  {
    key: "authorities",
    label: "Vakolatlari",
    hint: "Masalan: Chegirma berish huquqi",
    Icon: BadgeCheck,
    tone: "#5e5ce6",
  },
  {
    key: "kpis",
    label: "Baholash mezonlari (KPI)",
    hint: "Masalan: Reja bajarilishi (%)",
    Icon: Award,
    tone: "#34c759",
  },
  {
    key: "requirements",
    label: "Lavozimga talablar",
    hint: "Masalan: Oliy maʼlumot, 3 yil tajriba",
    Icon: GraduationCap,
    tone: "#ff9f0a",
  },
];

function ListEditor({
  items,
  onChange,
  hint,
  tone,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  hint: string;
  tone: string;
}) {
  const { t } = useScript();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusNext = useRef<number | null>(null);

  useEffect(() => {
    if (focusNext.current === null) return;
    refs.current[focusNext.current]?.focus();
    focusNext.current = null;
  }, [items]);

  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const insertAfter = (i: number) => {
    const next = [...items];
    next.splice(i + 1, 0, "");
    focusNext.current = i + 1;
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="group flex items-start gap-1.5">
          <span
            className="mt-[13px] h-[5px] w-[5px] shrink-0 rounded-full"
            style={{ background: tone }}
          />
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="field !py-1.5 text-[13.5px]"
            value={item}
            placeholder={t(hint)}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertAfter(i);
              }
              if (e.key === "Backspace" && item === "" && items.length > 1) {
                e.preventDefault();
                remove(i);
                focusNext.current = Math.max(0, i - 1);
              }
            }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1.5 shrink-0 rounded-md p-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            style={{ color: "var(--text-tertiary)" }}
            aria-label={t("Ochirish")}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="btn btn-ghost btn-sm !px-2"
        style={{ color: tone }}
      >
        <Plus size={13} strokeWidth={2.6} />
        {t("Qator qoʻshish")}
      </button>
    </div>
  );
}

export function NodeForm({
  node,
  allNodes,
  onChange,
  onDelete,
  onClose,
}: {
  node: OrgNode;
  allNodes: OrgNode[];
  onChange: (patch: Partial<OrgNode>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useScript();
  const [tab, setTab] = useState<"asosiy" | "tavsif">("asosiy");

  const banned = descendantIds(allNodes, node.id);
  const parentOptions = allNodes.filter((n) => n.id !== node.id && !banned.has(n.id));

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-5 pb-0 pt-4" style={{ borderColor: "var(--separator)" }}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="t-caption">{t("Lavozimni tahrirlash")}</p>
            <h2 className="mt-0.5 truncate text-[16px] font-semibold" style={{ color: "var(--text)" }}>
              {t(node.title || "Nomsiz lavozim")}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost h-8 w-8 !p-0" aria-label={t("Yopish")}>
            <X size={17} strokeWidth={2.3} />
          </button>
        </div>

        <div className="mt-3 flex gap-1">
          {(
            [
              ["asosiy", "Asosiy"],
              ["tavsif", "Vazifa va javobgarlik"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className="relative px-3 pb-2.5 pt-1 text-[13px] font-medium transition-colors"
              style={{ color: tab === key ? "var(--accent)" : "var(--text-secondary)" }}
            >
              {t(label)}
              {tab === key ? (
                <span
                  className="absolute inset-x-2 bottom-0 h-[2px] rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === "asosiy" ? (
          <>
            <label className="field-label">{t("Lavozim nomi")} *</label>
            <input
              className="field"
              value={node.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={t("Masalan: Savdo boʻlimi boshligʻi")}
            />

            <label className="field-label mt-4">{t("Xodim F.I.Sh.")}</label>
            <input
              className="field"
              value={node.personName ?? ""}
              onChange={(e) => onChange({ personName: e.target.value || null })}
              placeholder={t("Boʻsh qoldirilsa — vakant")}
            />

            <label className="field-label mt-4">{t("Boʻlim")}</label>
            <input
              className="field"
              value={node.department ?? ""}
              onChange={(e) => onChange({ department: e.target.value || null })}
              placeholder={t("Masalan: Savdo va marketing")}
            />

            <label className="field-label mt-4">{t("Kimga boʻysunadi")}</label>
            <select
              className="field"
              value={node.parentId ?? ""}
              onChange={(e) => onChange({ parentId: e.target.value || null })}
            >
              <option value="">{t("— Yuqori bogʻin (ildiz) —")}</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.title)}
                  {p.personName ? ` · ${t(p.personName)}` : ""}
                </option>
              ))}
            </select>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">{t("Email")}</label>
                <input
                  className="field"
                  type="email"
                  value={node.email ?? ""}
                  onChange={(e) => onChange({ email: e.target.value || null })}
                  placeholder="ism@korxona.uz"
                />
              </div>
              <div>
                <label className="field-label">{t("Telefon")}</label>
                <input
                  className="field"
                  value={node.phone ?? ""}
                  onChange={(e) => onChange({ phone: e.target.value || null })}
                  placeholder="+998 90 123 45 67"
                />
              </div>
            </div>

            <label className="field-label mt-4">{t("Rasm havolasi (ixtiyoriy)")}</label>
            <input
              className="field"
              value={node.photoUrl ?? ""}
              onChange={(e) => onChange({ photoUrl: e.target.value || null })}
              placeholder="https://..."
            />

            <label className="field-label mt-4">{t("Kartochka rangi")}</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ accent: null })}
                className="h-8 rounded-full px-3 text-[12px] font-medium transition-all"
                style={{
                  background: node.accent ? "var(--bg-subtle)" : "var(--accent-soft)",
                  color: node.accent ? "var(--text-secondary)" : "var(--accent)",
                }}
              >
                {t("Avto")}
              </button>
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ accent: c })}
                  aria-label={c}
                  className="h-8 w-8 rounded-full transition-transform duration-200"
                  style={{
                    background: c,
                    transform: node.accent === c ? "scale(1.12)" : "scale(1)",
                    boxShadow: node.accent === c ? `0 0 0 3px var(--bg-elevated), 0 0 0 5px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="field-label">{t("Qisqacha tavsif")}</label>
            <textarea
              className="field min-h-[84px] resize-y"
              value={node.summary ?? ""}
              onChange={(e) => onChange({ summary: e.target.value || null })}
              placeholder={t("Lavozimning asosiy maqsadi bir-ikki jumlada")}
            />

            {LIST_FIELDS.map(({ key, label, hint, Icon, tone }) => (
              <section key={key} className="mt-6">
                <h3 className="mb-2 flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-[7px]"
                    style={{ background: `${tone}16`, color: tone }}
                  >
                    <Icon size={13} strokeWidth={2.3} />
                  </span>
                  {t(label)}
                </h3>
                <ListEditor
                  items={node[key].length ? node[key] : [""]}
                  onChange={(next) => onChange({ [key]: next } as Partial<OrgNode>)}
                  hint={hint}
                  tone={tone}
                />
              </section>
            ))}
          </>
        )}
      </div>

      <div className="shrink-0 border-t px-5 py-3" style={{ borderColor: "var(--separator)" }}>
        <button type="button" className="btn btn-danger btn-sm w-full" onClick={onDelete}>
          <Trash2 size={14} strokeWidth={2.3} />
          {t("Lavozimni oʻchirish")}
        </button>
      </div>
    </div>
  );
}
