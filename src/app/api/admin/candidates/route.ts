import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all"; // all | pass | fail | in_progress
    const sortBy = searchParams.get("sortBy") || "date"; // date | score
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = 10;

    // Build filter conditions
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status === "pass") {
      where.attempt = { status: "COMPLETED", passed: true };
    } else if (status === "fail") {
      where.attempt = { status: "COMPLETED", passed: false };
    } else if (status === "in_progress") {
      where.attempt = { status: "IN_PROGRESS" };
    }

    // Determine ordering
    let orderBy: any = {};
    if (sortBy === "score") {
      orderBy = {
        attempt: {
          score: sortOrder,
        },
      };
    } else {
      orderBy = {
        createdAt: sortOrder,
      };
    }

    const [total, candidates] = await Promise.all([
      prisma.candidate.count({ where }),
      prisma.candidate.findMany({
        where,
        include: {
          attempt: {
            select: {
              id: true,
              status: true,
              score: true,
              percentage: true,
              correctCount: true,
              incorrectCount: true,
              unattemptedCount: true,
              timeTakenSeconds: true,
              passed: true,
              submittedAt: true,
              startedAt: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    const formattedCandidates = candidates.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      age: c.age,
      qualification: c.qualification,
      city: c.city,
      registeredAt: c.createdAt,
      attempt: c.attempt
        ? {
            id: c.attempt.id,
            status: c.attempt.status,
            score: c.attempt.score,
            percentage: c.attempt.percentage,
            passed: c.attempt.passed,
            timeTakenSeconds: c.attempt.timeTakenSeconds,
            submittedAt: c.attempt.submittedAt,
            startedAt: c.attempt.startedAt,
          }
        : null,
    }));

    return NextResponse.json({
      candidates: formattedCandidates,
      total,
      page,
      totalPages,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching candidate list:", error);
    return NextResponse.json({ error: "Failed to retrieve candidate results." }, { status: 500 });
  }
}
