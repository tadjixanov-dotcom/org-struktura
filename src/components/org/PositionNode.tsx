"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Users, Plus } from "lucide-react";
import type { OrgNode } from "@/lib/types";
import { useScript } from "@/components/ScriptProvider";
import { NODE_H, NODE_W } from "@/lib/tree";

export type PositionNodeData = {
  node: OrgNode;
  childCount: number;
  depth: number;
  editable: boolean;
  dimmed: boolean;
  dropTarget: boolean;
  onAddChild?: (parentId: string) => void;
};

export type PositionFlowNode = Node<PositionNodeData, "position">;

function initials(name: string | null, fallback: string) {
  const source = (name || fallback || "").trim();
  if (!source) return "—";
  const parts = source.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "—";
}

const LEVEL_TONE = ["#0071e3", "#5e5ce6", "#30b0c7", "#34c759", "#ff9f0a", "#ff375f"];

function PositionNodeInner({ data, selected }: NodeProps<PositionFlowNode>) {
  const { t } = useScript();
  const { node, childCount, depth, editable, dimmed, dropTarget } = data;
  const accent = node.accent || LEVEL_TONE[depth % LEVEL_TONE.length];
  const title = t(node.title);
  const hasPerson = Boolean(node.personName || node.photoUrl);

  return (
    <div
      className="group relative"
      style={{
        width: NODE_W,
        minHeight: NODE_H,
        opacity: dimmed ? 0.34 : 1,
        transition: "opacity 220ms ease, transform 180ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      {/* Yuqoridan — gorizontal qatorda, chapdan — vertikal ustunda ulanadi */}
      <Handle id="top" type="target" position={Position.Top} style={{ top: -5 }} />
      <Handle id="left" type="target" position={Position.Left} style={{ left: -5 }} />

      <div
        className="relative flex h-full flex-col overflow-hidden"
        style={{
          background: "var(--bg-elevated)",
          border: `1px solid ${
            selected ? accent : dropTarget ? "var(--success)" : "var(--separator)"
          }`,
          borderRadius: 16,
          boxShadow: selected
            ? `0 0 0 3px ${accent}22, var(--shadow-md)`
            : dropTarget
              ? "0 0 0 3px rgba(52,199,89,.22), var(--shadow-md)"
              : "var(--shadow-sm)",
          transition: "box-shadow 200ms ease, border-color 200ms ease",
        }}
      >
        <div style={{ height: 3, background: accent }} />

        <div className="flex items-start gap-2.5 px-3.5 pb-2 pt-2.5">
          {hasPerson ? (
            <div
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold"
              style={{
                width: 40,
                height: 40,
                background: `${accent}1a`,
                color: accent,
                border: `1px solid ${accent}33`,
              }}
            >
              {node.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={node.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(node.personName, node.title)
              )}
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div
              className={hasPerson ? "line-clamp-2" : "line-clamp-3"}
              style={{
                color: "var(--text)",
                letterSpacing: "-0.014em",
                fontWeight: 600,
                fontSize: title.length > 58 ? 12 : title.length > 38 ? 13 : 14.5,
                lineHeight: 1.24,
              }}
              title={title}
            >
              {title}
            </div>
            {hasPerson ? (
              <div
                className="mt-0.5 truncate text-[12.5px]"
                style={{ color: "var(--text-secondary)" }}
                title={t(node.personName)}
              >
                {t(node.personName)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 px-3.5 pb-3">
          {node.department ? (
            <span
              className="truncate rounded-full px-2 py-[3px] text-[11px] font-medium"
              style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)", maxWidth: 150 }}
            >
              {t(node.department)}
            </span>
          ) : null}
          {childCount > 0 ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold"
              style={{ background: `${accent}14`, color: accent }}
              title={t("Bevosita boysunuvchilar")}
            >
              <Users size={11} strokeWidth={2.4} />
              {childCount}
            </span>
          ) : null}
        </div>
      </div>

      {editable ? (
        <button
          type="button"
          className="absolute -bottom-3 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100"
          style={{ background: accent, color: "#fff" }}
          title={t("Boysunuvchi qoshish")}
          aria-label={t("Boysunuvchi qoshish")}
          onClick={(e) => {
            e.stopPropagation();
            data.onAddChild?.(node.id);
          }}
        >
          <Plus size={14} strokeWidth={2.8} />
        </button>
      ) : null}

      <Handle id="bottom" type="source" position={Position.Bottom} style={{ bottom: -5 }} />
      {/* Ustunli joylashuvda chiziq kartochkaning chap yelkasidan tushadi */}
      <Handle
        id="bottomLeft"
        type="source"
        position={Position.Bottom}
        style={{ bottom: -5, left: 26, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

export const PositionNode = memo(PositionNodeInner);
