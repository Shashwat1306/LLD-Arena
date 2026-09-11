import { prisma } from "@/lib/prisma"
import type { EvaluationStrategy } from "./EvaluationStrategy"

const MIN_SOLUTION_LENGTH = 50

export class AttemptService {
  constructor(private readonly evaluator: EvaluationStrategy) {}

  async submit(
    problemId: string,
    sessionId: string,
    solutionText: string,
  ): Promise<{ attemptId: string; status: string }> {
    // Validate minimum length
    if (solutionText.trim().length < MIN_SOLUTION_LENGTH) {
      throw new Error(
        `Solution must be at least ${MIN_SOLUTION_LENGTH} characters long.`,
      )
    }

    // Fetch problem from DB
    const problem = await prisma.problem.findUniqueOrThrow({
      where: { id: problemId },
    })

    // Create attempt with PENDING status
    const attempt = await prisma.attempt.create({
      data: {
        problemId,
        sessionId,
        solutionText,
        status: "PENDING",
      },
    })

    try {
      // Run AI evaluation
      const feedback = await this.evaluator.evaluate(
        {
          title: problem.title,
          description: problem.description,
          requirements: problem.requirements as string[],
        },
        { solutionText },
      )

      // Persist feedback
      await prisma.feedback.create({
        data: {
          attemptId: attempt.id,
          abstractionScore:      feedback.scores.abstraction,
          responsibilitiesScore: feedback.scores.responsibilities,
          relationshipsScore:    feedback.scores.relationships,
          tradeoffsScore:        feedback.scores.tradeoffs,
          strengths:             feedback.strengths,
          improvements:          feedback.improvements,
          overallVerdict:        feedback.overallVerdict,
        },
      })

      // Mark attempt as EVALUATED
      await prisma.attempt.update({
        where: { id: attempt.id },
        data: { status: "EVALUATED" },
      })

      return { attemptId: attempt.id, status: "EVALUATED" }
    } catch (error) {
      // Mark attempt as FAILED and rethrow
      await prisma.attempt.update({
        where: { id: attempt.id },
        data: { status: "FAILED" },
      })
      throw error
    }
  }
}