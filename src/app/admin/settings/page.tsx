"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Save, CheckCircle2, AlertTriangle, Layers, Clock, Award } from "lucide-react";
import axios from "axios";

export default function AdminSettingsPage() {
  const [testDurationMinutes, setTestDurationMinutes] = useState(15);
  const [passPercentage, setPassPercentage] = useState(60.0);
  const [activeQuestionsCount, setActiveQuestionsCount] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/admin/settings")
      .then((res) => {
        const data = res.data;
        if (data.settings) {
          setTestDurationMinutes(data.settings.testDurationMinutes);
          setPassPercentage(data.settings.passPercentage);
        }
        setActiveQuestionsCount(data.activeQuestionsCount || 0);
        setTotalQuestionsCount(data.totalQuestionsCount || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      await axios.put("/api/admin/settings", {
        testDurationMinutes,
        passPercentage,
      });

      setSavedSuccess(true);
      setSaving(false);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || "Failed to update parameters.");
      } else {
        setError("Network error. Please try again.");
      }
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-surface flex flex-col">
      <Header isAdmin={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-obsidian-500 mb-1">
              System Settings
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-obsidian-950">
              Test Settings & Rules
            </h1>
          </div>

          {/* System Health Status */}
          <div className="surface-elevated rounded-2xl p-6 border border-stone-border shadow-tinted-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-obsidian-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-terracotta-500" />
              <span>Question Bank Status</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border">
                <span className="block text-xs font-mono uppercase text-obsidian-500">Active Question Bank</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-serif text-2xl font-bold text-obsidian-950">
                    {activeQuestionsCount} / 10
                  </span>
                  {activeQuestionsCount === 10 ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                      OPTIMAL
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-100 text-amber-800 font-bold">
                      INCOMPLETE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-obsidian-500 mt-1">
                  Exact 10 active questions required for candidate sessions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-subtle border border-stone-border">
                <span className="block text-xs font-mono uppercase text-obsidian-500">Total Questions In DB</span>
                <div className="font-serif text-2xl font-bold text-obsidian-950 mt-1">
                  {totalQuestionsCount}
                </div>
                <p className="text-[11px] text-obsidian-500 mt-1">
                  Includes active and inactive archival questions.
                </p>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <div className="surface-elevated rounded-2xl p-6 sm:p-8 border border-stone-border shadow-tinted-md">
            <div className="pb-4 border-b border-stone-border mb-6">
              <h2 className="font-serif text-xl font-bold text-obsidian-950">
                Test Parameters Form
              </h2>
              <p className="text-xs text-obsidian-600 mt-0.5">
                Changes take effect immediately for newly initiated assessment attempts.
              </p>
            </div>

            {savedSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Assessment parameters updated and persisted to database.</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-crimson-50 border border-crimson-500/20 text-crimson-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-crimson-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                  Test Duration (Minutes: 5 to 120)
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    required
                    value={testDurationMinutes}
                    onChange={(e) => setTestDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-surface border border-stone-border text-sm font-mono focus:border-terracotta-500 focus:bg-white"
                  />
                  <Clock className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-xs text-obsidian-500 mt-1.5">
                  Standard enterprise duration is 15 minutes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                  Passing Percentage Threshold (0% to 100%)
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    required
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(parseFloat(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-surface border border-stone-border text-sm font-mono focus:border-terracotta-500 focus:bg-white"
                  />
                  <Award className="w-4 h-4 text-obsidian-400 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-xs text-obsidian-500 mt-1.5">
                  Default pass percentage is 60% (12 net marks out of 20).
                </p>
              </div>

              <div className="pt-4 border-t border-stone-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 btn-press shadow-tinted-sm disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-stone-surface border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-terracotta-400" />
                      <span>Save Parameters</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
