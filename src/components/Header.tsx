"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Award, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface HeaderProps {
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false }: HeaderProps) {
  const pathname = usePathname();
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  useEffect(() => {
    axios
      .get("/api/admin/me")
      .then((res) => {
        if (res.data?.admin) setAdminLoggedIn(true);
        else setAdminLoggedIn(false);
      })
      .catch(() => setAdminLoggedIn(false));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/admin/logout");
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/admin/login";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-border bg-stone-surface/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-terracotta-500 rounded-lg p-1 -ml-1 transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-lg bg-obsidian-950 text-stone-surface flex items-center justify-center font-serif text-xl font-bold shadow-tinted-sm group-hover:bg-terracotta-500 transition-colors">
            Æ
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-semibold tracking-tight text-obsidian-950 leading-none">
              Aptitude Assessment
            </span>
            <span className="text-[11px] font-mono tracking-widest text-obsidian-500 uppercase mt-1">
              Candidate Evaluation Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.startsWith("/admin/dashboard")
                    ? "bg-obsidian-900 text-stone-surface shadow-tinted-sm"
                    : "text-obsidian-700 hover:text-obsidian-950 hover:bg-stone-subtle"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/candidates"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.startsWith("/admin/candidates")
                    ? "bg-obsidian-900 text-stone-surface shadow-tinted-sm"
                    : "text-obsidian-700 hover:text-obsidian-950 hover:bg-stone-subtle"
                }`}
              >
                Candidates
              </Link>
              <Link
                href="/admin/questions"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.startsWith("/admin/questions")
                    ? "bg-obsidian-900 text-stone-surface shadow-tinted-sm"
                    : "text-obsidian-700 hover:text-obsidian-950 hover:bg-stone-subtle"
                }`}
              >
                Question Bank
              </Link>
              <Link
                href="/admin/settings"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname.startsWith("/admin/settings")
                    ? "bg-obsidian-900 text-stone-surface shadow-tinted-sm"
                    : "text-obsidian-700 hover:text-obsidian-950 hover:bg-stone-subtle"
                }`}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-crimson-600 hover:bg-crimson-50 transition-colors btn-press"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {adminLoggedIn ? (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-obsidian-900 text-stone-surface hover:bg-obsidian-850 transition-all shadow-tinted-sm btn-press"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-obsidian-700 hover:text-obsidian-950 hover:bg-stone-subtle border border-stone-border transition-all btn-press"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-obsidian-500" />
                  Admin Access
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
