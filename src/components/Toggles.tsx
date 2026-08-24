"use client";

import { Moon, Sun, Laptop } from "lucide-react";
import { useScript } from "./ScriptProvider";

/** Lotin / Kirill almashtirgichi. */
export function ScriptToggle({ compact = false }: { compact?: boolean }) {
  const { script, setScript } = useScript();
  const options = [
    { key: "latn" as const, label: compact ? "Lat" : "Lotin" },
    { key: "cyrl" as const, label: compact ? "Кир" : "Кирилл" },
  ];

  return (
    <div
      className="relative inline-flex items-center rounded-full p-[3px]"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--separator)" }}
      role="group"
      aria-label="Yozuv turi"
    >
      {options.map((o) => {
        const active = script === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setScript(o.key)}
            aria-pressed={active}
            className="relative z-10 rounded-full px-3 py-1 text-[13px] font-semibold transition-colors duration-200"
            style={{
              color: active ? "#fff" : "var(--text-secondary)",
              background: active ? "var(--accent)" : "transparent",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Yorug' / qorong'i / tizim rejimi. */
export function ThemeToggle() {
  const { theme, setTheme } = useScript();
  const options = [
    { key: "light" as const, Icon: Sun, label: "Yorugʻ" },
    { key: "dark" as const, Icon: Moon, label: "Qorongʻi" },
    { key: "system" as const, Icon: Laptop, label: "Tizim" },
  ];

  return (
    <div
      className="inline-flex items-center rounded-full p-[3px]"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--separator)" }}
      role="group"
      aria-label="Mavzu"
    >
      {options.map(({ key, Icon, label }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setTheme(key)}
            className="rounded-full p-1.5 transition-colors duration-200"
            style={{
              color: active ? "#fff" : "var(--text-secondary)",
              background: active ? "var(--accent)" : "transparent",
            }}
          >
            <Icon size={15} strokeWidth={2.1} />
          </button>
        );
      })}
    </div>
  );
}
