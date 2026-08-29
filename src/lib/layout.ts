import type { OrgNode } from "./types";
import { NODE_H, NODE_W } from "./tree";

export type Positions = Record<string, { x: number; y: number }>;

/* Joylashuv o'lchamlari */
const H_GAP = 44; // qo'shni shoxlar orasidagi gorizontal masofa
const V_GAP = 78; // bosqichlar orasidagi vertikal masofa
const COL_INDENT = 56; // ustun rejimida bo'ysunuvchilarni chapdan surish
// (ulash chizig'i rahbar kartochkasining chap yelkasidan tushib, shu bo'sh yo'lakda ketadi)
const COL_VGAP = 16; // ustunda qo'shnilar orasidagi masofa
const COL_TOP = 40; // rahbardan birinchi bo'ysunuvchigacha
const ROOT_GAP = 96; // bir nechta ildiz orasidagi masofa
const MARGIN = 48;

/**
 * Ustun rejimi qaysi chuqurlikdan boshlanishini tuzilmaning o'zidan aniqlaymiz:
 * ko'p (>=5) bo'ysunuvchili birinchi bo'g'in — "keng" bosqich (direktor/rektor qatori);
 * undan bitta pastdagi bosqichdan boshlab bo'limlar vertikal ustunga teriladi.
 * Shu tufayli Kuzatuv kengashi kabi qo'shimcha yuqori bo'g'inlar qo'shilsa ham,
 * sxema klassik org-chart ko'rinishini saqlaydi.
 */
const WIDE_CHILDREN = 5;
const DEFAULT_COLUMN_FROM = 2;

type Plan = {
  id: string;
  w: number;
  h: number;
  mode: "leaf" | "row" | "col";
  kids: Plan[];
};

function measure(
  node: OrgNode,
  childrenOf: Map<string, OrgNode[]>,
  depth: number,
  guard: Set<string>,
  columnFrom: number
): Plan {
  const base: Plan = { id: node.id, w: NODE_W, h: NODE_H, mode: "leaf", kids: [] };
  if (guard.has(node.id)) return base;
  guard.add(node.id);

  const children = childrenOf.get(node.id) ?? [];
  if (children.length === 0) return base;

  const kids = children.map((c) => measure(c, childrenOf, depth + 1, guard, columnFrom));

  // "Keng" tugun: bo'ysunuvchilari ko'p va aksariyati o'z bo'ysunuvchilariga ega
  // bo'lsa (masalan, REKTOR ijrochi direktor ostida tursa ham), qator rejimida chiziladi.
  const branchy = kids.filter((k) => k.mode !== "leaf").length;
  const wideBranchy =
    kids.length >= WIDE_CHILDREN && branchy >= 3 && branchy * 2 >= kids.length;

  if (depth >= columnFrom && !wideBranchy) {
    const w = Math.max(NODE_W, COL_INDENT + Math.max(...kids.map((k) => k.w)));
    const h =
      NODE_H + COL_TOP + kids.reduce((s, k) => s + k.h, 0) + COL_VGAP * (kids.length - 1);
    return { ...base, mode: "col", kids, w, h };
  }

  // Gorizontal rejim: barcha bo'ysunuvchilar yonma-yon.
  // Ular bir xil y'da turgani uchun ulash chiziqlari faqat bosqichlar orasidagi
  // bo'sh yo'lakda ketadi va hech qachon kartochka ustidan o'tmaydi.
  const childrenW = kids.reduce((s, k) => s + k.w, 0) + H_GAP * (kids.length - 1);
  return {
    ...base,
    mode: "row",
    kids,
    w: Math.max(NODE_W, childrenW),
    h: NODE_H + V_GAP + Math.max(...kids.map((k) => k.h)),
  };
}

function place(plan: Plan, x: number, y: number, out: Positions) {
  if (plan.mode === "leaf") {
    out[plan.id] = { x: Math.round(x), y: Math.round(y) };
    return;
  }

  if (plan.mode === "col") {
    out[plan.id] = { x: Math.round(x), y: Math.round(y) };
    let cy = y + NODE_H + COL_TOP;
    for (const kid of plan.kids) {
      place(kid, x + COL_INDENT, cy, out);
      cy += kid.h + COL_VGAP;
    }
    return;
  }

  // row
  const childrenW = plan.kids.reduce((s, k) => s + k.w, 0) + H_GAP * (plan.kids.length - 1);
  out[plan.id] = { x: Math.round(x + (plan.w - NODE_W) / 2), y: Math.round(y) };

  let cx = x + (plan.w - childrenW) / 2;
  const cy = y + NODE_H + V_GAP;
  for (const kid of plan.kids) {
    place(kid, cx, cy, out);
    cx += kid.w + H_GAP;
  }
}

/**
 * Tashkiliy tuzilma uchun ixcham avtomatik joylashuv.
 * Rahbariyat gorizontal qatorda, bo'limlar rahbar ostida vertikal ustunda.
 */
export function autoLayout(nodes: OrgNode[], _direction: "TB" | "LR" = "TB"): Positions {
  if (nodes.length === 0) return {};

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, OrgNode[]>();
  const roots: OrgNode[] = [];

  for (const n of nodes) {
    const parent = n.parentId && n.parentId !== n.id ? byId.get(n.parentId) : undefined;
    if (!parent) {
      roots.push(n);
      continue;
    }
    const list = childrenOf.get(parent.id) ?? [];
    list.push(n);
    childrenOf.set(parent.id, list);
  }

  for (const list of childrenOf.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "uz"));
  }
  roots.sort((a, b) => a.sortOrder - b.sortOrder);

  // "Keng" bosqichni topamiz: >=WIDE_CHILDREN bo'ysunuvchili eng yuqori bo'g'in
  const depthOf = new Map<string, number>();
  {
    const stack: [OrgNode, number][] = roots.map((r) => [r, 0]);
    while (stack.length) {
      const [n, d] = stack.pop()!;
      if (depthOf.has(n.id)) continue;
      depthOf.set(n.id, d);
      for (const c of childrenOf.get(n.id) ?? []) stack.push([c, d + 1]);
    }
  }
  let wideDepth = Infinity;
  for (const [id, kids] of childrenOf) {
    if (kids.length >= WIDE_CHILDREN) {
      wideDepth = Math.min(wideDepth, depthOf.get(id) ?? Infinity);
    }
  }
  const columnFrom =
    wideDepth === Infinity ? DEFAULT_COLUMN_FROM : Math.max(1, wideDepth + 1);

  const guard = new Set<string>();
  const plans = roots.map((r) => measure(r, childrenOf, 0, guard, columnFrom));

  // Halqa tufayli chetda qolgan tugunlar bo'lsa, ularni ham ildiz sifatida qo'shamiz
  for (const n of nodes) {
    if (!guard.has(n.id)) plans.push(measure(n, childrenOf, 0, guard, columnFrom));
  }

  const out: Positions = {};
  let x = MARGIN;
  for (const plan of plans) {
    place(plan, x, MARGIN, out);
    x += plan.w + ROOT_GAP;
  }
  return out;
}

/** Tugunlarning hech biri joylashtirilmagan bo'lsa — avtomatik joylashuv kerak. */
export function needsLayout(nodes: OrgNode[]): boolean {
  if (nodes.length === 0) return false;
  return nodes.every((n) => n.x === 0 && n.y === 0);
}
