import { AttemptService } from "@/lib/domain/AttemptService"
import { GeminiEvaluationStrategy } from "@/lib/domain/GeminiEvaluationStrategy"

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      problemId?: string
      sessionId?: string
      solutionText?: string
    }

    const { problemId, sessionId, solutionText } = body

    if (!problemId || !sessionId || !solutionText) {
      return Response.json(
        { error: "problemId, sessionId, and solutionText are required" },
        { status: 400 },
      )
    }

    const evaluator = new GeminiEvaluationStrategy()
    const service = new AttemptService(evaluator)

    const result = await service.submit(problemId, sessionId, solutionText)

    return Response.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed"
    console.error("[POST /api/attempts]", error)
    return Response.json({ error: message }, { status: 500 })
  }
}