import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const { attemptId } = params;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required." }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        candidate: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Assessment attempt not found." }, { status: 404 });
    }

    if (attempt.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Assessment is still in progress.", status: attempt.status },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.findFirst();
    const passThreshold = settings?.passPercentage ?? 60.0;

    // Load question details for result analysis
    const questionOrder: string[] = JSON.parse(attempt.questionOrder);
    const answers: Record<string, { selectedOption: string | null; markedForReview: boolean }> = JSON.parse(
      attempt.answers || "{}"
    );

    const questions = await prisma.question.findMany({
      where: { id: { in: questionOrder } },
      select: {
        id: true,
        text: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        correctOption: true,
        category: true,
        difficulty: true,
      },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const reviewItems = questionOrder.map((qId, index) => {
      const q = questionMap.get(qId);
      const selected = answers[qId]?.selectedOption || null;
      const isCorrect = selected && q && selected.toUpperCase() === q.correctOption.toUpperCase();
      const isIncorrect = selected && q && selected.toUpperCase() !== q.correctOption.toUpperCase();
      const marksAwarded = isCorrect ? 2 : isIncorrect ? -1 : 0;

      return {
        questionNumber: index + 1,
        id: qId,
        text: q?.text || "",
        options: {
          A: q?.optionA || "",
          B: q?.optionB || "",
          C: q?.optionC || "",
          D: q?.optionD || "",
        },
        category: q?.category || "",
        difficulty: q?.difficulty || "",
        selectedOption: selected,
        correctOption: q?.correctOption || "",
        marksAwarded,
        status: isCorrect ? "CORRECT" : isIncorrect ? "INCORRECT" : "UNATTEMPTED",
      };
    });

    return NextResponse.json({
      attemptId: attempt.id,
      candidate: {
        fullName: attempt.candidate.fullName,
        email: attempt.candidate.email,
        qualification: attempt.candidate.qualification,
        phone: attempt.candidate.phone,
        city: attempt.candidate.city,
      },
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unattemptedCount: attempt.unattemptedCount,
      marksDeducted: attempt.marksDeducted,
      timeTakenSeconds: attempt.timeTakenSeconds,
      passed: attempt.passed,
      passPercentage: passThreshold,
      maxPossibleScore: 20,
      totalQuestions: 10,
      reviewItems,
    });
  } catch (error) {
    console.error("Error fetching assessment result:", error);
    return NextResponse.json({ error: "Failed to load assessment results." }, { status: 500 });
  }
}
