import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required." }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { attempt: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate record not found." }, { status: 404 });
    }

    // Check if attempt already exists
    if (candidate.attempt) {
      if (candidate.attempt.status === "COMPLETED") {
        return NextResponse.json(
          {
            error: "Assessment already completed. Additional attempts are not permitted.",
            attemptId: candidate.attempt.id,
          },
          { status: 409 }
        );
      }
      // Resume in-progress attempt
      return NextResponse.json({
        success: true,
        attemptId: candidate.attempt.id,
        resumed: true,
        startedAt: candidate.attempt.startedAt,
      });
    }

    // Ensure at least 10 active questions
    const activeQuestions = await prisma.question.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (activeQuestions.length < 10) {
      return NextResponse.json(
        {
          error: `Assessment cannot start: minimum 10 active questions required (currently ${activeQuestions.length}).`,
        },
        { status: 400 }
      );
    }

    // Select 10 questions and shuffle them per candidate
    const shuffledQuestionIds = shuffleArray(activeQuestions.map((q) => q.id)).slice(0, 10);

    const initialAnswers: Record<string, { selectedOption: string | null; markedForReview: boolean }> = {};
    for (const qId of shuffledQuestionIds) {
      initialAnswers[qId] = { selectedOption: null, markedForReview: false };
    }

    const newAttempt = await prisma.attempt.create({
      data: {
        candidateId,
        startedAt: new Date(),
        status: "IN_PROGRESS",
        questionOrder: JSON.stringify(shuffledQuestionIds),
        answers: JSON.stringify(initialAnswers),
        unattemptedCount: 10,
      },
    });

    const settings = await prisma.settings.findFirst();

    return NextResponse.json({
      success: true,
      attemptId: newAttempt.id,
      startedAt: newAttempt.startedAt,
      durationMinutes: settings?.testDurationMinutes ?? 15,
    });
  } catch (error) {
    console.error("Test start error:", error);
    return NextResponse.json({ error: "Failed to initialize test attempt." }, { status: 500 });
  }
}
