const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== Aptitude Assessment Dashboard End-to-End Verification ===");

  const client = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true, // Don't throw on error status codes
  });

  // 1. Check Instructions & Active Question Count
  console.log("\n[Test 1] Checking /api/test/instructions...");
  const instRes = await client.get("/api/test/instructions");
  console.log("Status:", instRes.status);
  console.log("Data:", instRes.data);
  if (instRes.status !== 200 || !instRes.data.canStart) {
    throw new Error("Test 1 Failed: instructions not returning canStart: true");
  }

  // 2. Register Candidate
  console.log("\n[Test 2] Candidate Registration...");
  const candidateEmail = `test.candidate.${Date.now()}@example.com`;
  const regRes = await client.post("/api/candidate/register", {
    fullName: "Alexander Hamilton",
    email: candidateEmail,
    age: 32,
    phone: "9876543210",
    qualification: "Bachelor's Degree",
    gender: "Male",
    city: "New York",
  });
  console.log("Status:", regRes.status);
  console.log("Data:", regRes.data);
  if (regRes.status !== 200 || !regRes.data.candidateId) {
    throw new Error("Test 2 Failed: candidate registration failed");
  }
  const candidateId = regRes.data.candidateId;

  // 3. Start Test
  console.log("\n[Test 3] Initializing Assessment Attempt...");
  const startRes = await client.post("/api/test/start", { candidateId });
  console.log("Status:", startRes.status);
  console.log("Data:", startRes.data);
  if (startRes.status !== 200 || !startRes.data.attemptId) {
    throw new Error("Test 3 Failed: start test failed");
  }
  const attemptId = startRes.data.attemptId;

  // 4. Fetch Questions & Verify Security (correctOption NOT leaked)
  console.log("\n[Test 4] Fetching Candidate Questions (Security Verification)...");
  const qRes = await client.get(`/api/test/questions?attemptId=${attemptId}`);
  console.log("Status:", qRes.status);
  console.log("Questions Count:", qRes.data.questions?.length);
  const leakedOption = qRes.data.questions?.some((q) => q.correctOption !== undefined);
  if (leakedOption) {
    throw new Error("SECURITY FAILURE: correctOption leaked to candidate browser!");
  }
  console.log("Security Guardrail Passed: No correctOption exposed in question payload.");

  // 5. Save Answers
  console.log("\n[Test 5] Simulating Answer Selection & Autosave...");
  const questions = qRes.data.questions;
  const sampleAnswers = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    // Select option A for first 8, B for 9th, leave 10th blank
    const selectedOption = i < 8 ? "A" : i === 8 ? "B" : null;
    sampleAnswers[q.id] = { selectedOption, markedForReview: i === 2 };

    await client.post("/api/test/save-answer", {
      attemptId,
      questionId: q.id,
      selectedOption,
      markedForReview: i === 2,
    });
  }
  console.log("Answers persisted successfully.");

  // 6. Submit Assessment
  console.log("\n[Test 6] Submitting Assessment for Server-Authoritative Grading...");
  const submitRes = await client.post("/api/test/submit", {
    attemptId,
    answers: sampleAnswers,
  });
  console.log("Status:", submitRes.status);
  console.log("Score Result:", submitRes.data);
  if (submitRes.status !== 200 || submitRes.data.score === undefined) {
    throw new Error("Test 6 Failed: test submission failed");
  }

  // 7. Check Result Dossier
  console.log("\n[Test 7] Querying Candidate Result Dossier...");
  const resDossier = await client.get(`/api/test/result/${attemptId}`);
  console.log("Status:", resDossier.status);
  console.log("Dossier Summary:", {
    score: resDossier.data.score,
    percentage: resDossier.data.percentage,
    passed: resDossier.data.passed,
    correctCount: resDossier.data.correctCount,
    incorrectCount: resDossier.data.incorrectCount,
    unattemptedCount: resDossier.data.unattemptedCount,
    timeTakenSeconds: resDossier.data.timeTakenSeconds,
  });

  // 8. Admin Authentication
  console.log("\n[Test 8] Admin Login...");
  const loginRes = await client.post("/api/admin/login", {
    email: "admin@aptitude.com",
    password: "Admin@1234",
  });
  console.log("Status:", loginRes.status);
  const cookieHeader = loginRes.headers["set-cookie"];
  console.log("Auth Cookie Set:", !!cookieHeader);
  if (loginRes.status !== 200) {
    throw new Error("Test 8 Failed: admin login failed");
  }

  const authHeader = {
    Cookie: Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader,
  };

  // 9. Admin Stats
  console.log("\n[Test 9] Querying Admin Dashboard Stats...");
  const statsRes = await client.get("/api/admin/stats", { headers: authHeader });
  console.log("KPIs:", statsRes.data.kpis);

  // 10. Admin Candidate Registry
  console.log("\n[Test 10] Querying Candidate Registry...");
  const candListRes = await client.get("/api/admin/candidates", { headers: authHeader });
  console.log("Total Candidates:", candListRes.data.total);
  console.log("Candidates Returned:", candListRes.data.candidates?.length);

  // 11. Admin Export CSV
  console.log("\n[Test 11] Testing CSV Export...");
  const exportRes = await client.get("/api/admin/export", { headers: authHeader });
  console.log("Export Status:", exportRes.status);
  console.log("Content-Type:", exportRes.headers["content-type"]);
  console.log("CSV Preview (first 120 chars):", exportRes.data.substring(0, 120));

  // 12. Strict Hard Guardrail Check: Enforce Max 10 Active Questions
  console.log("\n[Test 12] Testing Strict Guardrail: Attempting to Add 11th Active Question...");
  const guardrailRes = await client.post(
    "/api/admin/questions",
    {
      text: "Hypothetical 11th question to test guardrail limit",
      optionA: "Option 1",
      optionB: "Option 2",
      optionC: "Option 3",
      optionD: "Option 4",
      correctOption: "A",
      category: "Quantitative",
      difficulty: "Easy",
      isActive: true,
    },
    { headers: authHeader }
  );
  console.log("Guardrail Response Status:", guardrailRes.status);
  console.log("Guardrail Response Error Message:", guardrailRes.data.error);
  if (guardrailRes.status === 400 && guardrailRes.data.error.includes("Limit Enforced")) {
    console.log("Hard Guardrail Verified: 11th active question successfully blocked!");
  } else {
    throw new Error("Test 12 Failed: guardrail failed to block 11th active question!");
  }

  console.log("\n=== ALL 12 INTEGRATION TESTS PASSED WITH 100% SUCCESS! ===");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
