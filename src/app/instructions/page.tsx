"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Award, 
  ArrowRight,
  ShieldAlert,
  FileText
} from "lucide-react";
import gsap from "gsap";
import axios from "axios";

export default function InstructionsPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [candidate, setCandidate] = useState<{ candidateId: string; fullName: string; email: string } | null>(null);
  const [config, setConfig] = useState<{
    testDurationMinutes: number;
    passPercentage: number;
    totalQuestions: number;
    canStart: boolean;
    warning: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    // Check candidate session
    const sessionStr = sessionStorage.getItem("candidate_session");
    if (!sessionStr) {
      router.push("/");
      return;
    }
    const sessionData = JSON.parse(sessionStr);
    setCandidate(sessionData);

    // Fetch dynamic instructions using Axios
    axios
      .get("/api/test/instructions")
      .then((res) => {
        setConfig(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load instructions:", err);
        setLoading(false);
      });
  }, [router]);

  // GSAP animation
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".anim-item", {
          opacity: 0,
          y: 20,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading]);

  const handleStartTest = async () => {
    if (!candidate || !config?.canStart) return;
    setStarting(true);
    setStartError(null);

    try {
      const res = await axios.post("/api/test/start", {
        candidateId: candidate.candidateId,
      });

      const data = res.data;
      router.push(`/test?attemptId=${data.attemptId}`);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data;
        if (errorData.attemptId) {
          router.push(`/result/${errorData.attemptId}`);
          return;
        }
        setStartError(errorData.error || "Unable to start assessment.");
      } else {
        setStartError("Network error. Please try again.");
      }
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-obsidian-900 border-t-terracotta-500 rounded-full animate-spin" />
            <span className="text-xs font-mono text-obsidian-600">Retrieving Assessment Parameters...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-stone-surface flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="space-y-8">
          
          {/* Header Briefing */}
          <div className="space-y-3 anim-item">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-subtle border border-stone-border text-obsidian-700 text-xs font-mono">
              <FileText className="w-3.5 h-3.5 text-terracotta-500" />
              Assessment Rules & Guidelines
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-obsidian-950">
              Assessment Instructions
            </h1>
            <p className="text-obsidian-600 text-base">
              Candidate: <span className="font-medium text-obsidian-900">{candidate?.fullName}</span> ({candidate?.email})
            </p>
          </div>

          {/* Admin Warning Banner if < 10 questions */}
          {!config?.canStart && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-500/30 text-amber-800 text-sm flex items-start gap-3 anim-item">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Assessment Temporarily Unavailable</p>
                <p className="text-xs mt-1 text-amber-700">
                  {config?.warning || "The question bank currently has fewer than 10 active questions. Please inform an administrator."}
                </p>
              </div>
            </div>
          )}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 anim-item">
            <div className="surface-elevated rounded-xl p-5 border border-stone-border">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Test Duration</span>
                <Clock className="w-4 h-4 text-terracotta-500" />
              </div>
              <div className="font-serif text-2xl font-bold text-obsidian-950">
                {config?.testDurationMinutes ?? 15} <span className="text-sm font-sans font-normal text-obsidian-600">Minutes</span>
              </div>
              <p className="text-xs text-obsidian-500 mt-1">Auto-submits when time runs out</p>
            </div>

            <div className="surface-elevated rounded-xl p-5 border border-stone-border">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Total Questions</span>
                <HelpCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-serif text-2xl font-bold text-obsidian-950">
                10 <span className="text-sm font-sans font-normal text-obsidian-600">Multiple Choice</span>
              </div>
              <p className="text-xs text-obsidian-500 mt-1">Quantitative, Logical & Verbal</p>
            </div>

            <div className="surface-elevated rounded-xl p-5 border border-stone-border">
              <div className="flex items-center justify-between text-obsidian-500 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Pass Benchmark</span>
                <Award className="w-4 h-4 text-terracotta-600" />
              </div>
              <div className="font-serif text-2xl font-bold text-obsidian-950">
                {config?.passPercentage ?? 60}% <span className="text-sm font-sans font-normal text-obsidian-600">Minimum</span>
              </div>
              <p className="text-xs text-obsidian-500 mt-1">Requires 12+ marks out of 20</p>
            </div>
          </div>

          {/* Marking Scheme Detailed Callout */}
          <div className="surface-elevated rounded-2xl p-6 sm:p-8 border border-stone-border space-y-6 anim-item">
            <h2 className="font-serif text-xl font-semibold text-obsidian-950">
              Marking Scheme & Negative Penalty
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-500/20">
                <div className="font-mono text-emerald-700 text-sm font-semibold">Correct Answer</div>
                <div className="font-serif text-2xl font-bold text-emerald-800 mt-1">+2 Marks</div>
                <p className="text-xs text-emerald-700 mt-1">Awarded for each verified correct selection.</p>
              </div>

              <div className="p-4 rounded-xl bg-crimson-50 border border-crimson-500/20">
                <div className="font-mono text-crimson-700 text-sm font-semibold">Incorrect Answer</div>
                <div className="font-serif text-2xl font-bold text-crimson-800 mt-1">-1 Mark</div>
                <p className="text-xs text-crimson-700 mt-1">Subtracted for incorrect answers. Guessing carries negative yield.</p>
              </div>

              <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border">
                <div className="font-mono text-obsidian-700 text-sm font-semibold">Unattempted</div>
                <div className="font-serif text-2xl font-bold text-obsidian-900 mt-1">0 Marks</div>
                <p className="text-xs text-obsidian-600 mt-1">Zero impact. Questions left blank receive no marks or penalties.</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-obsidian-700 pt-2 border-t border-stone-border">
              <h3 className="font-medium text-obsidian-950 text-xs font-mono uppercase tracking-wider">
                Procedural Rules:
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm list-disc pl-5 text-obsidian-600 leading-relaxed">
                <li>
                  <strong className="text-obsidian-900">Navigation & Review:</strong> You may navigate freely between questions 1 through 10, mark questions for review, or clear your response at any point.
                </li>
                <li>
                  <strong className="text-obsidian-900">Session Resilience:</strong> In case of an accidental browser refresh or disconnection, your selected responses and elapsed clock will be restored automatically.
                </li>
                <li>
                  <strong className="text-obsidian-900">Automatic Submission:</strong> When the countdown timer reaches 00:00, your test will be finalized and submitted immediately.
                </li>
              </ul>
            </div>
          </div>

          {startError && (
            <div className="p-4 rounded-xl bg-crimson-50 border border-crimson-500/20 text-crimson-700 text-sm flex items-center gap-2 anim-item">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{startError}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 anim-item">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-stone-border text-obsidian-700 hover:text-obsidian-950 hover:bg-stone-subtle text-sm font-medium transition-all btn-press"
            >
              &larr; Return to Registration
            </button>

            <button
              type="button"
              onClick={handleStartTest}
              disabled={!config?.canStart || starting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 active:bg-obsidian-900 text-sm font-medium flex items-center justify-center gap-2 shadow-tinted-lg transition-all btn-press disabled:opacity-40"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-stone-surface border-t-transparent rounded-full animate-spin" />
                  Initializing Assessment...
                </span>
              ) : (
                <>
                  <span>Begin Assessment Now</span>
                  <ArrowRight className="w-4 h-4 text-terracotta-400" />
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
