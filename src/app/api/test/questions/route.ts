import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required." }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        candidate: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const settings = await prisma.settings.findFirst();
    const durationMinutes = settings?.testDurationMinutes ?? 15;
    const durationSeconds = durationMinutes * 60;
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);

    // If attempt is already completed
    if (attempt.status === "COMPLETED") {
      return NextResponse.json({
        isCompleted: true,
        attemptId: attempt.id,
      });
    }

    // Server-side timer expiry check (grace period: 15s)
    if (elapsedSeconds > durationSeconds + 15) {
      return NextResponse.json({
        expired: true,
        attemptId: attempt.id,
        message: "Test duration has elapsed. Submission required.",
      });
    }

    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
    const questionOrder: string[] = JSON.parse(attempt.questionOrder);

    // Fetch questions in the candidate's shuffled order
    // CRITICAL SECURITY GUARDRAIL: Never leak correctOption in candidate payload!
    const questionsFromDb = await prisma.question.findMany({
      where: {
        id: { in: questionOrder },
      },
      select: {
        id: true,
        text: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        category: true,
        difficulty: true,
      },
    });

    // Sort to match candidate's exact shuffled order
    const questionsMap = new Map(questionsFromDb.map((q) => [q.id, q]));
    const orderedQuestions = questionOrder.map((id) => questionsMap.get(id)).filter(Boolean);

    let parsedAnswers: Record<string, { selectedOption: string | null; markedForReview: boolean }> = {};
    try {
      parsedAnswers = JSON.parse(attempt.answers);
    } catch (e) {
      parsedAnswers = {};
    }

    return NextResponse.json({
      attemptId: attempt.id,
      candidate: attempt.candidate,
      questions: orderedQuestions,
      answers: parsedAnswers,
      startedAt: attempt.startedAt,
      durationMinutes,
      remainingSeconds,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching test questions:", error);
    return NextResponse.json({ error: "Failed to load assessment questions." }, { status: 500 });
  }
}
