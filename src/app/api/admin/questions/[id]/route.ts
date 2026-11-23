import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { text, optionA, optionB, optionC, optionD, correctOption, category, difficulty, isActive } =
      body;

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    // Hard Guardrail: If activating question when it was previously inactive
    if (isActive === true && !existing.isActive) {
      const activeCount = await prisma.question.count({ where: { isActive: true } });
      if (activeCount >= 10) {
        return NextResponse.json(
          {
            error:
              "Strict Limit Enforced: Maximum 10 active questions allowed. Please deactivate an existing active question first.",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(text !== undefined && { text: text.trim() }),
        ...(optionA !== undefined && { optionA: optionA.trim() }),
        ...(optionB !== undefined && { optionB: optionB.trim() }),
        ...(optionC !== undefined && { optionC: optionC.trim() }),
        ...(optionD !== undefined && { optionD: optionD.trim() }),
        ...(correctOption !== undefined && { correctOption: correctOption.toUpperCase() }),
        ...(category !== undefined && { category }),
        ...(difficulty !== undefined && { difficulty }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json({ error: "Failed to update question." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Question deleted successfully." });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
  }
}
