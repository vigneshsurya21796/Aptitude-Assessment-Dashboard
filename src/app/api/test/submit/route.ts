import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId, answers: clientAnswers } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required for submission." }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        candidate: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt record not found." }, { status: 404 });
    }

    // If already completed, return existing results
    if (attempt.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        attemptId: attempt.id,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
      });
    }

    const settings = await prisma.settings.findFirst();
    const durationMinutes = settings?.testDurationMinutes ?? 15;
    const passThreshold = settings?.passPercentage ?? 60.0;

    // Calculate time taken (server authoritative)
    const now = Date.now();
    const startedTime = new Date(attempt.startedAt).getTime();
    const totalElapsedSeconds = Math.max(0, Math.floor((now - startedTime) / 1000));
    const timeTakenSeconds = Math.min(durationMinutes * 60, totalElapsedSeconds);

    // Merge answers: DB answers merged with any final batch from client
    let currentDbAnswers: Record<string, { selectedOption: string | null; markedForReview: boolean }> = {};
    try {
      currentDbAnswers = JSON.parse(attempt.answers || "{}");
    } catch {
      currentDbAnswers = {};
    }

    const mergedAnswers = { ...currentDbAnswers, ...(clientAnswers || {}) };

    // Fetch actual questions to calculate score authoritatively
    const questionOrder: string[] = JSON.parse(attempt.questionOrder);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionOrder } },
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    for (const qId of questionOrder) {
      const q = questionMap.get(qId);
      const ans = mergedAnswers[qId];
      const selected = ans?.selectedOption;

      if (!q || !selected) {
        unattemptedCount++;
      } else if (selected.toUpperCase() === q.correctOption.toUpperCase()) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }

    // Scoring Math:
    // Net Score = (Correct * 2) - (Incorrect * 1)
    // Max score = 20 (10 questions * 2). Can go below 0 (down to -10).
    // Percentage = max(0, (Net Score / 20) * 100)
    const marksDeducted = incorrectCount * 1.0;
    const netScore = correctCount * 2.0 - marksDeducted;
    const percentage = Math.max(0, Math.round(((netScore / 20.0) * 100) * 100) / 100);
    const passed = percentage >= passThreshold;

    const updatedAttempt = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        submittedAt: new Date(),
        answers: JSON.stringify(mergedAnswers),
        score: netScore,
        percentage,
        correctCount,
        incorrectCount,
        unattemptedCount,
        marksDeducted,
        timeTakenSeconds,
        passed,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      score: updatedAttempt.score,
      percentage: updatedAttempt.percentage,
      correctCount: updatedAttempt.correctCount,
      incorrectCount: updatedAttempt.incorrectCount,
      unattemptedCount: updatedAttempt.unattemptedCount,
      marksDeducted: updatedAttempt.marksDeducted,
      timeTakenSeconds: updatedAttempt.timeTakenSeconds,
      passed: updatedAttempt.passed,
    });
  } catch (error) {
    console.error("Test submit error:", error);
    return NextResponse.json({ error: "Failed to evaluate and finalize assessment." }, { status: 500 });
  }
}
