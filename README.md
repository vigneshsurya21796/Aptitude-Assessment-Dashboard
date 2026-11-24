# Aptitude Assessment Dashboard

An enterprise-grade corporate aptitude evaluation and executive talent analytics web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **Axios**, and **MongoDB Atlas**.

The system enables candidates to register, take a secure timed 10-question assessment, and receive instant performance analytics, backed by a dedicated Admin Console for question bank management, candidate dossier auditing, and test governance.

---

## 1. Mathematical Reconciliation & Scoring Formula

In the assessment specification, two items required mathematical reconciliation:
1. The Instructions section specifies: **`+2` for a correct answer**, **`-1` for a wrong answer**, and **`0` for unattempted**.
2. For a 10-question test with `+2` per correct question, the theoretical maximum score is **`20`** ($10 \times 2 = 20$), and with `-1` penalty for wrong answers, the minimum theoretical score is **`-10`** ($10 \times -1 = -10$).
3. The specification also mentioned *"maximum 10; it can go below zero"*.

### Canonical Scoring Formulation Implemented:
* **$\text{Net Score} = (\text{Correct Count} \times 2) - (\text{Incorrect Count} \times 1)$**
  * Maximum Possible Score: **`20`**
  * Minimum Possible Score: **`-10`**
* **$\text{Percentage (\%)} = \max\left(0, \frac{\text{Net Score}}{20} \times 100\right)$**
* **$\text{Result Status} = \text{Percentage} \ge \text{Pass Percentage Threshold (Default: 60\%)}$**
  * At $60\%$, a candidate requires a net score of $\ge 12$ marks to pass.
* **Server-Authoritative Evaluation:** Scores and elapsed times are calculated strictly server-side in `/api/test/submit`. The client browser never receives `correctOption` in active test question payloads.

---

## 2. Key Architecture & Features

### Part A: Candidate Module
* **Registration (`/`)**:
  * Strict validation: Full Legal Name (letters & spaces only, 2–50 chars), Email format & uniqueness, Age (18–60 inclusive), Phone Number (strictly 10 numeric digits), Highest Qualification (required dropdown), Gender & City (optional).
  * Single-Attempt Enforcement: If an attempt has already been finalized for an email address, registration is blocked with a friendly message and direct link to view their completed dossier.
* **Assessment Briefing (`/instructions`)**:
  * Dynamically queries test duration (default: 15 mins) and pass threshold (default: 60%) from the database.
  * Details marking matrix (+2, -1, 0).
  * System pre-check: Prevents test start if fewer than 10 active questions exist in the database.
* **Test Engine (`/test`)**:
  * Single-question layout with smooth GSAP animations on transitions.
  * Question Palette (Grid 1–10) with distinct color-coded semantic states: *Answered* (Emerald), *Unanswered* (Neutral), *Marked for Review* (Amber), *Current Active* (Terracotta ring).
  * State Persistence: Syncs answer selections and review flags to backend database AND mirrors in `sessionStorage` so page reloads restore answers and exact remaining time without resetting the clock.
  * Live Monospace Tabular Timer: Synchronized with server start time; turns red and pulses under 2 minutes; triggers automatic submission at `00:00`.
  * Floating Confirmation Modal displaying exact counts of answered, unanswered, and review questions before manual submission.
* **Performance Dossier (`/result/[attemptId]`)**:
  * Net Score, percentage, correct/incorrect/unattempted breakdown, marks deducted, time taken, and PASS/FAIL status.
  * Confetti animation on passing scores.
  * Full question-by-question audit drawer showing selected vs. correct options.

### Part B: Admin Console
* **Authentication (`/admin/login`)**:
  * Route and API protection via Next.js Middleware.
  * Passwords hashed using `bcryptjs` (salt rounds: 10).
  * Secure JWT session stored in `HttpOnly` cookie.
* **Executive Dashboard (`/admin/dashboard`)**:
  * KPI summary cards with staggered GSAP entrances: Total Candidates, Tests Completed, In Progress, Average Score, Pass Rate (%), Highest Score.
  * Interactive Recharts visualizations: Score Distribution Histogram and Candidate Outcomes.
* **Question Bank Management (`/admin/questions`)**:
  * Full CRUD (Create, Read, Update, Delete) with Category and Difficulty.
  * **Strict Hard Guardrail:** The system enforces a strict maximum limit of **10 active questions**. Activating or creating an 11th active question is rejected server-side and client-side.
  * Active question gauge and warning banner if active count $< 10$.
