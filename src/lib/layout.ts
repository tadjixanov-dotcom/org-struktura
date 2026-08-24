import type { OrgNode } from "./types";
import { NODE_H, NODE_W } from "./tree";

export type Positions = Record<string, { x: number; y: number }>;

/* Joylashuv o'lchamlari */
const H_GAP = 44; // qo'shni shoxlar orasidagi gorizontal masofa
const V_GAP = 86; // bosqichlar orasidagi vertikal masofa
const COL_INDENT = 56; // ustun rejimida bo'ysunuvchilarni chapdan surish
// (ulash chizig'i rahbar kartochkasining chap yelkasidan tushib, shu bo'sh yo'lakda ketadi)
const COL_VGAP = 18; // ustunda qo'shnilar orasidagi masofa
const COL_TOP = 46; // rahbardan birinchi bo'ysunuvchigacha
const ROOT_GAP = 96; // bir nechta ildiz orasidagi masofa
const MARGIN = 48;

/**
 * Ustun rejimi shu chuqurlikdan boshlanadi: yuqori bo'g'inlar (rahbariyat)
 * gorizontal qatorda, bo'limlar esa rahbar ostida vertikal ro'yxat bo'lib turadi —
 * bu klassik org-chart ko'rinishi va sxemani keskin ixchamlashtiradi.
 */
const COLUMN_FROM_DEPTH = 2;

/** Yakka (bo'ysunuvchisi yo'q) lavozimlar shuncha va undan ko'p bo'lsa, bitta ustunga yig'iladi. */
const STACK_THRESHOLD = 3;

type Plan = {
  id: string;
  w: number;
  h: number;
  mode: "leaf" | "row" | "col";
  kids: Plan[];
  /** row rejimida bitta vertikal ustunga yig'ilgan yakka lavozimlar */
  stack: Plan[];
  /** row rejimida joylashtiriladigan slotlar: shoxlar + (kerak bo'lsa) yig'ma ustun */
  slots: { plan: Plan | null; w: number; h: number }[];
};

function measure(
  node: OrgNode,
  childrenOf: Map<string, OrgNode[]>,
  depth: number,
  guard: Set<string>
): Plan {
  const base: Plan = { id: node.id, w: NODE_W, h: NODE_H, mode: "leaf", kids: [], stack: [], slots: [] };
  if (guard.has(node.id)) return base;
  guard.add(node.id);

  const children = childrenOf.get(node.id) ?? [];
  if (children.length === 0) return base;

  const kids = children.map((c) => measure(c, childrenOf, depth + 1, guard));

  if (depth >= COLUMN_FROM_DEPTH) {
    const w = Math.max(NODE_W, COL_INDENT + Math.max(...kids.map((k) => k.w)));
    const h =
      NODE_H + COL_TOP + kids.reduce((s, k) => s + k.h, 0) + COL_VGAP * (kids.length - 1);
    return { ...base, mode: "col", kids, w, h };
  }

  // Gorizontal rejim: shoxlar yonma-yon, yakka lavozimlar bitta ustunga
  const branches = kids.filter((k) => k.mode !== "leaf");
  const leaves = kids.filter((k) => k.mode === "leaf");

  const slots: Plan["slots"] = branches.map((p) => ({ plan: p, w: p.w, h: p.h }));
  let stack: Plan[] = [];

  if (leaves.length >= STACK_THRESHOLD) {
    stack = leaves;
    slots.push({
      plan: null,
      w: NODE_W,
      h: leaves.length * NODE_H + COL_VGAP * (leaves.length - 1),
    });
  } else {
    for (const l of leaves) slots.push({ plan: l, w: l.w, h: l.h });
  }

  const childrenW = slots.reduce((s, sl) => s + sl.w, 0) + H_GAP * (slots.length - 1);
  return {
    ...base,
    mode: "row",
    kids,
    stack,
    slots,
    w: Math.max(NODE_W, childrenW),
    h: NODE_H + V_GAP + Math.max(...slots.map((s) => s.h)),
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
  const childrenW =
    plan.slots.reduce((s, sl) => s + sl.w, 0) + H_GAP * (plan.slots.length - 1);
  out[plan.id] = { x: Math.round(x + (plan.w - NODE_W) / 2), y: Math.round(y) };

  let cx = x + (plan.w - childrenW) / 2;
  const cy = y + NODE_H + V_GAP;
  for (const slot of plan.slots) {
    if (slot.plan) {
      place(slot.plan, cx, cy, out);
    } else {
      let sy = cy;
      for (const leaf of plan.stack) {
        out[leaf.id] = { x: Math.round(cx), y: Math.round(sy) };
        sy += NODE_H + COL_VGAP;
      }
    }
    cx += slot.w + H_GAP;
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

  const guard = new Set<string>();
  const plans = roots.map((r) => measure(r, childrenOf, 0, guard));

  // Halqa tufayli chetda qolgan tugunlar bo'lsa, ularni ham ildiz sifatida qo'shamiz
  for (const n of nodes) {
    if (!guard.has(n.id)) plans.push(measure(n, childrenOf, 0, guard));
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
