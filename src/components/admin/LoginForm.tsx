"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { Logo } from "@/components/SiteHeader";
import { ScriptToggle, ThemeToggle } from "@/components/Toggles";
import { useScript } from "@/components/ScriptProvider";

export function LoginForm() {
  const { t } = useScript();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Kirishda xatolik");
        setBusy(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Tarmoq xatosi. Qaytadan urinib koʻring.");
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="flex items-center gap-2 px-5 py-4">
        <Link href="/" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} strokeWidth={2.3} />
          {t("Bosh sahifa")}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ScriptToggle compact />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="rise w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Logo size={52} />
            </div>
            <h1 className="t-title" style={{ color: "var(--text)" }}>
              {t("Admin panel")}
            </h1>
            <p className="t-caption mt-2">{t("Tuzilmani tahrirlash uchun tizimga kiring")}</p>
          </div>

          <form onSubmit={submit} className="card p-6">
            <label className="field-label" htmlFor="username">
              {t("Foydalanuvchi nomi")}
            </label>
            <div className="relative">
              <User
                size={15}
                strokeWidth={2.2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                id="username"
                className="field !pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                placeholder="admin"
              />
            </div>

            <label className="field-label mt-4" htmlFor="password">
              {t("Parol")}
            </label>
            <div className="relative">
              <Lock
                size={15}
                strokeWidth={2.2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                id="password"
                type={show ? "text" : "password"}
                className="field !pl-9 !pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                style={{ color: "var(--text-tertiary)" }}
                aria-label={t(show ? "Parolni yashirish" : "Parolni korsatish")}
              >
                {show ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
              </button>
            </div>

            {error ? (
              <div
                className="mt-4 flex items-start gap-2 rounded-[11px] px-3.5 py-2.5 text-[13px]"
                style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}
              >
                <AlertCircle size={15} strokeWidth={2.3} className="mt-px shrink-0" />
                <span>{t(error)}</span>
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {t("Kirish")}
            </button>
          </form>

          <p className="t-caption mt-5 text-center">
            {t("Parolni admin panelning “Sozlamalar” boʻlimida oʻzgartirish mumkin.")}
          </p>
        </div>
      </div>
    </div>
  );
}