* **Candidate Registry (`/admin/candidates`)**:
  * Paginated table (10 rows per page) with search by name/email/phone, status filters (All, Pass, Fail, In Progress), and sorting by score or attempt date.
  * Candidate Detail Audit modal showing complete per-question answer breakdown (+2, -1, 0).
  * **CSV Data Export:** One-click download of all candidates or current filtered view.
* **Settings (`/admin/settings`)**:
  * Live updates to `testDurationMinutes` (5–120) and `passPercentage` (0–100%).

---

## 3. Seeded Admin Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@aptitude.com` | `Admin@1234` |

*(A 1-click auto-fill helper button is also available on the Admin login page for effortless review).*

---

## 4. Setup & Running the Project (Quickstart for Evaluators)

### Prerequisites
* **Node.js** v18.0.0 or higher (Tested on Node v22.17.0)
* **pnpm** (or `npm`)

---

### Step-by-Step Instructions:

```bash
# 1. Clone the repository
git clone <your-repository-url>
cd "Aptitude Assessment Dashboard"

# 2. Install dependencies
pnpm install
# (or: npm install)

# 3. Create your .env file from .env.example
# On Mac/Linux:
cp .env.example .env
# On Windows (PowerShell):
Copy-Item .env.example .env
# On Windows (cmd):
copy .env.example .env

# 4. Configure your MongoDB connection string in .env:
# Open .env and insert your MongoDB Atlas URI (or private test cluster):
# DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/aptitude_db?retryWrites=true&w=majority"

# 5. Synchronize schema and seed the database:
# Creates the collections (Admin, Settings, Question, Candidate, Attempt) and unique indexes:
pnpm prisma db push

# Seeds the default admin account, default settings (15m, 60%), and 10 corporate questions:
node prisma/seed.js

# 6. Start the development server
pnpm dev
# (or: npm run dev)
```

