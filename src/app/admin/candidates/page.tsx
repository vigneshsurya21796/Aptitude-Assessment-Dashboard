"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  CheckCircle, 
  XCircle, 
  X
} from "lucide-react";
import axios from "axios";
import { formatTime, formatHumanDate, formatHumanDateTime } from "@/lib/utils";

interface CandidateItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  qualification: string;
  city: string | null;
  registeredAt: string;
  attempt: {
    id: string;
    status: string;
    score: number;
    percentage: number;
    passed: boolean;
    timeTakenSeconds: number;
    submittedAt: string | null;
  } | null;
}

interface QuestionBreakdown {
  questionNumber: number;
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedOption: string | null;
  correctOption: string;
  category: string;
  difficulty: string;
  marksAwarded: number;
  status: "CORRECT" | "INCORRECT" | "UNATTEMPTED";
}

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Detail Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [detailBreakdown, setDetailBreakdown] = useState<QuestionBreakdown[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/candidates", {
        params: {
          page,
          search,
          status,
          sortBy,
          sortOrder,
        },
      });

      const data = res.data;
      setCandidates(data.candidates || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, status, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  const openCandidateDetail = async (candidateId: string) => {
    setDetailLoading(true);
    setSelectedCandidate(null);
    setDetailBreakdown([]);

    try {
      const res = await axios.get(`/api/admin/candidates/${candidateId}`);
      const data = res.data;
      setSelectedCandidate(data);
      setDetailBreakdown(data.breakdown || []);
      setDetailLoading(false);
    } catch (err) {
      console.error(err);
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-surface flex flex-col">
      <Header isAdmin={true} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-6">
          
          {/* Header & Export Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-obsidian-500 mb-1">
                Candidate Submissions
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-obsidian-950">
                Candidate Results
              </h1>
            </div>

            <a
              href={`/api/admin/export?status=${status}&search=${encodeURIComponent(search)}`}
              download
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm w-fit"
            >
              <Download className="w-3.5 h-3.5 text-terracotta-400" />
              <span>Export to CSV</span>
            </a>
          </div>

          {/* Search & Filter Bar */}
          <div className="surface-elevated rounded-2xl p-4 sm:p-5 border border-stone-border shadow-tinted-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:max-w-md relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name, email, or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-surface border border-stone-border text-sm focus:border-terracotta-500 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-3" />
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono uppercase text-obsidian-500">Status:</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-stone-surface border border-stone-border text-obsidian-900"
                >
                  <option value="all">All Outcomes</option>
                  <option value="pass">Qualified (Pass)</option>
                  <option value="fail">Not Qualified (Fail)</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono uppercase text-obsidian-500">Sort By:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order as "asc" | "desc");
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-stone-surface border border-stone-border text-obsidian-900"
                >
                  <option value="date-desc">Newest Attempt First</option>
                  <option value="date-asc">Oldest Attempt First</option>
                  <option value="score-desc">Highest Score First</option>
                  <option value="score-asc">Lowest Score First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paginated Candidate Table */}
          <div className="surface-elevated rounded-2xl border border-stone-border shadow-tinted-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-subtle/80 border-b border-stone-border font-mono uppercase tracking-wider text-obsidian-500">
                    <th className="py-4 px-5">Candidate</th>
                    <th className="py-4 px-4">Contact</th>
                    <th className="py-4 px-3">Age / Qual</th>
                    <th className="py-4 px-4">Net Score</th>
                    <th className="py-4 px-4">Percentage</th>
                    <th className="py-4 px-4">Outcome</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-border">
                  {candidates.length > 0 ? (
                    candidates.map((c) => {
                      const att = c.attempt;
                      const hasCompleted = att && att.status === "COMPLETED";
                      const isInProgress = att && att.status === "IN_PROGRESS";

                      return (
                        <tr key={c.id} className="hover:bg-stone-subtle/40 transition-colors">
                          <td className="py-3.5 px-5">
                            <span className="font-medium text-obsidian-950 block text-sm">
                              {c.fullName}
                            </span>
                            <span className="text-[11px] font-mono text-obsidian-500">{c.email}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-obsidian-700">
                            {c.phone}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="block text-obsidian-900 font-mono">{c.age} yrs</span>
                            <span className="text-[11px] text-obsidian-500">{c.qualification}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-sm">
                            {hasCompleted ? (
                              <span className={att.score >= 12 ? "text-emerald-700" : "text-obsidian-800"}>
                                {att.score} <span className="text-xs text-obsidian-400 font-normal">/ 20</span>
                              </span>
                            ) : (
                              <span className="text-obsidian-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold">
                            {hasCompleted ? (
                              <span>{att.percentage}%</span>
                            ) : (
                              <span className="text-obsidian-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {hasCompleted ? (
                              att.passed ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-500/20">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> PASS
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-crimson-50 text-crimson-800 font-mono font-bold text-[11px] border border-crimson-500/20">
                                  <XCircle className="w-3 h-3 text-crimson-600" /> FAIL
                                </span>
                              )
                            ) : isInProgress ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-mono text-[11px] border border-amber-500/20">
                                IN PROGRESS
                              </span>
                            ) : (
                              <span className="text-obsidian-400">UNSTARTED</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-obsidian-600">
                            {formatHumanDate(c.registeredAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openCandidateDetail(c.id)}
                              className="px-3 py-1.5 rounded-lg border border-stone-border bg-white text-obsidian-800 hover:bg-stone-subtle transition-all btn-press font-mono text-[11px] inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-obsidian-500" />
                              <span>Audit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-obsidian-500 font-mono text-xs">
                        No candidates matching current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-stone-border flex items-center justify-between text-xs">
              <span className="text-obsidian-500 font-mono">
                Showing Page {page} of {totalPages} ({total} Total Records)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-stone-border bg-white text-obsidian-800 hover:bg-stone-subtle disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-lg border border-stone-border bg-white text-obsidian-800 hover:bg-stone-subtle disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Candidate Question-by-Question Detail Modal */}
      {(selectedCandidate || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="surface-floating rounded-2xl max-w-3xl w-full p-6 sm:p-8 border border-stone-border shadow-tinted-xl max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-start justify-between pb-4 border-b border-stone-border">
              <div>
                <span className="text-xs font-mono uppercase text-obsidian-500 tracking-wider">Candidate Test Details</span>
                <h2 className="font-serif text-2xl font-bold text-obsidian-950">
                  {selectedCandidate?.candidate?.fullName || "Candidate Test Details"}
                </h2>
                <p className="text-xs text-obsidian-600 mt-0.5">
                  {selectedCandidate?.candidate?.email} • {selectedCandidate?.candidate?.phone}
                  {selectedCandidate?.attempt?.submittedAt && (
                    <span className="block sm:inline sm:before:content-['•'] sm:before:mx-1.5 text-obsidian-500 font-mono text-[11px]">
                      Submitted: {formatHumanDateTime(selectedCandidate.attempt.submittedAt)}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-lg text-obsidian-400 hover:text-obsidian-950 hover:bg-stone-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedCandidate?.attempt ? (
              <div className="space-y-6">
                {/* Summary Score Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-stone-subtle border border-stone-border text-center">
                  <div>
                    <span className="block text-[11px] font-mono text-obsidian-500 uppercase">Net Score</span>
                    <span className="font-serif text-2xl font-bold text-obsidian-950">
                      {selectedCandidate.attempt.score} <span className="text-xs text-obsidian-400">/ 20</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono text-obsidian-500 uppercase">Percentage</span>
                    <span className="font-serif text-2xl font-bold text-terracotta-600">
                      {selectedCandidate.attempt.percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono text-obsidian-500 uppercase">Outcome</span>
                    <span className={`font-serif text-lg font-bold ${selectedCandidate.attempt.passed ? "text-emerald-700" : "text-crimson-600"}`}>
                      {selectedCandidate.attempt.passed ? "QUALIFIED" : "DISQUALIFIED"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono text-obsidian-500 uppercase">Time Spent</span>
                    <span className="font-mono text-lg font-semibold text-obsidian-900">
                      {formatTime(selectedCandidate.attempt.timeTakenSeconds)}
                    </span>
                  </div>
                </div>

                {/* Question Breakdown List */}
                <div className="space-y-3">
                  <h3 className="font-serif text-base font-bold text-obsidian-950">
                    Question Response Analysis
                  </h3>

                  {detailBreakdown.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-stone-border bg-white space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                              item.status === "CORRECT"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "INCORRECT"
                                ? "bg-crimson-100 text-crimson-800"
                                : "bg-stone-subtle text-obsidian-500"
                            }`}
                          >
                            Q{item.questionNumber}
                          </span>
                          <p className="font-medium text-obsidian-900 leading-snug">
                            {item.text}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold shrink-0 ${
                            item.marksAwarded > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-500/20"
                              : item.marksAwarded < 0
                              ? "bg-crimson-50 text-crimson-700 border border-crimson-500/20"
                              : "bg-stone-subtle text-obsidian-600"
                          }`}
                        >
                          {item.marksAwarded > 0 ? `+${item.marksAwarded}` : item.marksAwarded} Marks
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pl-8 font-mono text-[11px]">
                        <div>
                          Candidate Choice:{" "}
                          <strong className={item.selectedOption ? (item.status === "CORRECT" ? "text-emerald-700" : "text-crimson-600") : "text-obsidian-400"}>
                            {item.selectedOption ? `Option ${item.selectedOption}` : "None (Unattempted)"}
                          </strong>
                        </div>
                        <div>
                          Correct Answer: <strong className="text-emerald-700">Option {item.correctOption}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-obsidian-500 font-mono text-xs">
                This candidate has not started an assessment yet.
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
