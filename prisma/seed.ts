import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Seed Default Admin Account
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@aptitude.com";
  const rawPassword = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@1234";
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
      },
    });
    console.log(`Created default admin: ${adminEmail}`);
  } else {
    await prisma.admin.update({
      where: { email: adminEmail },
      data: { passwordHash },
    });
    console.log(`Updated default admin password for: ${adminEmail}`);
  }

  // 2. Seed Default Settings
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        testDurationMinutes: 15,
        passPercentage: 60.0,
      },
    });
    console.log("Created default settings: 15 mins, 60% pass threshold.");
  }

  // 3. Seed 10 Corporate-Level Questions (3 Mandatory + 7 Original Multi-Step)
  const questionsData = [
    // Mandatory Question 1: Quantitative
    {
      text: "A subscription business plans a 20% price increase. What is the largest share of its customers it can lose before monthly revenue falls below today's level?",
      optionA: "16.7%",
      optionB: "20%",
      optionC: "15%",
      optionD: "18.3%",
      correctOption: "A",
      category: "Quantitative",
      difficulty: "Medium",
      isActive: true,
    },
    // Mandatory Question 2: Logical Reasoning
    {
      text: "Six client meetings (P, Q, R, S, T, U) are scheduled Monday to Saturday, one per day. S is on Wednesday. R is the day immediately before U, and U is not on Saturday. Q is later in the week than both P and T. T is not on Monday. Which of the following must be true?",
      optionA: "P is on Monday",
      optionB: "Q is on Saturday",
      optionC: "R is on Thursday",
      optionD: "T is on Tuesday",
      correctOption: "B",
      category: "Logical Reasoning",
      difficulty: "Hard",
    },
    // Mandatory Question 3: Verbal
    {
      text: "Choose the grammatically correct sentence for a project update.",
      optionA: "Neither the manager nor the analysts was aware of the change.",
      optionB: "Neither the analysts nor the manager were aware of the change.",
      optionC: "Neither the manager nor the analysts were aware of the change.",
      optionD: "Neither the manager or the analysts were aware of the change.",
      correctOption: "C",
      category: "Verbal",
      difficulty: "Easy",
    },
    // Original Question 4: Quantitative (SaaS Unit Economics)
    {
      text: "A B2B SaaS company reports a Customer Acquisition Cost (CAC) of $600 and a monthly churn rate of 2.5%. If the average customer generates $50 in recurring gross margin per month, what is the Lifetime Value to CAC (LTV : CAC) ratio?",
      optionA: "2.5 : 1",
      optionB: "3.33 : 1",
      optionC: "4.0 : 1",
      optionD: "1.8 : 1",
      correctOption: "B",
      category: "Quantitative",
      difficulty: "Medium",
    },
    // Original Question 5: Quantitative (Consulting Work Rate)
    {
      text: "An enterprise ERP implementation team has 4 senior consultants who complete a deployment in 15 business days. If 2 senior consultants are replaced by 4 junior consultants who produce output at exactly half the speed of seniors, how many business days will the deployment take?",
      optionA: "12 business days",
      optionB: "15 business days",
      optionC: "18 business days",
      optionD: "20 business days",
      correctOption: "B",
      category: "Quantitative",
      difficulty: "Medium",
    },
    // Original Question 6: Logical Reasoning (Sequential Scheduling)
    {
      text: "In a corporate restructuring initiative, five milestones (M1, M2, M3, M4, M5) must be scheduled from stage 1 to stage 5 under the following conditions: M2 occurs before M4; M1 and M5 have exactly one milestone scheduled between them; M3 cannot be in stage 1 or stage 5. If M5 is executed at stage 2, which milestone must be executed at stage 4?",
      optionA: "M1",
      optionB: "M2",
      optionC: "M3",
      optionD: "M4",
      correctOption: "A",
      category: "Logical Reasoning",
      difficulty: "Medium",
    },
    // Original Question 7: Logical Reasoning (Deductive Syllogism)
    {
      text: "Premise 1: All high-growth tech ventures either invest heavily in proprietary R&D or risk rapid market obsolescence. Premise 2: No enterprise that risks rapid market obsolescence secures Tier-1 institutional debt. Observation: Apex Robotics secured Tier-1 institutional debt. Which of the following conclusions must logically follow?",
      optionA: "If Apex Robotics is a high-growth tech venture, it must invest heavily in proprietary R&D.",
      optionB: "All firms that invest heavily in proprietary R&D secure Tier-1 institutional debt.",
      optionC: "Apex Robotics is guaranteed to be a profitable tech venture.",
      optionD: "No firm investing heavily in R&D ever faces supply chain disruption.",
      correctOption: "A",
      category: "Logical Reasoning",
      difficulty: "Hard",
    },
    // Original Question 8: Logical Reasoning (Board Selection)
    {
      text: "An investment committee reviews four strategic acquisitions: Alpha, Beta, Gamma, and Delta. Exactly two will be funded. If Alpha is funded, Beta must also be funded. If Gamma is funded, Beta is rejected. Delta has already been definitively rejected. Which two acquisitions are funded?",
      optionA: "Alpha and Beta",
      optionB: "Beta and Gamma",
      optionC: "Alpha and Gamma",
      optionD: "Gamma and Delta",
      correctOption: "A",
      category: "Logical Reasoning",
      difficulty: "Medium",
    },
    // Original Question 9: Verbal (Syntax & Modifier Placement)
    {
      text: "Select the sentence that maintains impeccable executive clarity and eliminates dangling or misplaced modifiers:",
      optionA: "Having finalized the quarterly financial audit, several critical discrepancies were highlighted by the lead comptroller.",
      optionB: "Having finalized the quarterly financial audit, the lead comptroller highlighted several critical discrepancies in the treasury report.",
      optionC: "The lead comptroller highlighted several critical discrepancies having finalized the quarterly financial audit in the treasury report.",
      optionD: "Finalized by the lead comptroller, several critical discrepancies appeared in the quarterly financial audit.",
      correctOption: "B",
      category: "Verbal",
      difficulty: "Easy",
    },
    // Original Question 10: Verbal (Executive Register & Concision)
    {
      text: "Identify the phrasing that best exemplifies an active, concise executive register without gratuitous nominalizations or corporate bloat:",
      optionA: "The executive steering committee arrived at a decision regarding the implementation of the cross-border restructuring plan.",
      optionB: "The executive steering committee decided to implement the cross-border restructuring plan.",
      optionC: "A determination was reached by the executive steering committee concerning the actionable execution of restructuring.",
      optionD: "The executive steering committee engaged in deliberate considerations resulting in the authorization for restructuring implementation.",
      correctOption: "B",
      category: "Verbal",
      difficulty: "Medium",
    },
  ];

  // Ensure active question count constraint
  const currentCount = await prisma.question.count();
  if (currentCount === 0) {
    for (const q of questionsData) {
      await prisma.question.create({
        data: {
          ...q,
          isActive: true,
        },
      });
    }
    console.log(`Seeded ${questionsData.length} corporate questions successfully.`);
  } else {
    console.log(`Question table already contains ${currentCount} records. Preserving existing entries.`);
  }

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
