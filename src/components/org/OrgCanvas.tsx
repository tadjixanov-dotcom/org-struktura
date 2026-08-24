"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeChange,
  type OnConnect,
} from "@xyflow/react";
import { PositionNode, type PositionFlowNode } from "./PositionNode";
import type { OrgNode } from "@/lib/types";
import { NODE_H, NODE_W, descendantIds } from "@/lib/tree";
import { useScript } from "@/components/ScriptProvider";

const nodeTypes = { position: PositionNode };

export type CanvasApi = {
  fitView: () => void;
  /** Sxemani PNG (dataURL) sifatida chizadi. */
  toPng: (opts?: { width?: number; height?: number; background?: string }) => Promise<{
    dataUrl: string;
    width: number;
    height: number;
  } | null>;
  focusNode: (id: string) => void;
};

type Props = {
  nodes: OrgNode[];
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onReparent?: (childId: string, parentId: string | null) => void;
  onAddChild?: (parentId: string) => void;
  search?: string;
  onReady?: (api: CanvasApi) => void;
  className?: string;
};

function matches(node: OrgNode, q: string) {
  if (!q) return true;
  const hay = [node.title, node.personName, node.department, node.summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

function Inner({
  nodes,
  editable = false,
  selectedId = null,
  onSelect,
  onMove,
  onReparent,
  onAddChild,
  search = "",
  onReady,
}: Props) {
  const { t } = useScript();
  const rf = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const [dark, setDark] = useState(false);

  // Chiziq rangi CSS o'zgaruvchisi orqali emas, to'g'ridan-to'g'ri beriladi:
  // aks holda PNG/PDF eksportida SVG chiziqlar butunlay yo'qoladi.
  useEffect(() => {
    const read = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      setDark(
        attr === "dark" ||
          (attr !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    };
    read();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", read);
      observer.disconnect();
    };
  }, []);
  const edgeStroke = dark ? "#5c5c63" : "#b4b4ba";
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<PositionFlowNode>([]);
  const [rfEdges, setRfEdges] = useEdgesState<Edge>([]);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const didFit = useRef(false);

  const depthOf = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const memo = new Map<string, number>();
    const calc = (id: string, guard = new Set<string>()): number => {
      if (memo.has(id)) return memo.get(id)!;
      if (guard.has(id)) return 0;
      guard.add(id);
      const n = byId.get(id);
      const d = n?.parentId && byId.has(n.parentId) ? calc(n.parentId, guard) + 1 : 0;
      memo.set(id, d);
      return d;
    };
    const out = new Map<string, number>();
    for (const n of nodes) out.set(n.id, calc(n.id));
    return out;
  }, [nodes]);

  const childCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) if (n.parentId) m.set(n.parentId, (m.get(n.parentId) ?? 0) + 1);
    return m;
  }, [nodes]);

  // Props -> React Flow
  useEffect(() => {
    const q = search.trim();
    setRfNodes(
      nodes.map<PositionFlowNode>((n) => ({
        id: n.id,
        type: "position",
        position: { x: n.x, y: n.y },
        draggable: editable,
        selected: n.id === selectedId,
        data: {
          node: n,
          depth: depthOf.get(n.id) ?? 0,
          childCount: childCounts.get(n.id) ?? 0,
          editable,
          dimmed: q.length > 0 && !matches(n, q),
          dropTarget: n.id === dropTargetId,
          onAddChild,
        },
      }))
    );

    const byId = new Map(nodes.map((n) => [n.id, n]));

    // Bir rahbarning bo'ysunuvchilari vertikal ustunda turibdimi yoki gorizontal qatorda —
    // shunga qarab ulash chizig'i "qavs" (chapdan) yoki "daraxt" (yuqoridan) bo'ladi.
    const kidsOf = new Map<string, OrgNode[]>();
    for (const n of nodes) {
      if (!n.parentId || !byId.has(n.parentId)) continue;
      const list = kidsOf.get(n.parentId) ?? [];
      list.push(n);
      kidsOf.set(n.parentId, list);
    }
    const isColumnGroup = new Map<string, boolean>();
    for (const [pid, kids] of kidsOf) {
      const parent = byId.get(pid)!;
      if (kids.length === 1) {
        isColumnGroup.set(pid, kids[0].x > parent.x + 16 && kids[0].x < parent.x + NODE_W);
        continue;
      }
      const xs = kids.map((k) => k.x);
      const ys = kids.map((k) => k.y);
      isColumnGroup.set(pid, Math.max(...ys) - Math.min(...ys) > Math.max(...xs) - Math.min(...xs));
    }

    setRfEdges(
      nodes
        .filter((n) => n.parentId && byId.has(n.parentId))
        .map<Edge>((n) => {
          const parent = byId.get(n.parentId!)!;
          const column = isColumnGroup.get(n.parentId!) ?? false;
          const below = n.y > parent.y + NODE_H * 0.4;
          // Faqat vertikal ustunda turgan bo'ysunuvchilar chapdan ulanadi.
          // Gorizontal qatordagilar doimo yuqoridan — shunda chiziqlar bir xil turadi.
          const sideAttached = below && column;
          // Chiziq rahbarning chap yelkasidan tushadi — faqat bo'ysunuvchi
          // rahbar kartochkasi kengligi ichida joylashgan bo'lsa
          const fromShoulder = sideAttached && n.x >= parent.x && n.x < parent.x + NODE_W;
          return {
            id: `${n.parentId}->${n.id}`,
            source: n.parentId!,
            target: n.id,
            sourceHandle: fromShoulder ? "bottomLeft" : "bottom",
            targetHandle: sideAttached ? "left" : "top",
            type: "smoothstep",
            pathOptions: { borderRadius: 10 } as never,
            animated: false,
            style: { stroke: edgeStroke, strokeWidth: 1.6 },
          };
        })
    );
  }, [
    nodes,
    editable,
    selectedId,
    search,
    dropTargetId,
    depthOf,
    childCounts,
    onAddChild,
    edgeStroke,
    setRfNodes,
    setRfEdges,
  ]);

  // Birinchi yuklanishda ko'rinishga moslash — tugunlar o'lchangandan keyin
  useEffect(() => {
    if (didFit.current || !nodesInitialized || rfNodes.length === 0) return;
    didFit.current = true;
    const id = window.setTimeout(() => {
      rf.fitView({ padding: 0.12, duration: 420, maxZoom: 1, minZoom: 0.05 });
    }, 40);
    return () => window.clearTimeout(id);
  }, [nodesInitialized, rfNodes.length, rf]);

  /* ---------- Tortib qo'yish orqali bo'ysundirish ---------- */

  const forbidden = useCallback(
    (draggedId: string) => {
      const set = descendantIds(nodes, draggedId);
      set.add(draggedId);
      return set;
    },
    [nodes]
  );

  const targetUnder = useCallback(
    (draggedId: string, x: number, y: number) => {
      const cx = x + NODE_W / 2;
      const cy = y + NODE_H / 2;
      // Tasodifan bo'ysundirib qo'ymaslik uchun kartochkaning faqat markaziy
      // qismiga tushirilgandagina rahbar almashadi (chetlari xavfsiz zona).
      const insetX = NODE_W * 0.22;
      const insetY = NODE_H * 0.22;
      const banned = forbidden(draggedId);
      for (const n of nodes) {
        if (banned.has(n.id)) continue;
        if (
          cx >= n.x + insetX &&
          cx <= n.x + NODE_W - insetX &&
          cy >= n.y + insetY &&
          cy <= n.y + NODE_H - insetY
        )
          return n.id;
      }
      return null;
    },
    [nodes, forbidden]
  );

  const handleNodeDrag = useCallback(
    (_e: unknown, node: { id: string; position: { x: number; y: number } }) => {
      if (!editable) return;
      setDropTargetId(targetUnder(node.id, node.position.x, node.position.y));
    },
    [editable, targetUnder]
  );

  const handleNodeDragStop = useCallback(
    (_e: unknown, node: { id: string; position: { x: number; y: number } }) => {
      if (!editable) return;
      const target = targetUnder(node.id, node.position.x, node.position.y);
      setDropTargetId(null);
      if (target && onReparent) {
        onReparent(node.id, target);
        return;
      }
      onMove?.(node.id, Math.round(node.position.x), Math.round(node.position.y));
    },
    [editable, targetUnder, onReparent, onMove]
  );

  const handleConnect = useCallback<OnConnect>(
    (conn) => {
      if (!editable || !conn.source || !conn.target) return;
      if (forbidden(conn.target).has(conn.source)) return;
      onReparent?.(conn.target, conn.source);
    },
    [editable, forbidden, onReparent]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<PositionFlowNode>[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  /* ---------- Tashqi API ---------- */

  const api = useMemo<CanvasApi>(
    () => ({
      fitView: () => rf.fitView({ padding: 0.18, duration: 420, maxZoom: 1 }),
      focusNode: (id: string) => {
        const n = nodes.find((x) => x.id === id);
        if (!n) return;
        rf.setCenter(n.x + NODE_W / 2, n.y + NODE_H / 2, { zoom: 1.1, duration: 480 });
      },
      toPng: async (opts) => {
        if (nodes.length === 0) return null;
        const { toPng } = await import("html-to-image");
        const el = document.querySelector<HTMLElement>(".react-flow__viewport");
        if (!el) return null;

        const bounds = getNodesBounds(rf.getNodes());
        const padPx = 56;
        const contentW = Math.max(bounds.width + padPx * 2, 720);
        const contentH = Math.max(bounds.height + padPx * 2, 460);

        // Chop etishda o'qilarli bo'lishi uchun kattalashtiramiz, ammo 4200px dan oshirmaymiz
        const scale = Math.min(2.5, Math.max(1, 4200 / Math.max(contentW, contentH)));
        const width = Math.round(contentW * scale);
        const height = Math.round(contentH * scale);

        // getViewportForBounds'da padding — nisbat (0.04 = 4%), piksel emas
        const viewport = getViewportForBounds(bounds, width, height, 0.05, 4, 0.04);

        const isDark =
          document.documentElement.getAttribute("data-theme") === "dark" ||
          (!document.documentElement.getAttribute("data-theme") &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);

        const dataUrl = await toPng(el, {
          backgroundColor: opts?.background ?? (isDark ? "#0b0b0d" : "#ffffff"),
          width,
          height,
          pixelRatio: 1,
          cacheBust: true,
          filter: (n) => {
            const cl = (n as HTMLElement)?.classList;
            if (!cl) return true;
            return !(
              cl.contains("react-flow__minimap") ||
              cl.contains("react-flow__controls") ||
              cl.contains("react-flow__panel")
            );
          },
          style: {
            width: `${width}px`,
            height: `${height}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
        });
        return { dataUrl, width, height };
      },
    }),
    [rf, nodes]
  );

  useEffect(() => {
    onReady?.(api);
  }, [api, onReady]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onNodeDrag={handleNodeDrag}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      onNodeClick={(_, n) => onSelect?.(n.id)}
      onPaneClick={() => onSelect?.(null)}
      nodesConnectable={editable}
      nodesDraggable={editable}
      elementsSelectable
      minZoom={0.12}
      maxZoom={2.2}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "smoothstep" }}
      className="h-full w-full"
      style={{ background: "var(--bg-canvas)" }}
    >
      <Background variant={BackgroundVariant.Dots} gap={26} size={1.1} color="var(--separator-strong)" />
      <Controls
        showInteractive={false}
        position="bottom-right"
        aria-label={t("Masshtab")}
      />
      <MiniMap
        position="bottom-left"
        pannable
        zoomable
        maskColor="color-mix(in srgb, var(--bg-canvas) 78%, transparent)"
        nodeColor={(n) => {
          const d = (n.data as PositionFlowNode["data"] | undefined)?.node;
          return d?.accent || "#0071e3";
        }}
        style={{ background: "var(--bg-elevated)" }}
      />
    </ReactFlow>
  );
}

export function OrgCanvas(props: Props) {
  return (
    <div className={props.className ?? "h-full w-full"}>
      <ReactFlowProvider>
        <Inner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
