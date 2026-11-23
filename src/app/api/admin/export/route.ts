import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";

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

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        attempt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const exportRows = candidates.map((c, index) => {
      const att = c.attempt;
      return {
        "Index": index + 1,
        "Candidate Name": c.fullName,
        "Email ID": c.email,
        "Phone Number": c.phone,
        "Age": c.age,
        "Gender": c.gender || "N/A",
        "Highest Qualification": c.qualification,
        "City": c.city || "N/A",
        "Test Status": att ? att.status : "NOT_STARTED",
        "Net Score (Max 20)": att && att.status === "COMPLETED" ? att.score : "N/A",
        "Percentage (%)": att && att.status === "COMPLETED" ? `${att.percentage}%` : "N/A",
        "Result": att && att.status === "COMPLETED" ? (att.passed ? "PASS" : "FAIL") : "N/A",
        "Correct Count": att && att.status === "COMPLETED" ? att.correctCount : "N/A",
        "Incorrect Count": att && att.status === "COMPLETED" ? att.incorrectCount : "N/A",
        "Unattempted Count": att && att.status === "COMPLETED" ? att.unattemptedCount : "N/A",
        "Marks Deducted": att && att.status === "COMPLETED" ? att.marksDeducted : "N/A",
        "Time Taken (Seconds)": att && att.status === "COMPLETED" ? att.timeTakenSeconds : "N/A",
        "Date of Registration": c.createdAt.toISOString().split("T")[0],
        "Attempt Submission Time": att?.submittedAt ? att.submittedAt.toISOString() : "N/A",
      };
    });

    const csvString = Papa.unparse(exportRows);

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aptitude_assessment_results_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate CSV export." }, { status: 500 });
  }
}
