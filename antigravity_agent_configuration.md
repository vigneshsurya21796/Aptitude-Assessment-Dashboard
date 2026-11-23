# AGENTS.md — Aptitude Assessment Dashboard

This document provides architectural context, design guardrails, business logic constraints, and engineering guidelines for AI coding agents (Google Antigravity) building the **Aptitude Assessment Dashboard**.

## 1. Mandatory Pre-Coding Skill & Design Guardrails

* **Skill Invocation (No Exceptions):** Invoke the `frontend-design` skill before writing any frontend code, every session, no exceptions.
* **No Generic AI Slop:** Build a bespoke, editorial/executive assessment aesthetic rather than generic SaaS templates. Use **GSAP (`gsap`)** for smooth, choreographed motion and micro-interactions.

### Anti-Generic Guardrails
* **Colors:** Never use the default Tailwind palette (`indigo-500`, `blue-600`, `slate-800`, etc.). Pick a custom brand color palette (defined via CSS custom properties / Tailwind theme tokens, e.g., deep obsidian/slate-ink base, warm alabaster/stone surfaces, and a signature editorial accent like burnt terracotta or deep emerald-gold) and derive all semantic states from it.
* **Shadows:** Never use flat `shadow-md` or generic gray shadows. Use layered, color-tinted shadows with low opacity calibrated to the background hue.
* **Typography:** Never use the same font for headings and body. Pair a distinctive display or editorial serif (e.g., *Instrument Serif*, *Newsreader*, or *Fraunces*) with a crisp geometric/humanist sans (e.g., *Plus Jakarta Sans* or *Inter*) and monospace for timers/scores. Apply tight tracking (`-0.03em`) on large headings and generous line-height (`1.7`) on body text.
* **Gradients & Texture:** Layer multiple subtle radial gradients for atmospheric depth. Add subtle grain/texture via an inline SVG noise filter (`feTurbulence`) on hero/background layers.
* **Animations (GSAP + GPU-only):** Use **GSAP** (`gsap.context()` inside `useEffect` / `useLayoutEffect` for clean React lifecycle cleanup) for smooth page entrances, question transitions, modal reveals, and dashboard KPI staggers. Only animate `transform` and `opacity`. Never use `transition-all`. Use spring-style or custom cubic-bezier easing (`power3.out`, `back.out(1.2)`).
* **Interactive States:** Every clickable element (buttons, question palette tiles, radio cards, table headers, pagination controls) must have distinct `hover`, `focus-visible`, and `active` states. No exceptions.
* **Images:** Whenever images or visual banners are used, add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
* **Spacing:** Use intentional, consistent spacing tokens across layouts, cards, and form groups — never arbitrary, inconsistent Tailwind steps.
* **Depth & Elevation:** Surfaces must follow a strict 3-tier layering system (`base` canvas $\rightarrow$ `elevated` cards/panels $\rightarrow$ `floating` modals/popovers/sticky headers) using subtle surface shifts, hairline borders, and tinted shadows so elements never sit on a flat z-plane.

## 2. Project Overview & Core Objective

Build a full-stack web application where candidates register, take a timed 10-question corporate aptitude test, and receive detailed performance analytics, alongside a secure Admin Panel for question bank management, candidate review, and test configuration.

**Key Evaluation Focus:** Maintain clean, modular, production-ready code. Every feature must be backed by a real persistent database (no mock arrays or `localStorage`-only persistence).

## 3. Recommended Tech Stack & Architecture

* **Framework:** Next.js (App Router) with TypeScript — enables unified frontend/backend API routes, server-side validation, and easy deployment (Vercel/Render).
* **Styling & Motion:** Tailwind CSS (configured with custom brand tokens), **GSAP (`gsap`)** for animations, `lucide-react` icons, and `recharts` (custom-styled to match brand tokens) for admin dashboard charts.
* **Database & ORM:** PostgreSQL (via Neon or Supabase) or SQLite (via Turso/local file for dev) using **Prisma** or **Drizzle ORM**.
* **Authentication:** JWT stored in `HttpOnly` secure cookies (via `jose` and `bcryptjs` for password hashing).
* **Export Utility:** `papaparse` or `xlsx` for mandatory CSV/Excel exports.

## 4. Database Schema Requirements

Ensure the database schema models the following entities cleanly:

1. **`Admin`**: `id`, `email` (unique), `passwordHash`, `createdAt`.
2. **`Settings`**: `id` (singleton row), `testDurationMinutes` (default: `15`), `passPercentage` (default: `60`).
3. **`Question`**:
   * `id`, `text`, `optionA`, `optionB`, `optionC`, `optionD`
   * `correctOption` (`'A' | 'B' | 'C' | 'D'`)
   * `category` (`'Quantitative' | 'Logical Reasoning' | 'Verbal'`)
   * `difficulty` (`'Easy' | 'Medium' | 'Hard'`)
   * `isActive` (Boolean — system must enforce **max 10 active questions**)
