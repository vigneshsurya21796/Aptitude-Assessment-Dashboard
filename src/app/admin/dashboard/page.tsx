"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Award, 
  TrendingUp, 
  Layers, 
  ArrowUpRight,
  AlertTriangle,
  Download
} from "lucide-react";
import gsap from "gsap";
import axios from "axios";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface StatsData {
  kpis: {
    totalCandidates: number;
    testsCompleted: number;
    inProgressCount: number;
    averageScore: number;
    passRate: number;
    highestScore: number;
    activeQuestionsCount: number;
    totalQuestionsCount: number;
  };
  charts: {
    scoreDistribution: { range: string; count: number }[];
    outcomes: { name: string; value: number; color: string }[];
  };
}

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/admin/stats")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard metrics:", err);
        setLoading(false);
      });
  }, []);

  // GSAP Entrance
  useEffect(() => {
    if (!loading && data && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".kpi-card", {
          opacity: 0,
          y: 20,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
        });

        gsap.from(".chart-section", {
          opacity: 0,
          y: 24,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out",
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-surface flex flex-col">
        <Header isAdmin={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-obsidian-900 border-t-terracotta-500 rounded-full animate-spin" />
            <span className="text-xs font-mono text-obsidian-600">Compiling Executive Metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const isQuestionLimitMet = kpis?.activeQuestionsCount === 10;

  return (
    <div ref={containerRef} className="min-h-screen bg-stone-surface flex flex-col">
      <Header isAdmin={true} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          
          {/* Executive Page Title & Quick Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-obsidian-500 mb-1">
                Executive Control System
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-obsidian-950">
                Assessment Analytics & Operations
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/api/admin/export"
                download
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-border bg-white text-obsidian-800 hover:bg-stone-subtle text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm"
              >
                <Download className="w-3.5 h-3.5 text-obsidian-500" />
                <span>Export CSV Dossier</span>
              </a>

              <Link
                href="/admin/questions"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm"
              >
                <span>Question Bank</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-terracotta-400" />
              </Link>
            </div>
          </div>

          {/* Hard Guardrail Alert Banner if < 10 active questions */}
          {!isQuestionLimitMet && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-500/30 text-amber-800 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Assessment Offline: Exactly 10 Active Questions Required</p>
                <p className="text-xs mt-0.5 text-amber-700">
                  Current active count: <strong>{kpis?.activeQuestionsCount || 0}/10</strong>. Candidates cannot take tests until exactly 10 questions are marked active in the Question Bank.
                </p>
              </div>
            </div>
          )}

          {/* Staggered KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* Total Registered */}
            <div className="kpi-card surface-elevated rounded-2xl p-5 border border-stone-border shadow-tinted-sm">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Registered</span>
                <Users className="w-4 h-4 text-obsidian-700" />
              </div>
              <div className="font-serif text-3xl font-bold text-obsidian-950">
                {kpis?.totalCandidates ?? 0}
              </div>
              <span className="text-[11px] text-obsidian-500 mt-1 block">Total Candidates</span>
            </div>

            {/* Tests Completed */}
            <div className="kpi-card surface-elevated rounded-2xl p-5 border border-stone-border shadow-tinted-sm">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-serif text-3xl font-bold text-obsidian-950">
                {kpis?.testsCompleted ?? 0}
              </div>
              <span className="text-[11px] text-obsidian-500 mt-1 block">
                {kpis?.inProgressCount ? `${kpis.inProgressCount} in progress` : "All finalized"}
              </span>
            </div>

            {/* Average Score */}
            <div className="kpi-card surface-elevated rounded-2xl p-5 border border-stone-border shadow-tinted-sm">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Average Score</span>
                <TrendingUp className="w-4 h-4 text-terracotta-500" />
              </div>
              <div className="font-serif text-3xl font-bold text-obsidian-950">
                {kpis?.averageScore ?? 0} <span className="text-sm font-sans font-normal text-obsidian-500">/ 20</span>
              </div>
              <span className="text-[11px] text-obsidian-500 mt-1 block">Across completed tests</span>
            </div>

            {/* Pass Rate */}
            <div className="kpi-card surface-elevated rounded-2xl p-5 border border-stone-border shadow-tinted-sm">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Pass Rate</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-serif text-3xl font-bold text-emerald-700">
                {kpis?.passRate ?? 0}%
              </div>
              <span className="text-[11px] text-obsidian-500 mt-1 block">Meeting pass threshold</span>
            </div>

            {/* Highest Score */}
            <div className="kpi-card surface-elevated rounded-2xl p-5 border border-stone-border shadow-tinted-sm">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Highest Score</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-serif text-3xl font-bold text-obsidian-950">
                {kpis?.highestScore ?? 0} <span className="text-sm font-sans font-normal text-obsidian-500">/ 20</span>
              </div>
              <span className="text-[11px] text-obsidian-500 mt-1 block">Top candidate performance</span>
            </div>

          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 chart-section">
            
            {/* Score Distribution Histogram (8 cols) */}
            <div className="lg:col-span-8 surface-elevated rounded-2xl p-6 sm:p-8 border border-stone-border shadow-tinted-md">
              <div className="flex items-center justify-between pb-4 border-b border-stone-border mb-6">
                <div>
                  <h2 className="font-serif text-xl font-bold text-obsidian-950">
                    Candidate Score Distribution
                  </h2>
                  <p className="text-xs text-obsidian-500 mt-0.5">
                    Frequency histogram across Net Score brackets (-10 to 20)
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-stone-subtle border border-stone-border font-mono text-[11px] text-obsidian-600">
                  {kpis?.testsCompleted} Samples
                </div>
              </div>

              <div className="h-72 w-full">
                {data?.charts.scoreDistribution && data.charts.scoreDistribution.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E3D8" />
                      <XAxis 
                        dataKey="range" 
                        stroke="#7B8FA6" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={{ stroke: '#E7E3D8' }} 
                      />
                      <YAxis 
                        stroke="#7B8FA6" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={{ stroke: '#E7E3D8' }} 
                        allowDecimals={false} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0C1117', 
                          border: 'none', 
                          borderRadius: '8px', 
                          color: '#FAF9F6',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }} 
                      />
                      <Bar dataKey="count" fill="#D46733" radius={[6, 6, 0, 0]} name="Candidates" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-obsidian-400 text-xs font-mono">
                    <p>No completed assessments recorded yet.</p>
                    <p className="text-[11px] text-obsidian-500 mt-1">Take a test to visualize score distribution.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Outcomes Pie & System Health (4 cols) */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              
              <div className="surface-elevated rounded-2xl p-6 border border-stone-border shadow-tinted-md">
                <div className="pb-3 border-b border-stone-border mb-4">
                  <h3 className="font-serif text-base font-bold text-obsidian-950">
                    Candidate Outcome Breakdown
                  </h3>
                  <p className="text-[11px] text-obsidian-500">Pass vs Fail vs In Progress</p>
                </div>

                <div className="h-52 w-full flex items-center justify-center">
                  {data?.charts.outcomes && data.charts.outcomes.some((o) => o.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.charts.outcomes}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                        >
                          {data.charts.outcomes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0C1117', 
                            borderRadius: '8px', 
                            color: '#FAF9F6',
                            fontSize: '12px' 
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-xs text-obsidian-400 font-mono">
                      Awaiting candidate submissions
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-border text-center text-xs">
                  <div>
                    <span className="block text-[11px] text-emerald-700 font-semibold">Pass</span>
                    <span className="font-mono font-bold text-obsidian-900">
                      {data?.charts.outcomes.find((o) => o.name === "Passed")?.value || 0}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-crimson-600 font-semibold">Fail</span>
                    <span className="font-mono font-bold text-obsidian-900">
                      {data?.charts.outcomes.find((o) => o.name === "Failed")?.value || 0}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-amber-600 font-semibold">In Progress</span>
                    <span className="font-mono font-bold text-obsidian-900">
                      {data?.charts.outcomes.find((o) => o.name === "In Progress")?.value || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Question Bank Status Widget */}
              <div className="surface-elevated rounded-2xl p-6 border border-stone-border shadow-tinted-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-terracotta-500" />
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold text-obsidian-900">
                      Question Bank Guardrail
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      isQuestionLimitMet
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-500/30"
                        : "bg-amber-50 text-amber-700 border border-amber-500/30"
                    }`}
                  >
                    {kpis?.activeQuestionsCount ?? 0} / 10 Active
                  </span>
                </div>
                <p className="text-xs text-obsidian-600 leading-relaxed">
                  The test engine strictly serves exactly 10 questions per candidate. Active count must be maintained at exactly 10.
                </p>
                <Link
                  href="/admin/questions"
                  className="block text-center py-2 rounded-xl border border-stone-border bg-stone-subtle text-obsidian-800 hover:bg-stone-border text-xs font-medium transition-colors"
                >
                  Configure Questions &rarr;
                </Link>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
