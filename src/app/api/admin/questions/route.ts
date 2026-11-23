import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    const activeCount = questions.filter((q) => q.isActive).length;

    return NextResponse.json({
      questions,
      activeCount,
      isExactLimitMet: activeCount === 10,
      limitWarning:
        activeCount < 10
          ? `Warning: Only ${activeCount}/10 active questions configured. Candidates cannot start the assessment until exactly 10 active questions are present.`
          : null,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to load question bank." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, optionA, optionB, optionC, optionD, correctOption, category, difficulty, isActive } =
      body;

    if (!text || !optionA || !optionB || !optionC || !optionD || !correctOption || !category || !difficulty) {
      return NextResponse.json({ error: "All question fields are required." }, { status: 400 });
    }

    if (!["A", "B", "C", "D"].includes(correctOption.toUpperCase())) {
      return NextResponse.json({ error: "Correct option must be A, B, C, or D." }, { status: 400 });
    }

    const shouldBeActive = isActive !== undefined ? Boolean(isActive) : true;

    // Hard Guardrail: Enforce max 10 active questions
    if (shouldBeActive) {
      const activeCount = await prisma.question.count({ where: { isActive: true } });
      if (activeCount >= 10) {
        return NextResponse.json(
          {
            error:
              "Strict Limit Enforced: Maximum 10 active questions allowed. You must deactivate or delete an existing active question before adding a new active one.",
          },
          { status: 400 }
        );
      }
    }

    const created = await prisma.question.create({
      data: {
        text: text.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctOption: correctOption.toUpperCase(),
        category,
        difficulty,
        isActive: shouldBeActive,
      },
    });

    return NextResponse.json({ success: true, question: created });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Failed to create question." }, { status: 500 });
  }
}