4. **`Candidate`**:
   * `id`, `fullName`, `email` (unique), `age`, `phone`, `gender` (nullable), `qualification`, `city` (nullable)
   * `createdAt`
5. **`Attempt`**:
   * `id`, `candidateId` (unique — enforces 1 attempt per candidate), `startedAt`, `submittedAt` (nullable), `status` (`'IN_PROGRESS' | 'COMPLETED'`)
   * `questionOrder` (JSON array of Question IDs, shuffled per candidate on start)
   * `answers` (JSON map of `{ [questionId]: { selectedOption: string | null, markedForReview: boolean } }`)
   * `score` (Float/Int), `percentage` (Float), `correctCount`, `incorrectCount`, `unattemptedCount`, `marksDeducted`, `timeTakenSeconds`, `passed` (Boolean)

## 5. Strict Business Logic & Validation Rules

### Part A: Candidate Module
1. **Registration Page (`/`)**:
   * **Full Name:** Required, letters and spaces only (`/^[A-Za-z\s]{2,50}$/`).
   * **Email ID:** Required, valid email format, must be unique. If an attempt already exists for this email, block registration with a clear, friendly message.
   * **Age:** Required, integer between `18` and `60` inclusive.
   * **Phone Number:** Required, strictly 10 digits (`/^\d{10}$/`).
   * **Gender:** Optional dropdown (`Male`, `Female`, `Non-binary`, `Prefer not to say`).
   * **Highest Qualification:** Required dropdown (`High School`, `Diploma`, `Bachelor's Degree`, `Master's Degree`, `PhD`, `Other`).
   * **City:** Optional string.
   * *Validation UX:* Show inline error messages per field before submission and handle backend uniqueness errors gracefully.

2. **Instructions Page (`/instructions`)**:
   * Dynamically fetch current `testDurationMinutes` from `Settings`.
   * Display total questions (`10`), time limit, and marking scheme: **`+2` for correct, `-1` for wrong, `0` for unattempted**.
   * Clicking **Start Test** initializes the `Attempt` record in the DB, shuffles the 10 active question IDs, and records `startedAt`.

3. **Test Engine (`/test`)**:
   * **Pre-check:** Do not allow test start if fewer than `10` active questions exist in the database.
   * **Navigation:** Single question view with `Previous`, `Next`, `Clear Response`, and `Mark for Review` controls. Animate question transitions smoothly via GSAP (`transform` + `opacity`).
   * **Question Palette:** Grid of numbers `1–10` color-coded by state using custom brand tokens: *Answered*, *Unanswered*, *Marked for Review* (and *Answered & Marked*). Clicking any number jumps directly to that question.
   * **State Persistence:** Sync answer selections and review flags to the backend DB (debounced or on navigation) AND mirror in `sessionStorage` so an accidental page refresh restores exact answers and remaining timer without resetting the clock (`remaining = duration - (now - startedAt)`).
   * **Timer & Auto-Submit:** Visible countdown timer (tabular monospace numerals). Automatically trigger submission API when `remaining <= 0`.
   * **Manual Submission:** Open a floating-tier confirmation modal displaying exact counts of *Answered*, *Unanswered*, and *Marked for Review* questions before finalizing.

4. **Result Page (`/result/[attemptId]`)**:
   * **Scoring Math:**
     * $\text{Net Score} = (\text{Correct} \times 2) - (\text{Incorrect} \times 1)$
     * *Note:* Maximum score is `20` (10 questions $\times 2$ marks). **CRITICAL:** The specification mentions *"maximum 10; it can go below zero"* in the Result section while specifying *"+2 for a correct answer, -1 for a wrong answer"* in the Instructions section. Implement the `+2 / -1` formula ($\max = 20$, $\min = -10$) and calculate $\text{Percentage} = \max\left(0, \frac{\text{Net Score}}{20} \times 100\right)$, while documenting this mathematical reconciliation clearly in `README.md`.
   * Display: Net score, percentage, correct count, incorrect count, unattempted count, marks deducted (`incorrectCount * 1`), time taken (`mm:ss`), and `PASS` / `FAIL` badge against the dynamic `passPercentage` setting.

### Part B: Admin Module
1. **Authentication (`/admin/login`)**:
   * Protect all `/admin/*` routes and `/api/admin/*` endpoints via middleware.
   * Store admin passwords hashed with `bcryptjs` (never plaintext).
   * Seed 1 default admin account and document credentials in `README.md`.

