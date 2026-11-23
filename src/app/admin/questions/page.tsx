"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  X,
  Save
} from "lucide-react";
import axios from "axios";

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  category: string;
  difficulty: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [modalForm, setModalForm] = useState({
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    category: "Quantitative",
    difficulty: "Medium",
    isActive: true,
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get("/api/admin/questions");
      setQuestions(res.data.questions || []);
      setActiveCount(res.data.activeCount || 0);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setModalForm({
      text: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      category: "Quantitative",
      difficulty: "Medium",
      isActive: activeCount < 10,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setModalForm({
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      category: q.category,
      difficulty: q.difficulty,
      isActive: q.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSaving(true);

    try {
      if (editingQuestion) {
        await axios.put(`/api/admin/questions/${editingQuestion.id}`, modalForm);
      } else {
        await axios.post("/api/admin/questions", modalForm);
      }

      setIsModalOpen(false);
      setModalSaving(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setModalError(err.response.data?.error || "Failed to save question.");
      } else {
        setModalError("Network error. Please try again.");
      }
      setModalSaving(false);
    }
  };

  const handleToggleActive = async (q: Question) => {
    const nextActive = !q.isActive;

    // Client-side guardrail check before calling server
    if (nextActive && activeCount >= 10) {
      alert("Strict Limit Enforced: Maximum 10 active questions allowed. Deactivate another question first.");
      return;
    }

    try {
      await axios.put(`/api/admin/questions/${q.id}`, { isActive: nextActive });
      fetchQuestions();
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        alert(err.response.data?.error || "Failed to toggle status.");
      }
    }
  };

  const handleDelete = async (qId: string) => {
    if (!confirm("Are you sure you want to delete this question from the bank?")) return;

    try {
      await axios.delete(`/api/admin/questions/${qId}`);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
    if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-surface flex flex-col">
      <Header isAdmin={true} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          
          {/* Header & Limits Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-obsidian-500 mb-1">
                Content Management
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-obsidian-950">
                Corporate Question Bank
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
                  activeCount === 10
                    ? "bg-emerald-50 text-emerald-800 border-emerald-500/30"
                    : activeCount > 10
                    ? "bg-crimson-50 text-crimson-800 border-crimson-500/30"
                    : "bg-amber-50 text-amber-800 border-amber-500/30"
                }`}
              >
                <span>Active Limit: {activeCount} / 10</span>
                {activeCount === 10 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-semibold uppercase tracking-wider transition-all btn-press shadow-tinted-sm"
              >
                <Plus className="w-4 h-4 text-terracotta-400" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {activeCount < 10 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-500/30 text-amber-800 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Candidate Portal Restricted</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  The test engine requires exactly 10 active questions. Currently, only {activeCount} questions are active. Please activate or author additional questions.
                </p>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="surface-elevated rounded-xl p-4 border border-stone-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono uppercase text-obsidian-500">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-stone-surface border border-stone-border text-obsidian-900"
                >
                  <option value="all">All Categories</option>
                  <option value="Quantitative">Quantitative</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Verbal">Verbal</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono uppercase text-obsidian-500">Difficulty:</span>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-stone-surface border border-stone-border text-obsidian-900"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-mono text-obsidian-500">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, index) => (
              <div
                key={q.id}
                className={`surface-elevated rounded-2xl p-6 border transition-all ${
                  q.isActive
                    ? "border-stone-border shadow-tinted-sm"
                    : "border-stone-border/60 opacity-60 bg-stone-subtle/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-border mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-stone-subtle text-obsidian-800 font-mono text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-stone-subtle text-obsidian-700 border border-stone-border">
                      {q.category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border ${
                        q.difficulty === "Easy"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500/20"
                          : q.difficulty === "Medium"
                          ? "bg-amber-50 text-amber-700 border-amber-500/20"
                          : "bg-terracotta-50 text-terracotta-700 border-terracotta-500/20"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(q)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors btn-press ${
                        q.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-500/30"
                          : "bg-stone-subtle text-obsidian-500 border border-stone-border"
                      }`}
                    >
                      {q.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-obsidian-400" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="p-1.5 rounded-lg text-obsidian-600 hover:text-obsidian-950 hover:bg-stone-subtle transition-colors"
                      title="Edit Question"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg text-obsidian-400 hover:text-crimson-600 hover:bg-crimson-50 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-base font-medium text-obsidian-950 mb-4 leading-relaxed">
                  {q.text}
                </p>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    { key: "A", val: q.optionA },
                    { key: "B", val: q.optionB },
                    { key: "C", val: q.optionC },
                    { key: "D", val: q.optionD },
                  ].map((opt) => {
                    const isCorrect = q.correctOption.toUpperCase() === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                          isCorrect
                            ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-medium"
                            : "bg-stone-surface border-stone-border text-obsidian-700"
                        }`}
                      >
                        <span className="font-mono font-bold shrink-0">{opt.key})</span>
                        <span className="flex-1">{opt.val}</span>
                        {isCorrect && (
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold shrink-0">
                            CORRECT
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Create / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="surface-floating rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-stone-border shadow-tinted-xl max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-stone-border">
              <h2 className="font-serif text-xl font-bold text-obsidian-950">
                {editingQuestion ? "Edit Corporate Question" : "Author New Question"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-obsidian-400 hover:text-obsidian-950 hover:bg-stone-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-crimson-50 border border-crimson-500/20 text-crimson-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-crimson-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-1.5">
                  Question Text / Scenario <span className="text-terracotta-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={modalForm.text}
                  onChange={(e) => setModalForm({ ...modalForm, text: e.target.value })}
                  placeholder="Enter multi-step question text..."
                  className="w-full p-3 rounded-xl bg-stone-surface border border-stone-border text-sm focus:border-terracotta-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={modalForm.category}
                    onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-surface border border-stone-border text-sm"
                  >
                    <option value="Quantitative">Quantitative</option>
                    <option value="Logical Reasoning">Logical Reasoning</option>
                    <option value="Verbal">Verbal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={modalForm.difficulty}
                    onChange={(e) => setModalForm({ ...modalForm, difficulty: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-surface border border-stone-border text-sm"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Options A-D */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700">
                  Multiple Choice Options
                </label>
                {(["A", "B", "C", "D"] as const).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-stone-subtle text-obsidian-800 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {key}
                    </span>
                    <input
                      type="text"
                      required
                      value={modalForm[`option${key}` as keyof typeof modalForm] as string}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, [`option${key}`]: e.target.value })
                      }
                      placeholder={`Option ${key} text...`}
                      className="flex-1 p-2.5 rounded-xl bg-stone-surface border border-stone-border text-sm focus:border-terracotta-500 focus:bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs font-mono text-obsidian-600 shrink-0 cursor-pointer">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={modalForm.correctOption === key}
                        onChange={() => setModalForm({ ...modalForm, correctOption: key })}
                        className="text-terracotta-500 focus:ring-terracotta-500"
                      />
                      <span>Correct</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Active Toggle in Modal */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={modalForm.isActive}
                  onChange={(e) => setModalForm({ ...modalForm, isActive: e.target.checked })}
                  className="rounded text-terracotta-500 focus:ring-terracotta-500 w-4 h-4"
                />
                <label htmlFor="isActiveToggle" className="text-xs text-obsidian-800 font-medium">
                  Mark active for candidates (Subject to maximum 10 active questions limit)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-border text-obsidian-700 hover:bg-stone-subtle text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-6 py-2.5 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 btn-press disabled:opacity-50"
                >
                  {modalSaving ? (
                    <span className="w-4 h-4 border-2 border-stone-surface border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-terracotta-400" />
                      <span>{editingQuestion ? "Update Question" : "Save Question"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
