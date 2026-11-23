# Aptitude Assessment Dashboard

An enterprise-grade corporate aptitude evaluation and executive talent analytics web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **SQLite**.

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

## 4. Setup & Local Development

### Prerequisites
* **Node.js** v18.0.0 or higher (Tested on Node v22.17.0)
* **pnpm** (or npm)

### Installation Steps
```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables (.env)
# The default values work out-of-the-box with SQLite:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="aptitude-assessment-executive-secret-key-2026-secure"
# ADMIN_DEFAULT_EMAIL="admin@aptitude.com"
# ADMIN_DEFAULT_PASSWORD="Admin@1234"

# 3. Synchronize database schema
pnpm prisma db push

# 4. Seed database with Admin account, default settings, and 10 corporate questions
node prisma/seed.js

# 5. Start development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the candidate portal or [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for the admin console.

### Production Build
```bash
pnpm build
pnpm start
```

---

## 5. Database Schema Overview

```prisma
model Admin {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model Settings {
  id                  Int      @id @default(1)
  testDurationMinutes Int      @default(15)
  passPercentage      Float    @default(60.0)
  updatedAt           DateTime @updatedAt
}

model Question {
  id            String   @id @default(uuid())
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
  id            String   @id @default(uuid())
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
  id                String    @id @default(uuid())
  candidateId       String    @unique
  candidate         Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  startedAt         DateTime  @default(now())
  submittedAt       DateTime?
  status            String    @default("IN_PROGRESS") // 'IN_PROGRESS' | 'COMPLETED'
  questionOrder     String    // JSON stringified array of question IDs (shuffled per candidate)
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
