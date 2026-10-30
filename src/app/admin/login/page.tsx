"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Scissors, Loader2, ArrowRight, LogIn } from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Acesso negado", description: data.error, variant: "error" });
        return;
      }
      toast({ title: "Bem-vindo de volta!", variant: "success" });
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent-soft/60 blur-3xl" />
      </div>
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={40} />
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
            Acesse o painel
          </h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Gerencie agenda, clientes e seu site em um só lugar.
          </p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs text-foreground-muted">
            <LogIn className="h-4 w-4 text-accent" />
            Demo: <span className="font-medium text-foreground">admin@vanguard.com</span> / <span className="font-medium text-foreground">vanguard123</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Entrar
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs text-foreground-subtle">
          Vanguard SaaS · Plataforma premium para barbearias
        </p>
      </motion.div>
    </div>
  );
}
