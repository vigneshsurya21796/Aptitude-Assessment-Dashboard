import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalCandidates = await prisma.candidate.count();
    const completedAttempts = await prisma.attempt.findMany({
      where: { status: "COMPLETED" },
      select: {
        score: true,
        percentage: true,
        passed: true,
        timeTakenSeconds: true,
        correctCount: true,
        incorrectCount: true,
        unattemptedCount: true,
      },
    });

    const inProgressCount = await prisma.attempt.count({
      where: { status: "IN_PROGRESS" },
    });

    const testsCompleted = completedAttempts.length;

    let averageScore = 0;
    let passRate = 0;
    let highestScore = 0;
    let passCount = 0;
    let failCount = 0;

    // Score distribution buckets: <=0, 1-5, 6-10, 11-15, 16-20
    const distribution = {
      "<= 0": 0,
      "1 - 5": 0,
      "6 - 10": 0,
      "11 - 15": 0,
      "16 - 20": 0,
    };

    if (testsCompleted > 0) {
      let sumScore = 0;
      highestScore = completedAttempts[0].score;

      for (const a of completedAttempts) {
        sumScore += a.score;
        if (a.score > highestScore) highestScore = a.score;
        if (a.passed) passCount++;
        else failCount++;

        if (a.score <= 0) distribution["<= 0"]++;
        else if (a.score <= 5) distribution["1 - 5"]++;
        else if (a.score <= 10) distribution["6 - 10"]++;
        else if (a.score <= 15) distribution["11 - 15"]++;
        else distribution["16 - 20"]++;
      }

      averageScore = Math.round((sumScore / testsCompleted) * 10) / 10;
      passRate = Math.round((passCount / testsCompleted) * 1000) / 10;
    }

    const scoreDistributionChart = Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));

    const outcomeChart = [
      { name: "Passed", value: passCount, color: "#1B7A53" },
      { name: "Failed", value: failCount, color: "#C73838" },
      { name: "In Progress", value: inProgressCount, color: "#C78C18" },
    ];

    const activeQuestionsCount = await prisma.question.count({ where: { isActive: true } });
    const totalQuestionsCount = await prisma.question.count();

    return NextResponse.json({
      kpis: {
        totalCandidates,
        testsCompleted,
        inProgressCount,
        averageScore,
        passRate,
        highestScore: testsCompleted > 0 ? highestScore : 0,
        activeQuestionsCount,
        totalQuestionsCount,
      },
      charts: {
        scoreDistribution: scoreDistributionChart,
        outcomes: outcomeChart,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics." }, { status: 500 });
  }
}
