"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  Award, 
  UserCheck,
  HelpCircle
} from "lucide-react";
import gsap from "gsap";
import axios, { AxiosError } from "axios";

export default function RegistrationPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    age: "",
    phone: "",
    gender: "",
    qualification: "",
    city: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; attemptId?: string } | null>(null);

  // GSAP Choreographed Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-element", {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });

      gsap.from(".form-card", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        delay: 0.2,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required.";
        if (!/^[A-Za-z\s]{2,50}$/.test(value.trim())) {
          return "Name must be 2-50 characters containing only letters and spaces.";
        }
        return "";
      case "email":
        if (!value.trim()) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Please enter a valid corporate or professional email address.";
        }
        return "";
      case "age": {
        const num = parseInt(value, 10);
        if (!value) return "Age is required.";
        if (isNaN(num) || num < 18 || num > 60) {
          return "Age must be an integer between 18 and 60 inclusive.";
        }
        return "";
      }
      case "phone":
        if (!value.trim()) return "Phone number is required.";
        if (!/^\d{10}$/.test(value.trim())) {
          return "Phone number must be strictly 10 numeric digits.";
        }
        return "";
      case "qualification":
        if (!value) return "Please specify your highest qualification.";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError(null);

    // Live inline validation
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: errorMsg,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ["fullName", "email", "age", "phone", "qualification"];
    for (const f of fieldsToValidate) {
      const err = validateField(f, formData[f as keyof typeof formData]);
      if (err) newErrors[f] = err;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = document.querySelector(`[name="${Object.keys(newErrors)[0]}"]`) as HTMLElement;
      firstErrorField?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post("/api/candidate/register", formData);
      const data = res.data;

      // Store candidate info in session
      sessionStorage.setItem(
        "candidate_session",
        JSON.stringify({
          candidateId: data.candidateId,
          fullName: data.fullName,
          email: data.email,
        })
      );

      // Navigate to instructions page
      router.push("/instructions");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data;
        if (err.response.status === 409 && errorData.attemptId) {
          setServerError({
            message: errorData.error,
            attemptId: errorData.attemptId,
          });
        } else {
          setServerError({ message: errorData.error || "Registration failed. Please check your inputs." });
        }
      } else {
        setServerError({ message: "Network connection error. Please try again." });
      }
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-stone-surface flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Assessment Overview */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <div className="space-y-4 hero-element">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-950 text-stone-surface text-xs font-mono tracking-wider uppercase">
                <UserCheck className="w-3.5 h-3.5 text-terracotta-400" />
                Candidate Registration
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-5.5xl text-obsidian-950 leading-[1.15] font-semibold">
                Corporate Aptitude Test
              </h1>
              <p className="text-obsidian-600 text-base sm:text-lg leading-relaxed">
                A standardized 10-question assessment evaluating quantitative problem solving, 
                logical reasoning, and verbal comprehension. 
              </p>
            </div>

            {/* Key Assessment Parameters */}
            <div className="space-y-4 pt-4 border-t border-stone-border hero-element">
              <h2 className="text-xs font-mono uppercase tracking-widest text-obsidian-400">
                Test Summary
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {/* Questions */}
                <div className="surface-elevated rounded-xl p-3.5 sm:p-4 flex flex-col items-center text-center border border-stone-border/80 hover:border-stone-border transition-all shadow-tinted-sm">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-obsidian-700 flex items-center justify-center mb-2">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-lg sm:text-xl font-bold text-obsidian-950 leading-none">
                    10 Qns
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-obsidian-500 mt-1.5">
                    Questions
                  </span>
                </div>

                {/* Duration */}
                <div className="surface-elevated rounded-xl p-3.5 sm:p-4 flex flex-col items-center text-center border border-stone-border/80 hover:border-terracotta-200 transition-all shadow-tinted-sm">
                  <div className="w-8 h-8 rounded-lg bg-terracotta-50 text-terracotta-600 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-lg sm:text-xl font-bold text-obsidian-950 leading-none">
                    15 Min
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-obsidian-500 mt-1.5">
                    Duration
                  </span>
                </div>

                {/* Marking Scheme */}
                <div className="surface-elevated rounded-xl p-3.5 sm:p-4 flex flex-col items-center text-center border border-stone-border/80 hover:border-emerald-200 transition-all shadow-tinted-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="font-serif text-lg sm:text-xl font-bold text-obsidian-950 leading-none">
                    +2 / -1
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-obsidian-500 mt-1.5">
                    Marking
                  </span>
                </div>
              </div>

              <div className="surface-elevated rounded-xl p-4 space-y-2 text-xs text-obsidian-600">
                <div className="flex items-center gap-2 font-medium text-obsidian-900">
                  <ShieldAlert className="w-4 h-4 text-terracotta-500" />
                  Single Attempt Only
                </div>
                <p>
                  Each candidate can take the test only once per email address. Your answers are submitted and evaluated upon completion.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="lg:col-span-7">
            <div className="form-card surface-elevated rounded-2xl p-6 sm:p-10 shadow-tinted-md border border-stone-border">
              <div className="border-b border-stone-border pb-6 mb-8">
                <h2 className="font-serif text-2xl font-semibold text-obsidian-950">
                  Candidate Registration
                </h2>
                <p className="text-sm text-obsidian-600 mt-1">
                  Fill in your details below to begin your timed 10-question assessment.
                </p>
              </div>

              {serverError && (
                <div className="mb-6 p-4 rounded-xl bg-crimson-50 border border-crimson-500/20 text-crimson-700 text-sm flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-crimson-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">{serverError.message}</p>
                    {serverError.attemptId && (
                      <button
                        type="button"
                        onClick={() => router.push(`/result/${serverError.attemptId}`)}
                        className="text-xs font-semibold text-terracotta-600 underline hover:text-terracotta-700"
                      >
                        View your completed assessment analytics &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                    Full Name <span className="text-terracotta-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Eleanor Vance"
                    className={`w-full px-4 py-3 rounded-xl bg-stone-surface border text-sm transition-all focus:bg-white ${
                      errors.fullName
                        ? "border-crimson-500 ring-1 ring-crimson-500"
                        : "border-stone-border hover:border-obsidian-400 focus:border-terracotta-500"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-crimson-600 font-medium">{errors.fullName}</p>
                  )}
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                      Corporate Email <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. eleanor@meridian.com"
                      className={`w-full px-4 py-3 rounded-xl bg-stone-surface border text-sm transition-all focus:bg-white ${
                        errors.email
                          ? "border-crimson-500 ring-1 ring-crimson-500"
                          : "border-stone-border hover:border-obsidian-400 focus:border-terracotta-500"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-crimson-600 font-medium">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                      Phone Number (10 Digits) <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className={`w-full px-4 py-3 rounded-xl bg-stone-surface border text-sm font-mono transition-all focus:bg-white ${
                        errors.phone
                          ? "border-crimson-500 ring-1 ring-crimson-500"
                          : "border-stone-border hover:border-obsidian-400 focus:border-terracotta-500"
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1.5 text-xs text-crimson-600 font-medium">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Age and Qualification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                      Age (18–60) <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      min={18}
                      max={60}
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="28"
                      className={`w-full px-4 py-3 rounded-xl bg-stone-surface border text-sm font-mono transition-all focus:bg-white ${
                        errors.age
                          ? "border-crimson-500 ring-1 ring-crimson-500"
                          : "border-stone-border hover:border-obsidian-400 focus:border-terracotta-500"
                      }`}
                    />
                    {errors.age && (
                      <p className="mt-1.5 text-xs text-crimson-600 font-medium">{errors.age}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                      Highest Qualification <span className="text-terracotta-500">*</span>
                    </label>
                    <select
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl bg-stone-surface border text-sm transition-all focus:bg-white ${
                        errors.qualification
                          ? "border-crimson-500 ring-1 ring-crimson-500"
                          : "border-stone-border hover:border-obsidian-400 focus:border-terracotta-500"
                      }`}
                    >
                      <option value="">Select qualification...</option>
                      <option value="High School">High School</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.qualification && (
                      <p className="mt-1.5 text-xs text-crimson-600 font-medium">{errors.qualification}</p>
                    )}
                  </div>
                </div>

                {/* Gender and City (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                      Gender <span className="text-obsidian-400">(Optional)</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-stone-surface border border-stone-border text-sm hover:border-obsidian-400 focus:border-terracotta-500 focus:bg-white transition-all"
                    >
                      <option value="">Select gender...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-obsidian-700 mb-2">
                      Location / City <span className="text-obsidian-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full px-4 py-3 rounded-xl bg-stone-surface border border-stone-border text-sm hover:border-obsidian-400 focus:border-terracotta-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-border">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-xl bg-obsidian-950 text-stone-surface hover:bg-obsidian-850 active:bg-obsidian-900 font-medium text-sm flex items-center justify-center gap-2 shadow-tinted-lg transition-all btn-press disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-stone-surface border-t-transparent rounded-full animate-spin" />
                        Validating Credentials...
                      </span>
                    ) : (
                      <>
                        <span>Register</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
