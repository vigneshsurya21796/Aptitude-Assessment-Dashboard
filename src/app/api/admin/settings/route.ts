import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          testDurationMinutes: 15,
          passPercentage: 60.0,
        },
      });
    }

    const activeQuestionsCount = await prisma.question.count({
      where: { isActive: true },
    });
    const totalQuestionsCount = await prisma.question.count();

    return NextResponse.json({
      settings: {
        testDurationMinutes: settings.testDurationMinutes,
        passPercentage: settings.passPercentage,
        updatedAt: settings.updatedAt,
      },
      activeQuestionsCount,
      totalQuestionsCount,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to retrieve settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { testDurationMinutes, passPercentage } = body;

    const duration = parseInt(String(testDurationMinutes), 10);
    const passThreshold = parseFloat(String(passPercentage));

    if (isNaN(duration) || duration < 5 || duration > 120) {
      return NextResponse.json(
        { error: "Test duration must be between 5 and 120 minutes." },
        { status: 400 }
      );
    }

    if (isNaN(passThreshold) || passThreshold < 0 || passThreshold > 100) {
      return NextResponse.json(
        { error: "Pass percentage threshold must be between 0% and 100%." },
        { status: 400 }
      );
    }

    let existing = await prisma.settings.findFirst();
    let updated;

    if (existing) {
      updated = await prisma.settings.update({
        where: { id: existing.id },
        data: {
          testDurationMinutes: duration,
          passPercentage: passThreshold,
        },
      });
    } else {
      updated = await prisma.settings.create({
        data: {
          id: 1,
          testDurationMinutes: duration,
          passPercentage: passThreshold,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Assessment parameters updated successfully.",
      settings: updated,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update assessment parameters." }, { status: 500 });
  }
}