2. **Dashboard (`/admin/dashboard`)**:
   * KPI Summary Cards (staggered entrance via GSAP): Total Candidates Registered, Tests Completed, Average Score, Pass Rate (`%`), and Highest Score.
   * Data Visualization: Include a clean chart (e.g., Pass vs. Fail breakdown or Score Distribution histogram) styled strictly with custom brand tokens.

3. **Question Management (`/admin/questions`)**:
   * Full CRUD (Create, Read, Update, Delete) with category (`Quantitative`, `Logical Reasoning`, `Verbal`) and difficulty (`Easy`, `Medium`, `Hard`).
   * **Hard Guardrail:** Enforce a strict limit of **10 active questions**. Prevent activating/adding an 11th active question unless another is deactivated or deleted, and display a clear warning banner if active questions `< 10`.

4. **Candidate Results (`/admin/candidates`)**:
   * Paginated table (**10 rows per page**): Name, Email, Phone, Age, Score, Percentage, Status (`Pass`/`Fail`), Date of Attempt.
   * Controls: Search by Name or Email, Filter by Status (`All`, `Pass`, `Fail`), Sort by `Score` or `Date` (`asc`/`desc`).
   * **Candidate Detail View:** Floating modal or drawer displaying every question in the candidate's attempt, the option they selected, the correct option, and per-question marks awarded (`+2`, `-1`, `0`).
   * **Data Export (Mandatory):** Button to export either **All Results** or the **Current Filtered View** to `.csv` or `.xlsx`.

5. **Settings (`/admin/settings`)**:
   * Form to update `testDurationMinutes` (e.g., 5–120 mins) and `passPercentage` (0–100%).

## 6. Database Seed Data Requirements

The seed script (`prisma/seed.ts` or equivalent) MUST populate:

1. **1 Admin Account** (e.g., `admin@aptitude.com` / `Admin@1234`).
2. **Default Settings** (`testDurationMinutes: 15`, `passPercentage: 60`).
3. **10 Corporate-Level Questions** (at least 3 per category: Quantitative, Logical Reasoning, Verbal):
   * **Include the 3 mandatory sample questions verbatim:**
     1. *(Quantitative)* "A subscription business plans a 20% price increase. What is the largest share of its customers it can lose before monthly revenue falls below today's level?" -> Options: `A) 16.7%`, `B) 20%`, `C) 15%`, `D) 18.3%` | Answer: `A`
     2. *(Logical Reasoning)* "Six client meetings (P, Q, R, S, T, U) are scheduled Monday to Saturday, one per day. S is on Wednesday. R is the day immediately before U, and U is not on Saturday. Q is later in the week than both P and T. T is not on Monday. Which of the following must be true?" -> Options: `A) P is on Monday`, `B) Q is on Saturday`, `C) R is on Thursday`, `D) T is on Tuesday` | Answer: `B`
     3. *(Verbal)* "Choose the grammatically correct sentence for a project update." -> Options: `A) Neither the manager nor the analysts was aware of the change.`, `B) Neither the analysts nor the manager were aware of the change.`, `C) Neither the manager nor the analysts were aware of the change.`, `D) Neither the manager or the analysts were aware of the change.` | Answer: `C`
   * **Author 7 original multi-step corporate aptitude questions** (business ratios, data interpretation, scheduling/deduction puzzles, critical reasoning, executive communication) with plausible distractors reflecting common calculation or logical errors.

## 7. Agent Workflow & Verification Standards

When operating on this repository in Antigravity:

1. **Invoke Design Skill First:** Always invoke the `frontend-design` skill at the start of any frontend session before creating or modifying UI components.
2. **Plan Before Coding:** Outline the database schema, custom design token system, and API contracts first before generating UI components.
3. **Server-Side Security:** Never trust client-side timers or client-submitted scores. Always calculate scores and validate elapsed time on the server during `/api/test/submit`. Never leak `correctOption` in the `/api/test/questions` payload sent to the candidate browser during an active test.
4. **Browser Verification:** Use the integrated browser tool to verify end-to-end flows and visual compliance with the Anti-Generic Guardrails:
   * Test registration validation errors and duplicate email blocking.
   * Start a test, select answers, refresh the page to confirm state/timer survival, and submit.
   * Log in as Admin, inspect candidate question-by-question breakdown, export CSV, and update settings.
   * Verify custom typography pairing, color-tinted shadows, layered elevation, interactive states (`hover`, `focus-visible`, `active`), and smooth GSAP animations.
5. **Documentation:** Keep `README.md` updated with setup instructions, environment variables (`.env.example`), database schema overview, seeded admin credentials, and assumptions made if any.