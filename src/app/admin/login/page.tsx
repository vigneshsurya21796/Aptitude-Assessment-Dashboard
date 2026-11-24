"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { Lock, Mail, Key, AlertCircle, ArrowRight } from "lucide-react";
import axios from "axios";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await axios.post("/api/admin/login", { email, password });
      router.push(from);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || "Authentication failed.");
      } else {
        setError("Network connection failure. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@aptitude.com");
    setPassword("Admin@1234");
  };

  return (
    <div className="surface-elevated max-w-md w-full rounded-2xl p-6 sm:p-10 border border-stone-border shadow-tinted-xl space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-obsidian-950 text-terracotta-400 flex items-center justify-center mx-auto shadow-tinted-sm">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-obsidian-950">
          Admin Login
        </h1>
        <p className="text-xs text-obsidian-600">
          Sign in to manage test questions, view candidate results, and configure settings.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-crimson-50 border border-crimson-500/20 text-crimson-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-crimson-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
            Admin Email
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aptitude.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-surface border border-stone-border text-sm focus:border-terracotta-500 focus:bg-white transition-all"
            />
            <Mail className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-surface border border-stone-border text-sm font-mono focus:border-terracotta-500 focus:bg-white transition-all"
            />
            <Key className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 active:bg-obsidian-900 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-stone-surface border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Authenticate Session</span>
              <ArrowRight className="w-4 h-4 text-terracotta-400" />
            </>
          )}
        </button>
      </form>

      {/* Seed Credentials Quick helper */}
      <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border space-y-2 text-xs">
        <div className="flex items-center justify-between text-obsidian-500 font-mono text-[11px]">
          <span>DEFAULT SEEDED CREDENTIALS</span>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-terracotta-600 hover:text-terracotta-700 font-semibold underline"
          >
            1-Click Auto-Fill
          </button>
        </div>
        <div className="font-mono text-obsidian-800 text-[11px] space-y-0.5">
          <div>Email: <strong>admin@aptitude.com</strong></div>
          <div>Password: <strong>Admin@1234</strong></div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-stone-surface flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Suspense
          fallback={
            <div className="w-8 h-8 border-2 border-obsidian-900 border-t-terracotta-500 rounded-full animate-spin" />
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
