"use client";

import Link from "next/link";
import { Network } from "lucide-react";
import { ScriptToggle, ThemeToggle } from "./Toggles";
import { useScript } from "./ScriptProvider";

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[10px]"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(150deg, #0a84ff 0%, #0071e3 45%, #5e5ce6 100%)",
        boxShadow: "0 2px 8px rgba(0,113,227,0.32)",
      }}
    >
      <Network size={size * 0.56} color="#fff" strokeWidth={2.3} />
    </span>
  );
}

export function SiteHeader({
  right,
  compact = false,
}: {
  right?: React.ReactNode;
  compact?: boolean;
}) {
  const { t } = useScript();
  return (
    <header
      className="glass sticky top-0 z-50 border-b"
      style={{ borderColor: "var(--separator)" }}
    >
      <div
        className={`mx-auto flex items-center gap-3 px-5 ${compact ? "h-14 max-w-none" : "h-16 max-w-6xl"}`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span
            className="text-[16px] font-semibold tracking-[-0.02em]"
            style={{ color: "var(--text)" }}
          >
            Org Struktura
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {right}
          <ScriptToggle compact />
          <ThemeToggle />
          {!right ? (
            <Link href="/admin" className="btn btn-primary btn-sm">
              {t("Admin panel")}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
