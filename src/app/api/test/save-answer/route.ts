import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId, questionId, selectedOption, markedForReview } = body;

    if (!attemptId || !questionId) {
      return NextResponse.json({ error: "Attempt ID and Question ID are required." }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    if (attempt.status === "COMPLETED") {
      return NextResponse.json({ error: "Attempt is already submitted and locked." }, { status: 400 });
    }

    let answers: Record<string, { selectedOption: string | null; markedForReview: boolean }> = {};
    try {
      answers = JSON.parse(attempt.answers || "{}");
    } catch {
      answers = {};
    }

    const existing = answers[questionId] || { selectedOption: null, markedForReview: false };

    answers[questionId] = {
      selectedOption: selectedOption !== undefined ? selectedOption : existing.selectedOption,
      markedForReview: markedForReview !== undefined ? markedForReview : existing.markedForReview,
    };

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Failed to persist answer selection." }, { status: 500 });
  }
}
