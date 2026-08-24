"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useScript } from "./ScriptProvider";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  const { t } = useScript();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.34)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.965, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.975, y: 8, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.32 }}
            className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden"
            style={{
              maxWidth: width,
              background: "var(--bg-elevated)",
              borderRadius: 22,
              border: "1px solid var(--separator)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="flex shrink-0 items-start gap-3 border-b px-6 py-5" style={{ borderColor: "var(--separator)" }}>
              <div className="min-w-0 flex-1">
                <h2 className="t-heading" style={{ color: "var(--text)" }}>
                  {t(title)}
                </h2>
                {subtitle ? <p className="t-caption mt-1">{t(subtitle)}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="btn btn-ghost h-8 w-8 !p-0" aria-label={t("Yopish")}>
                <X size={17} strokeWidth={2.3} />
              </button>
            </div>

            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <div
                className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4"
                style={{ borderColor: "var(--separator)", background: "var(--bg-subtle)" }}
              >
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
