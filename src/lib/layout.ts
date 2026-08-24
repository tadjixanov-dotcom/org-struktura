import dagre from "@dagrejs/dagre";
import type { OrgNode } from "./types";
import { NODE_H, NODE_W } from "./tree";

export type Positions = Record<string, { x: number; y: number }>;

/** Dagre yordamida avtomatik "yuqoridan-pastga" joylashuv. */
export function autoLayout(nodes: OrgNode[], direction: "TB" | "LR" = "TB"): Positions {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: direction === "TB" ? 46 : 34,
    ranksep: direction === "TB" ? 92 : 120,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const n of nodes) {
    if (n.parentId && ids.has(n.parentId) && n.parentId !== n.id) g.setEdge(n.parentId, n.id);
  }

  dagre.layout(g);

  const out: Positions = {};
  for (const n of nodes) {
    const pos = g.node(n.id);
    if (!pos) continue;
    out[n.id] = { x: Math.round(pos.x - NODE_W / 2), y: Math.round(pos.y - NODE_H / 2) };
  }
  return out;
}

/** Tugunlarning hech biri joylashtirilmagan bo'lsa — avtomatik joylashuv kerak. */
export function needsLayout(nodes: OrgNode[]): boolean {
  if (nodes.length === 0) return false;
  return nodes.every((n) => n.x === 0 && n.y === 0);
}