Once running:
* **Candidate Portal:** Open [http://localhost:3000](http://localhost:3000)
* **Admin Console:** Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  * **Email:** `admin@aptitude.com`
  * **Password:** `Admin@1234`
  * *(A "Quick Fill Demo Admin" button is also provided on the login card for 1-click evaluation).*

### Production Build & Launch:
```bash
pnpm build
pnpm start
```

---

## 5. MongoDB Database Schema (Prisma)

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Admin {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model Settings {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  testDurationMinutes Int      @default(15)
  passPercentage      Float    @default(60.0)
  updatedAt           DateTime @updatedAt
}

model Question {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  text          String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption String   // 'A' | 'B' | 'C' | 'D'
  category      String   // 'Quantitative' | 'Logical Reasoning' | 'Verbal'
  difficulty    String   // 'Easy' | 'Medium' | 'Hard'
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Candidate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  fullName      String
  email         String   @unique
  age           Int
  phone         String
  gender        String?
  qualification String
  city          String?
  createdAt     DateTime @default(now())
  attempt       Attempt?
}

model Attempt {
  id                String    @id @default(auto()) @map("_id") @db.ObjectId
  candidateId       String    @unique @db.ObjectId
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  startedAt         DateTime  @default(now())
  submittedAt       DateTime?
  status            String    @default("IN_PROGRESS") // 'IN_PROGRESS' | 'COMPLETED'
  questionOrder     String    // JSON stringified array of question IDs
  answers           String    // JSON stringified map of answers and review flags
  score             Float     @default(0)
  percentage        Float     @default(0)
  correctCount      Int       @default(0)
  incorrectCount    Int       @default(0)
  unattemptedCount  Int       @default(10)
  marksDeducted     Float     @default(0)
  timeTakenSeconds  Int       @default(0)
  passed            Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

---

## 6. Build with AI — Prompts, Techniques & Frontend Mastery

As required by the assignment guidelines, this application was architected, written, and iteratively refined using an agentic AI coding workflow.

### 6.1. Workflow Inception: From Raw `.docx` to Agent Blueprint

The development journey followed a deliberate, structured engineering process:

1. **Ingestion of the Source Brief (`.docx`):**
   - The initial project requirements were provided in a standard Word specification document (`.docx`).
   - Rather than immediately generating code with raw, unconstrained prompts—which typically leads to hallucinated data schemas and cookie-cutter designs—the `.docx` specification was parsed and converted into a dedicated system configuration: [`antigravity_agent_configuration.md`](./antigravity_agent_configuration.md).

2. **System Specification & Guardrails Blueprint:**
   - [`antigravity_agent_configuration.md`](./antigravity_agent_configuration.md) acted as the operational "North Star" for the **Google Antigravity Agent** (powered by Gemini 2.5 Pro / Thinking model).
   - It pre-established the entire architectural boundary:
     - **Anti-AI-Slop & Anti-SaaS-Purple Design System:** Outlawed generic purple/indigo templates and mandated a warm editorial palette (*Stone, Obsidian, Terracotta, Imperial Emerald*).
     - **Database Schema & Constraints:** Strictly defined models (`Candidate`, `Attempt`, `Question`, `Admin`, `Settings`) and unique candidate email constraints.
     - **Mathematical Scoring Formula:** Formally pinned server-side $+2 / -1$ net scoring reconciliation.
     - **Security & Persistence Rules:** Banned mock client data, mandated bcrypt password hashing, and required persistent database storage.

3. **Human-in-the-Loop Iterative Steering:**
   - Using the blueprint as the foundational guardrail, subsequent prompts were delivered iteratively to refine ergonomics, eliminate AI buzzwords, upgrade security, and perfect the candidate and administrator experience.

---

### 6.2. Architectural Evolution & Production Hardening Milestones

Rather than relying on unconstrained generative output, the application underwent a series of structured, human-guided engineering iterations. Each milestone systematically hardened the architecture, elevated security standards, and refined the user experience:

| Phase | Engineering Focus | Strategic Objective | Technical Implementation |
|---|---|---|---|
| **01** | **System Specification** | Architectural Blueprinting | Ingested the `.docx` brief into [`antigravity_agent_configuration.md`](./antigravity_agent_configuration.md), locking down database models, $+2 / -1$ scoring rules, and anti-slop design tokens before code execution. |
| **02** | **Full-Stack Core** | App Scaffolding & Engine | Architected Next.js 14 App Router full-stack structure, Prisma ORM layer, GSAP motion choreography, and seeded 10 multi-step corporate assessment questions. |
| **03** | **Network Layer** | Type-Safe Client Fetching | Replaced native `fetch` with a centralized **Axios** client across all 10 client views, introducing timeout management and `isAxiosError` response typing. |
| **04** | **Data Persistence** | Cloud Replica Set Migration | Migrated schema primitives to native **MongoDB Atlas** ObjectIds (`@db.ObjectId`) with cloud replica set clustering and unique constraint enforcement (`Candidate_email_key`). |
| **05** | **Security & Auth** | Cryptographic Hardening | Verified `bcryptjs` password hashing (10 salt rounds) for admin accounts, and upgraded the JWT secret from a default string to a high-entropy 256-bit cryptographic hex key. |
| **06** | **Domain Refinement** | Linguistic De-Slop Audit | Replaced generic, pseudo-futuristic AI buzzwords (`Live Verification Protocol`, `Executive Console`, `Verified Dossier`) with clear, professional testing terminology (`Candidate Registration`, `Admin Login`, `Question Bank`). |
| **07** | **Visual Ergonomics** | Information Architecture | De-cluttered the global header by relocating test parameters to the registration card, and transformed a cramped horizontal summary into an equal-width 3-column vertical stat card grid (`10 Qns`, `15 Min`, `+2 / -1`). |
| **08** | **Reporting & Export** | Human-Centric Data Formatting | Replaced raw ISO machine strings (`2026-11-24T01:57:42.632Z`) with localized, 12-hour AM/PM human-readable timestamps (`24 Nov 2026, 07:27:42 AM`, `04m 12s`) across CSV exports and audit modals. |
| **09** | **Brand Identity** | Bespoke Vector Identity | Replaced generic emoji and text ligatures with a custom geometric vector emblem (`<AptitudeLogo />`) and matching SVG browser tab favicons (`public/favicon.svg`). |

#### Detailed Engineering Decisions:

1. **Protocol-Level Data Fetching (Axios Migration):**
   - The initial prototype relied on native `fetch()`, which required verbose manual boilerplate for checking `response.ok`, extracting JSON payloads, and handling network timeouts.
   - Migrating to a centralized Axios architecture (`src/lib/api.ts`) established standardized timeout boundaries (10 seconds), automatic JSON serialization, and centralized error classification using `axios.isAxiosError(error)`.

2. **Dual-Layer Persistence Strategy:**
   - Candidate progress is safeguarded through a dual-persistence model: answers and timer state are synchronized to the MongoDB database in real time while mirrored locally in browser `sessionStorage`.
   - If a candidate accidentally reloads their browser, experiences a network blip, or closes the tab, the state is restored without resetting the countdown timer.

3. **Server-Authoritative Scoring Integrity:**
   - Correct answers are strictly decoupled from client-side bundles. The browser only receives question texts and options; scoring evaluations, marks deduction, percentages, and pass/fail determinations are computed exclusively on the server at submission time.

---

### 6.3. Techniques Used to Prevent "AI Slop" & the "Typical SaaS Purple" Cliché

1. **Rejection of the "Typical Purple SaaS" Aesthetic:**
   - **Why AI Defaults to Purple:** Standard LLMs are heavily trained on cookie-cutter Tailwind templates that default to indigo/violet buttons (`bg-indigo-600`, `bg-purple-600`), neon purple hero glows, and generic slate-900 cards.
   - **Our Counter-Architecture:** We enforced a bespoke editorial aesthetic inspired by prestigious academic and executive assessment institutions:
     - **Warm Stone Surfaces (`#FAF9F6`, `#F3F1EC`)** — eliminating sterile white and cold grey canvases.
     - **Deep Obsidian (`#06090D`, `#141923`)** — providing high-contrast structure and tactile framing.
     - **Terracotta Accent (`#D46733`)** — warm, deliberate interactive highlights and focal rings.
     - **Imperial Emerald Accent (`#1B7A53`)** — authoritative confirmation for qualified candidates and correct answers.
     - **Editorial Typography:** *Fraunces* (warm high-contrast serif), *Plus Jakarta Sans* (humanist sans), and *JetBrains Mono* (precise tabular figures).

2. **Elimination of Robotic Buzzwords ("AI Slop"):**
   - AI models tend to insert pseudo-futuristic corporate jargon (*"Live Verification Protocol"*, *"Executive Telemetry"*, *"Candidate Dossier"*, *"Executive Console"*, *"Autonomous Scoring Matrix"*).
   - We systematically purged every robotic term, standardizing on clear, respectful candidate and admin language: `Candidate Registration`, `Admin Login`, `Question Bank`, `Candidate Results`, and `Question Response Analysis`.

3. **Zero Mock or Hardcoded Data:**
   - LLMs frequently fall back to hardcoded in-memory arrays or client mocks. This application enforces genuine persistence on a **MongoDB Atlas cloud replica set** for every single candidate, test answer, and timer state.

4. **Server-Authoritative Evaluation:**
   - AI code often erroneously trusts client-submitted scores or sends `correctOption` to the browser. We strictly decoupled evaluation: the browser only receives question texts and options, while marks, percentages, pass/fail status, and time spent are computed exclusively on the server upon submission.

---

### 6.4. How Frontend Design Was Invoked to Get the Best Out of AI

1. **Constraint-First Prompting:**
   - Pre-specifying exact design tokens, hex codes, typography pairings, and layout structures in `antigravity_agent_configuration.md` prevented the AI from improvising with default components.
2. **Human-in-the-Loop Density Refinement:**
   - When the AI generated a 3-card layout that felt squished horizontally, human critique (*"all three should be equal, shorten to qns"*) directed the model to pivot to a vertical-centered stat grid with prominent numbers and clean badge hierarchy.
3. **Motion Choreography via GSAP:**
   - Rather than relying on generic CSS transitions or heavy third-party animation bloat, GSAP was directed to orchestrate smooth, staggered card entrances, timer urgency pulses (turning red under 2 minutes), and milestone confetti.
4. **Ergonomic Candidate Experience:**
   - The question palette (1–10) provides instant visual clarity across 4 distinct states (*Answered [Emerald], Unanswered [Neutral], Marked for Review [Amber], Current [Terracotta Ring]*), with a confirmation modal preventing accidental submissions.
5. **Custom Vector Identity Over Placeholder Emojis:**
   - Directed the AI to avoid generic Lucide icons or emoji placeholders for branding, engineering a custom SVG emblem (`<AptitudeLogo />`) that renders consistently in the header, test engine, and browser tab favicons.

---

## 7. Assumptions & Engineering Decisions

1. **Mathematical Scoring Formulation:**
   - The brief noted both "+2 for correct, -1 for wrong" and "(maximum 10; it can go below zero)". For 10 questions with +2 marks each, the true theoretical maximum is 20, and minimum theoretical is -10. We implemented:
     $\text{Net Score} = (\text{Correct} \times 2) - (\text{Incorrect} \times 1)$
     $\text{Percentage} = \max\left(0, \frac{\text{Net Score}}{20} \times 100\right)$
2. **Strict Single-Attempt Enforcement:**
   - An email address is permanently bound to a single assessment attempt. If a user re-enters their email, they are blocked with a clear message and direct link to their existing dossier.
3. **Hard Question Limit (Strictly 10 Active):**
   - The test engine requires exactly 10 questions. If an administrator attempts to create or activate an 11th question, the server and client reject the operation with a friendly validation error.
4. **Timer & State Recovery:**
   - Answers and review markers are synced in real time to MongoDB and mirrored in browser `sessionStorage`. An accidental refresh or network glitch restores both the exact remaining seconds and answered questions without resetting the timer.

