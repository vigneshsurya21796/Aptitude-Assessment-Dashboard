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

## 6. Build with AI — Tools & Key Prompts

As specified in the assignment guidelines, this application was architected, written, and refined using agentic AI coding tools.

### AI Tool Used:
* **Google Antigravity Agent** (powered by Gemini 2.5 Pro / Thinking model)

### Key Prompts That Shaped the Application:
1. **Foundation & Architecture:**
   > *"Start building the full-stack Aptitude Assessment Dashboard app based on the assignment instructions: Candidate registration with validation, timed 10-question test with question palette, server-authoritative +2/-1 scoring, result dossier, protected Admin console with question CRUD (strict 10 active limit), candidate audit table with CSV export, settings, and GSAP animations."*
2. **Client Data Fetching Layer:**
   > *"Use axios for data fetching change from fetch across all client components with comprehensive error handling."*
3. **Database Migration to MongoDB Atlas:**
   > *"Migrate the database to MongoDB Atlas with native ObjectId schema mappings, transactions, and Prisma seeding."*
4. **Security & Session Hardening:**
   > *"Store passwords strictly hashed with bcrypt (salt rounds: 10), protect all admin routes with JWT in HttpOnly cookies via Next.js Middleware, and ensure correctOption is never leaked to candidate browser during active tests."*

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

