import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    const activeQuestionsCount = await prisma.question.count({
      where: { isActive: true },
    });

    const duration = settings?.testDurationMinutes ?? 15;
    const passThreshold = settings?.passPercentage ?? 60.0;

    const canStart = activeQuestionsCount >= 10;

    return NextResponse.json({
      testDurationMinutes: duration,
      passPercentage: passThreshold,
      totalQuestions: 10,
      activeQuestionsCount,
      canStart,
      marksScheme: {
        correct: "+2",
        incorrect: "-1",
        unattempted: "0",
        maxScore: 20,
      },
      warning: !canStart
        ? `Assessment temporarily unavailable: Only ${activeQuestionsCount} active questions configured. Minimum 10 required.`
        : null,
    });
  } catch (error) {
    console.error("Error fetching test instructions:", error);
    return NextResponse.json(
      { error: "Failed to retrieve assessment configuration." },
      { status: 500 }
    );
  }
}
