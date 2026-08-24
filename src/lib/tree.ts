import type { OrgNode, OrgTreeNode } from "./types";

export const NODE_W = 268;
export const NODE_H = 132;

/** Yassi ro'yxatdan daraxt quradi. Halqalar (cycle) xavfsiz uziladi. */
export function buildTree(nodes: OrgNode[]): OrgTreeNode[] {
  const byId = new Map<string, OrgTreeNode>();
  for (const n of nodes) byId.set(n.id, { ...n, children: [], depth: 0 });

  const roots: OrgTreeNode[] = [];
  for (const n of byId.values()) {
    const parent = n.parentId ? byId.get(n.parentId) : undefined;
    if (parent && parent.id !== n.id) parent.children.push(n);
    else roots.push(n);
  }

  const seen = new Set<string>();
  const setDepth = (list: OrgTreeNode[], depth: number) => {
    for (const n of list) {
      if (seen.has(n.id)) {
        n.children = [];
        continue;
      }
      seen.add(n.id);
      n.depth = depth;
      n.children.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
      setDepth(n.children, depth + 1);
    }
  };
  roots.sort((a, b) => a.sortOrder - b.sortOrder);
  setDepth(roots, 0);

  // Halqa tufayli tashqarida qolganlarni ildizga qo'shamiz
  for (const n of byId.values()) if (!seen.has(n.id)) { n.depth = 0; roots.push(n); seen.add(n.id); }
  return roots;
}

export function flatten(tree: OrgTreeNode[]): OrgTreeNode[] {
  const out: OrgTreeNode[] = [];
  const walk = (list: OrgTreeNode[]) => {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(tree);
  return out;
}

/** Berilgan tugunning barcha avlodlari (o'zi kirmaydi). */
export function descendantIds(nodes: OrgNode[], id: string): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const list = childrenOf.get(n.parentId) ?? [];
    list.push(n.id);
    childrenOf.set(n.parentId, list);
  }
  const out = new Set<string>();
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    stack.push(...(childrenOf.get(cur) ?? []));
  }
  return out;
}

export function pathToRoot(nodes: OrgNode[], id: string): OrgNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chain: OrgNode[] = [];
  let cur = byId.get(id);
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

export function statistics(nodes: OrgNode[]) {
  const tree = buildTree(nodes);
  const all = flatten(tree);
  const depth = all.reduce((m, n) => Math.max(m, n.depth + 1), 0);
  const managers = all.filter((n) => n.children.length > 0).length;
  const departments = new Set(all.map((n) => (n.department || "").trim()).filter(Boolean));
  return {
    total: all.length,
    depth,
    managers,
    performers: all.length - managers,
    departments: departments.size,
  };
}
