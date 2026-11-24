import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { formatDurationMinutesSeconds } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatHumanDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const day = pad(d.getDate());
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
}

function formatHumanDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

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
        "Time Taken": att && att.status === "COMPLETED" ? formatDurationMinutesSeconds(att.timeTakenSeconds) : "N/A",
        "Date of Registration": formatHumanDate(c.createdAt),
        "Attempt Submission Time": formatHumanDateTime(att?.submittedAt),
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
