"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  RotateCcw, 
  Send,
  FileCheck,
  AlertCircle
} from "lucide-react";
import gsap from "gsap";
import axios from "axios";

interface QuestionData {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  category: string;
  difficulty: string;
}

interface QuestionAnswer {
  selectedOption: string | null;
  markedForReview: boolean;
}

function TestEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidateName, setCandidateName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const questionCardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Test Questions & Status via Axios
  useEffect(() => {
    if (!attemptId) {
      router.push("/");
      return;
    }

    axios
      .get("/api/test/questions", {
        params: { attemptId },
      })
      .then((res) => {
        const data = res.data;
        if (data.isCompleted) {
          router.push(`/result/${attemptId}`);
          return;
        }

        if (data.expired) {
          handleFinalSubmit(true);
          return;
        }

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setDurationMinutes(data.durationMinutes);
          setRemainingSeconds(data.remainingSeconds);
          setCandidateName(data.candidate?.fullName || "Candidate");

          // Restore answers from DB or local sessionStorage
          const localCache = sessionStorage.getItem(`test_attempt_${attemptId}`);
          if (localCache) {
            try {
              const parsedLocal = JSON.parse(localCache);
              setAnswers({ ...data.answers, ...parsedLocal });
            } catch {
              setAnswers(data.answers || {});
            }
          } else {
            setAnswers(data.answers || {});
          }

          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load test:", err);
      });
  }, [attemptId, router]);

  // Master Countdown Timer
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds]);

  // Animate question transition with GSAP
  useEffect(() => {
    if (!loading && questionCardRef.current) {
      gsap.fromTo(
        questionCardRef.current,
        { opacity: 0, x: 12 },
        { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [currentIndex, loading]);

  // Save answer to backend via Axios and local storage
  const persistAnswer = useCallback(
    async (qId: string, updated: QuestionAnswer) => {
      // Save locally immediately
      const newAnswers = { ...answers, [qId]: updated };
      setAnswers(newAnswers);
      sessionStorage.setItem(`test_attempt_${attemptId}`, JSON.stringify(newAnswers));

      // Sync to backend via Axios
      try {
        await axios.post("/api/test/save-answer", {
          attemptId,
          questionId: qId,
          selectedOption: updated.selectedOption,
          markedForReview: updated.markedForReview,
        });
      } catch (err) {
        console.error("Auto-save sync error:", err);
      }
    },
    [answers, attemptId]
  );

  const handleSelectOption = (optionKey: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentAns = answers[currentQ.id] || { selectedOption: null, markedForReview: false };
    persistAnswer(currentQ.id, {
      ...currentAns,
      selectedOption: optionKey,
    });
  };

  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentAns = answers[currentQ.id] || { selectedOption: null, markedForReview: false };
    persistAnswer(currentQ.id, {
      ...currentAns,
      selectedOption: null,
    });
  };

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const currentAns = answers[currentQ.id] || { selectedOption: null, markedForReview: false };
    persistAnswer(currentQ.id, {
      ...currentAns,
      markedForReview: !currentAns.markedForReview,
    });
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (isAuto) setAutoSubmitted(true);

    try {
      await axios.post("/api/test/submit", {
        attemptId,
        answers,
      });

      sessionStorage.removeItem(`test_attempt_${attemptId}`);
      router.push(`/result/${attemptId}`);
    } catch (err) {
      console.error("Submit error:", err);
      router.push(`/result/${attemptId}`);
    }
  };

  // Compute question palette counts
  const answeredCount = questions.filter(
    (q) => answers[q.id]?.selectedOption !== null && answers[q.id]?.selectedOption !== undefined
  ).length;
  const markedCount = questions.filter((q) => answers[q.id]?.markedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-obsidian-900 border-t-terracotta-500 rounded-full animate-spin" />
            <span className="text-xs font-mono text-obsidian-600">Configuring Shuffled Candidate Assessment...</span>
          </div>
        </div>
      </div>
    );
  }

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 120;

  return (
    <div className="min-h-screen bg-stone-surface flex flex-col">
      {/* Top Test Header Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-stone-border bg-stone-surface/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-obsidian-950 text-stone-surface flex items-center justify-center font-serif text-lg font-bold">
              Æ
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-obsidian-950 leading-none">
                Aptitude Assessment
              </div>
              <div className="text-[11px] font-mono text-obsidian-500 mt-1">
                Candidate: {candidateName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Synchronized Monospace Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm border transition-colors ${
                isLowTime
                  ? "bg-crimson-50 text-crimson-600 border-crimson-500/30 animate-pulse font-bold"
                  : "bg-obsidian-950 text-stone-surface border-obsidian-900"
              }`}
            >
              <Clock className={`w-4 h-4 ${isLowTime ? "text-crimson-500" : "text-terracotta-400"}`} />
              <span className="tracking-widest">
                {remainingSeconds !== null ? formatTimer(remainingSeconds) : "--:--"}
              </span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Assessment Layout: Left Question View + Right Palette */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Question Display Area (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <div 
              ref={questionCardRef}
              className="surface-elevated rounded-2xl p-6 sm:p-8 border border-stone-border shadow-tinted-md relative"
            >
              {/* Question Header Meta */}
              <div className="flex items-center justify-between border-b border-stone-border pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="font-serif text-lg font-bold text-obsidian-950">
                    Question {currentIndex + 1}
                  </span>
                  <span className="text-xs font-mono text-obsidian-400">of 10</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-stone-subtle text-obsidian-700 border border-stone-border">
                    {currentQ.category}
                  </span>
                  <span 
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
                      currentQ.difficulty === "Easy"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500/20"
                        : currentQ.difficulty === "Medium"
                        ? "bg-amber-50 text-amber-700 border-amber-500/20"
                        : "bg-terracotta-50 text-terracotta-700 border-terracotta-500/20"
                    }`}
                  >
                    {currentQ.difficulty}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <p className="text-base sm:text-lg text-obsidian-900 leading-relaxed font-normal">
                  {currentQ.text}
                </p>
              </div>

              {/* Options Radio List */}
              <div className="space-y-3">
                {[
                  { key: "A", label: currentQ.optionA },
                  { key: "B", label: currentQ.optionB },
                  { key: "C", label: currentQ.optionC },
                  { key: "D", label: currentQ.optionD },
                ].map((opt) => {
                  const isSelected = currentAnswer?.selectedOption === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3.5 btn-press ${
                        isSelected
                          ? "bg-terracotta-50 border-terracotta-500 ring-1 ring-terracotta-500 shadow-tinted-sm"
                          : "bg-white border-stone-border hover:border-obsidian-400 hover:bg-stone-subtle/40"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 transition-colors ${
                          isSelected
                            ? "bg-terracotta-500 text-white"
                            : "bg-stone-subtle text-obsidian-700 border border-stone-border"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className={`flex-1 pt-0.5 leading-snug ${isSelected ? "font-medium text-obsidian-950" : "text-obsidian-800"}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* In-Card Quick Actions */}
              <div className="mt-8 pt-6 border-t border-stone-border flex items-center justify-between flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleToggleReview}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors btn-press ${
                    currentAnswer?.markedForReview
                      ? "bg-amber-100 border-amber-500 text-amber-800"
                      : "bg-white border-stone-border text-obsidian-700 hover:bg-stone-subtle"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${currentAnswer?.markedForReview ? "fill-amber-600 text-amber-600" : ""}`} />
                  <span>{currentAnswer?.markedForReview ? "Marked for Review" : "Mark for Review"}</span>
                </button>

                {currentAnswer?.selectedOption && (
                  <button
                    type="button"
                    onClick={handleClearResponse}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-obsidian-500 hover:text-crimson-600 hover:bg-crimson-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Response</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Question Navigation Controls */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-stone-border bg-white text-obsidian-800 hover:bg-stone-subtle disabled:opacity-30 disabled:pointer-events-none text-xs font-medium transition-all btn-press shadow-tinted-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Question</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-medium transition-all btn-press shadow-tinted-sm"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-terracotta-500 text-white hover:bg-terracotta-600 text-xs font-medium transition-all btn-press shadow-tinted-sm"
                >
                  <span>Review & Submit</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Palette Area (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <div className="surface-elevated rounded-2xl p-6 border border-stone-border shadow-tinted-md">
              <div className="flex items-center justify-between pb-4 border-b border-stone-border mb-5">
                <h2 className="font-serif text-base font-semibold text-obsidian-950">
                  Question Palette
                </h2>
                <span className="text-xs font-mono text-obsidian-500">10 Questions</span>
              </div>

              {/* 10-Question Palette Grid */}
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const isCurrent = idx === currentIndex;
                  const isAnswered = ans?.selectedOption !== null && ans?.selectedOption !== undefined;
                  const isMarked = ans?.markedForReview;

                  let styleClass = "bg-stone-surface border-stone-border text-obsidian-700 hover:border-obsidian-400";

                  if (isAnswered && isMarked) {
                    styleClass = "bg-amber-500 text-white border-amber-600";
                  } else if (isAnswered) {
                    styleClass = "bg-emerald-600 text-white border-emerald-700";
                  } else if (isMarked) {
                    styleClass = "bg-amber-100 text-amber-900 border-amber-400";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-11 rounded-xl text-xs font-mono font-semibold border flex flex-col items-center justify-center relative transition-all btn-press ${styleClass} ${
                        isCurrent ? "ring-2 ring-terracotta-500 ring-offset-2 scale-105" : ""
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isMarked && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Palette Legend */}
              <div className="mt-6 pt-5 border-t border-stone-border space-y-2.5 text-xs text-obsidian-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600" />
                    <span>Answered</span>
                  </div>
                  <span className="font-mono font-semibold text-obsidian-900">{answeredCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-stone-border" />
                    <span>Unanswered</span>
                  </div>
                  <span className="font-mono font-semibold text-obsidian-900">{unansweredCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span>Marked for Review</span>
                  </div>
                  <span className="font-mono font-semibold text-obsidian-900">{markedCount}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-border">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="w-full py-3 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm"
                >
                  Finalize Assessment
                </button>
              </div>
            </div>

            {/* Marking Matrix */}
            <div className="surface-elevated rounded-xl p-4 border border-stone-border text-xs text-obsidian-600 space-y-1.5">
              <div className="font-medium text-obsidian-900 font-mono uppercase tracking-wider text-[11px]">
                Marking Matrix
              </div>
              <div className="flex items-center justify-between">
                <span>Correct: <strong className="text-emerald-700">+2</strong></span>
                <span>Wrong: <strong className="text-crimson-600">-1</strong></span>
                <span>Blank: <strong>0</strong></span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Floating-Tier Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="surface-floating rounded-2xl max-w-md w-full p-6 sm:p-8 border border-stone-border shadow-tinted-xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-obsidian-950">
                  Confirm Submission
                </h3>
                <p className="text-xs text-obsidian-600 mt-1">
                  Once finalized, your assessment will be graded server-side and locked.
                </p>
              </div>
            </div>

            {/* Question Breakdown Counts */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-stone-subtle border border-stone-border text-center">
              <div>
                <span className="block text-[11px] font-mono text-obsidian-500 uppercase">Answered</span>
                <span className="font-serif text-xl font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div>
                <span className="block text-[11px] font-mono text-obsidian-500 uppercase">Unanswered</span>
                <span className="font-serif text-xl font-bold text-obsidian-700">{unansweredCount}</span>
              </div>
              <div>
                <span className="block text-[11px] font-mono text-obsidian-500 uppercase">Review</span>
                <span className="font-serif text-xl font-bold text-amber-700">{markedCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-500/20 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>You still have {unansweredCount} unattempted questions.</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-border bg-white text-obsidian-800 hover:bg-stone-subtle text-xs font-semibold uppercase tracking-wider transition-all btn-press"
              >
                Resume Test
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Submit Final</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-surface flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-obsidian-900 border-t-terracotta-500 rounded-full animate-spin" />
        </div>
      }
    >
      <TestEngine />
    </Suspense>
  );
}
