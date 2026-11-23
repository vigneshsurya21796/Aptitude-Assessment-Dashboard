import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { candidateId: string } }) {
  try {
    const { candidateId } = params;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        attempt: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    if (!candidate.attempt) {
      return NextResponse.json({
        candidate,
        attempt: null,
        breakdown: [],
      });
    }

    const attempt = candidate.attempt;
    const questionOrder: string[] = JSON.parse(attempt.questionOrder || "[]");
    const answers: Record<string, { selectedOption: string | null; markedForReview: boolean }> = JSON.parse(
      attempt.answers || "{}"
    );

    const questions = await prisma.question.findMany({
      where: { id: { in: questionOrder } },
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const breakdown = questionOrder.map((qId, index) => {
      const q = questionMap.get(qId);
      const selected = answers[qId]?.selectedOption || null;
      const isCorrect = selected && q && selected.toUpperCase() === q.correctOption.toUpperCase();
      const isIncorrect = selected && q && selected.toUpperCase() !== q.correctOption.toUpperCase();
      const marksAwarded = isCorrect ? 2 : isIncorrect ? -1 : 0;

      return {
        questionNumber: index + 1,
        id: qId,
        text: q?.text || "",
        optionA: q?.optionA || "",
        optionB: q?.optionB || "",
        optionC: q?.optionC || "",
        optionD: q?.optionD || "",
        selectedOption: selected,
        correctOption: q?.correctOption || "",
        category: q?.category || "",
        difficulty: q?.difficulty || "",
        marksAwarded,
        status: isCorrect ? "CORRECT" : isIncorrect ? "INCORRECT" : "UNATTEMPTED",
      };
    });

    return NextResponse.json({
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        age: candidate.age,
        gender: candidate.gender,
        qualification: candidate.qualification,
        city: candidate.city,
        createdAt: candidate.createdAt,
      },
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        unattemptedCount: attempt.unattemptedCount,
        marksDeducted: attempt.marksDeducted,
        timeTakenSeconds: attempt.timeTakenSeconds,
        passed: attempt.passed,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      },
      breakdown,
    });
  } catch (error) {
    console.error("Error fetching candidate detail:", error);
    return NextResponse.json({ error: "Failed to retrieve candidate details." }, { status: 500 });
  }
}
