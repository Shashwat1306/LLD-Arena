import { GoogleGenerativeAI } from "@google/generative-ai"
import type {
  EvaluationStrategy,
  FeedbackResult,
  ProblemContext,
  AttemptContext,
} from "./EvaluationStrategy"

const SYSTEM_PROMPT = `You are an expert software architect evaluating Low-Level Design (LLD) solutions.
Evaluate the provided solution strictly and return ONLY a raw JSON object — no markdown, no backticks, no explanation.

Score the solution on each dimension from 1 (very poor) to 5 (excellent):
- abstraction: How well are classes/interfaces abstracted and encapsulated?
- responsibilities: Are responsibilities clearly separated (Single Responsibility)?
- relationships: Are relationships (associations, dependencies, inheritance) appropriate?
- tradeoffs: Are design tradeoffs acknowledged and reasonable?

Return exactly this JSON shape:
{
  "scores": {
    "abstraction": <1-5>,
    "responsibilities": <1-5>,
    "relationships": <1-5>,
    "tradeoffs": <1-5>
  },
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "overallVerdict": "<one concise paragraph verdict>"
}`

function buildUserPrompt(problem: ProblemContext, attempt: AttemptContext): string {
  return `## Problem
Title: ${problem.title}

Description:
${problem.description}

Requirements:
${problem.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Candidate Solution
${attempt.solutionText}`
}

function stripMarkdown(raw: string): string {
  // Remove optional ```json ... ``` or ``` ... ``` wrappers
  return raw.replace(/^`{1,3}(?:json)?\s*/i, "").replace(/\s*`{1,3}$/, "").trim()
}

export class GeminiEvaluationStrategy implements EvaluationStrategy {
  private readonly model

  constructor(apiKey: string = process.env.GEMINI_API_KEY ?? "") {
    const genAI = new GoogleGenerativeAI(apiKey)
    this.model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0 }
    })
  }

  async evaluate(
    problem: ProblemContext,
    attempt: AttemptContext,
  ): Promise<FeedbackResult> {
    const result = await this.model.generateContent(buildUserPrompt(problem, attempt))
    const raw = result.response.text()
    const cleaned = stripMarkdown(raw)

    let parsed: FeedbackResult
    try {
      parsed = JSON.parse(cleaned) as FeedbackResult
    } catch (err) {
      throw new Error(
        `GeminiEvaluationStrategy: failed to parse model response as JSON.\nRaw: ${raw}\nError: ${String(err)}`,
      )
    }

    return parsed
  }
}
