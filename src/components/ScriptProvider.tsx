"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { convert, type Script } from "@/lib/translit";

type Theme = "light" | "dark" | "system";

type Ctx = {
  script: Script;
  setScript: (s: Script) => void;
  /** Matnni joriy yozuvga o'giradi. */
  t: (text: string | null | undefined) => string;
  theme: Theme;
  setTheme: (t: Theme) => void;
  mounted: boolean;
};

const ScriptContext = createContext<Ctx | null>(null);

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const [script, setScriptState] = useState<Script>("latn");
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("org-script");
      if (s === "cyrl" || s === "latn") setScriptState(s);
      const t = localStorage.getItem("org-theme");
      if (t === "dark" || t === "light") setThemeState(t);
    } catch {
      /* localStorage mavjud bo'lmasligi mumkin */
    }
    setMounted(true);
  }, []);

  const setScript = useCallback((s: Script) => {
    setScriptState(s);
    try {
      localStorage.setItem("org-script", s);
    } catch {}
    document.documentElement.setAttribute("data-script", s);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      if (t === "system") localStorage.removeItem("org-theme");
      else localStorage.setItem("org-theme", t);
    } catch {}
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  }, []);

  const t = useCallback(
    (text: string | null | undefined) => (script === "latn" ? text ?? "" : convert(text, script)),
    [script]
  );

  const value = useMemo<Ctx>(
    () => ({ script, setScript, t, theme, setTheme, mounted }),
    [script, setScript, t, theme, setTheme, mounted]
  );

  return <ScriptContext.Provider value={value}>{children}</ScriptContext.Provider>;
}

export function useScript(): Ctx {
  const ctx = useContext(ScriptContext);
  if (!ctx) {
    // Provider tashqarisida ham xavfsiz ishlashi uchun
    return {
      script: "latn",
      setScript: () => {},
      t: (text) => text ?? "",
      theme: "system",
      setTheme: () => {},
      mounted: false,
    };
  }
  return ctx;
}

/** Qisqa yordamchi: <T>Matn</T> */
export function T({ children }: { children: string }) {
  const { t } = useScript();
  return <>{t(children)}</>;
}
