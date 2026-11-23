"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  ShieldCheck, 
  ChevronDown,
  ChevronUp
} from "lucide-react";
import confetti from "canvas-confetti";
import gsap from "gsap";
import axios from "axios";
import { formatTime } from "@/lib/utils";

interface ReviewItem {
  questionNumber: number;
  id: string;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  category: string;
  difficulty: string;
  selectedOption: string | null;
  correctOption: string;
  marksAwarded: number;
  status: "CORRECT" | "INCORRECT" | "UNATTEMPTED";
}

interface ResultData {
  attemptId: string;
  candidate: {
    fullName: string;
    email: string;
    qualification: string;
    phone: string;
    city?: string;
  };
  startedAt: string;
  submittedAt: string;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  marksDeducted: number;
  timeTakenSeconds: number;
  passed: boolean;
  passPercentage: number;
  maxPossibleScore: number;
  totalQuestions: number;
  reviewItems: ReviewItem[];
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params?.attemptId as string;

  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    axios
      .get(`/api/test/result/${attemptId}`)
      .then((res) => {
        const resData = res.data;
        setData(resData);
        setLoading(false);

        // Confetti celebration if candidate passed!
        if (resData.passed) {
          try {
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#D46733", "#1B7A53", "#C78C18", "#0C1117"],
            });
          } catch (e) {
            // Ignore if canvas unsupported
          }
        }
      })
      .catch((err) => {
        const errMsg = err.response?.data?.error || err.message || "Failed to load result.";
        setError(errMsg);
        setLoading(false);
      });
  }, [attemptId]);

  // GSAP Choreographed Score Reveal
  useEffect(() => {
    if (!loading && data && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".result-kpi", {
          opacity: 0,
          scale: 0.95,
          y: 20,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        });

        gsap.from(".review-card", {
          opacity: 0,
          y: 16,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
          delay: 0.3,
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-obsidian-900 border-t-terracotta-500 rounded-full animate-spin" />
            <span className="text-xs font-mono text-obsidian-600">Calculating Performance Analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-surface flex flex-col">
        <Header />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-crimson-50 text-crimson-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-obsidian-950">Assessment Result Unavailable</h2>
          <p className="text-sm text-obsidian-600">{error || "Unable to display test results."}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 rounded-xl bg-obsidian-950 text-stone-surface text-xs font-semibold uppercase tracking-wider btn-press"
          >
            Return to Portal Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-stone-surface flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="space-y-10">
          
          {/* Top Banner & Outcome Badge */}
          <div className="surface-elevated rounded-2xl p-6 sm:p-10 border border-stone-border shadow-tinted-md result-kpi">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-border">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-subtle text-obsidian-700 text-xs font-mono mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Assessment Dossier
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-obsidian-950">
                  Performance Evaluation Report
                </h1>
                <p className="text-sm text-obsidian-600">
                  Candidate: <strong className="text-obsidian-900">{data.candidate.fullName}</strong> • {data.candidate.email}
                </p>
              </div>

              {/* Status Outcome Stamp */}
              <div
                className={`px-6 py-3.5 rounded-2xl border text-center shrink-0 flex items-center gap-3 ${
                  data.passed
                    ? "bg-emerald-50 border-emerald-500/30 text-emerald-800 shadow-emerald-glow"
                    : "bg-crimson-50 border-crimson-500/30 text-crimson-800"
                }`}
              >
                {data.passed ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-crimson-600" />
                )}
                <div className="text-left">
                  <span className="block text-[11px] font-mono tracking-widest uppercase">Outcome</span>
                  <span className="font-serif text-2xl font-bold tracking-tight">
                    {data.passed ? "QUALIFIED / PASS" : "NOT QUALIFIED / FAIL"}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border">
                <span className="block text-xs font-mono uppercase text-obsidian-500">Net Score</span>
                <div className="font-serif text-3xl font-bold text-obsidian-950 mt-1">
                  {data.score} <span className="text-sm font-sans font-normal text-obsidian-500">/ 20</span>
                </div>
                <span className="text-[11px] text-obsidian-500 mt-1 block">(Correct × 2) - (Wrong × 1)</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border">
                <span className="block text-xs font-mono uppercase text-obsidian-500">Percentage</span>
                <div className="font-serif text-3xl font-bold text-terracotta-600 mt-1">
                  {data.percentage}%
                </div>
                <span className="text-[11px] text-obsidian-500 mt-1 block">Pass threshold: {data.passPercentage}%</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border">
                <span className="block text-xs font-mono uppercase text-obsidian-500">Accuracy Matrix</span>
                <div className="flex items-center gap-2 mt-1 font-mono text-sm">
                  <span className="text-emerald-700 font-bold">{data.correctCount}C</span>
                  <span className="text-obsidian-300">/</span>
                  <span className="text-crimson-600 font-bold">{data.incorrectCount}W</span>
                  <span className="text-obsidian-300">/</span>
                  <span className="text-obsidian-600 font-bold">{data.unattemptedCount}U</span>
                </div>
                <span className="text-[11px] text-crimson-600 mt-1 block">-{data.marksDeducted} marks deducted</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border">
                <span className="block text-xs font-mono uppercase text-obsidian-500">Completion Time</span>
                <div className="font-serif text-3xl font-bold text-obsidian-950 mt-1 font-mono">
                  {formatTime(data.timeTakenSeconds)}
                </div>
                <span className="text-[11px] text-obsidian-500 mt-1 block">Out of 15:00 maximum</span>
              </div>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-obsidian-950">
                  Question-by-Question Audit
                </h2>
                <p className="text-xs text-obsidian-600 mt-1">
                  Comprehensive review of your responses alongside validated corporate answers and mark allocations.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> +2 Correct
                </span>
                <span className="flex items-center gap-1.5 text-crimson-600 font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> -1 Wrong
                </span>
                <span className="flex items-center gap-1.5 text-obsidian-500 font-semibold">
                  <MinusCircle className="w-3.5 h-3.5" /> 0 Blank
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {data.reviewItems.map((item, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div
                    key={item.id}
                    className="review-card surface-elevated rounded-xl border border-stone-border overflow-hidden transition-all shadow-tinted-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-subtle/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        <span
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                            item.status === "CORRECT"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "INCORRECT"
                              ? "bg-crimson-100 text-crimson-800"
                              : "bg-stone-subtle text-obsidian-600"
                          }`}
                        >
                          Q{item.questionNumber}
                        </span>

                        <div className="flex-1">
                          <p className="text-sm font-medium text-obsidian-900 line-clamp-2">
                            {item.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-mono text-obsidian-500 px-2 py-0.5 rounded bg-stone-subtle border border-stone-border">
                              {item.category}
                            </span>
                            <span className="text-[11px] font-mono text-obsidian-500">
                              Your answer: <strong className={item.selectedOption ? (item.status === "CORRECT" ? "text-emerald-700" : "text-crimson-600") : "text-obsidian-400"}>
                                {item.selectedOption || "Unattempted"}
                              </strong>
                            </span>
                            <span className="text-[11px] font-mono text-obsidian-500">
                              Correct: <strong className="text-emerald-700">{item.correctOption}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                            item.marksAwarded > 0
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-500/20"
                              : item.marksAwarded < 0
                              ? "bg-crimson-50 text-crimson-800 border border-crimson-500/20"
                              : "bg-stone-subtle text-obsidian-600 border border-stone-border"
                          }`}
                        >
                          {item.marksAwarded > 0 ? `+${item.marksAwarded}` : item.marksAwarded} Marks
                        </span>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-obsidian-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-obsidian-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Detail View */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-stone-border bg-stone-surface/40 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {Object.entries(item.options).map(([optKey, optText]) => {
                            const isSelected = item.selectedOption === optKey;
                            const isCorrect = item.correctOption === optKey;

                            let optStyle = "bg-white border-stone-border text-obsidian-700";
                            if (isCorrect) {
                              optStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-medium";
                            } else if (isSelected && !isCorrect) {
                              optStyle = "bg-crimson-50 border-crimson-500 text-crimson-900 font-medium";
                            }

                            return (
                              <div
                                key={optKey}
                                className={`p-3 rounded-lg border flex items-start gap-2.5 ${optStyle}`}
                              >
                                <span className="font-mono font-bold shrink-0">{optKey})</span>
                                <span className="flex-1">{optText}</span>
                                {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                                {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-crimson-600 shrink-0 mt-0.5" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-stone-border flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl border border-stone-border bg-white text-obsidian-800 hover:bg-stone-subtle text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm"
            >
              Exit to Assessment Portal
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm"
            >
              Print / Save Assessment Report
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
