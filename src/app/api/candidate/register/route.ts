import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Full Name: Letters and spaces only, 2-50 chars
const NAME_REGEX = /^[A-Za-z\s]{2,50}$/;
// Phone: strictly 10 digits
const PHONE_REGEX = /^\d{10}$/;
// Email: standard validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, age, phone, gender, qualification, city } = body;

    // Validate full name
    if (!fullName || typeof fullName !== "string" || !NAME_REGEX.test(fullName.trim())) {
      return NextResponse.json(
        { error: "Full Name must be 2-50 characters containing only letters and spaces." },
        { status: 400 }
      );
    }

    // Validate email
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return NextResponse.json(
        { error: "Please provide a valid, well-formed email address." },
        { status: 400 }
      );
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Validate age (integer between 18 and 60 inclusive)
    const parsedAge = parseInt(String(age), 10);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 60) {
      return NextResponse.json(
        { error: "Age must be an integer between 18 and 60 inclusive." },
        { status: 400 }
      );
    }

    // Validate phone (strictly 10 digits)
    if (!phone || typeof phone !== "string" || !PHONE_REGEX.test(phone.trim())) {
      return NextResponse.json(
        { error: "Phone number must be exactly 10 numeric digits." },
        { status: 400 }
      );
    }

    // Validate highest qualification
    const validQualifications = [
      "High School",
      "Diploma",
      "Bachelor's Degree",
      "Master's Degree",
      "PhD",
      "Other",
    ];
    if (!qualification || !validQualifications.includes(qualification)) {
      return NextResponse.json(
        { error: "Please select a valid highest qualification." },
        { status: 400 }
      );
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email: normalizedEmail },
      include: { attempt: true },
    });

    if (existingCandidate) {
      if (existingCandidate.attempt) {
        if (existingCandidate.attempt.status === "COMPLETED") {
          return NextResponse.json(
            {
              error:
                "This email has already completed an aptitude assessment. Each candidate is permitted strictly one assessment attempt.",
              attemptId: existingCandidate.attempt.id,
              alreadyCompleted: true,
            },
            { status: 409 }
          );
        } else {
          // If in progress, allow resume
          return NextResponse.json({
            success: true,
            candidateId: existingCandidate.id,
            email: existingCandidate.email,
            fullName: existingCandidate.fullName,
            activeAttemptId: existingCandidate.attempt.id,
            message: "Resuming existing active assessment attempt.",
          });
        }
      }

      // Update existing candidate details if no attempt was started yet
      const updatedCandidate = await prisma.candidate.update({
        where: { id: existingCandidate.id },
        data: {
          fullName: fullName.trim(),
          age: parsedAge,
          phone: phone.trim(),
          gender: gender || null,
          qualification,
          city: city?.trim() || null,
        },
      });

      return NextResponse.json({
        success: true,
        candidateId: updatedCandidate.id,
        email: updatedCandidate.email,
        fullName: updatedCandidate.fullName,
      });
    }

    // Create new candidate
    const newCandidate = await prisma.candidate.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        age: parsedAge,
        phone: phone.trim(),
        gender: gender || null,
        qualification,
        city: city?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      candidateId: newCandidate.id,
      email: newCandidate.email,
      fullName: newCandidate.fullName,
    });
  } catch (error: any) {
    console.error("Candidate registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration. Please try again." },
      { status: 500 }
    );
  }
}
