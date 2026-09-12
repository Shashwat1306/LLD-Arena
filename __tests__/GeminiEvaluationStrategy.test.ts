import { describe, it, expect, vi, beforeEach } from "vitest"
import type { FeedbackResult } from "@/lib/domain/EvaluationStrategy"

// ── Hoist the mock fn so it is available when vi.mock factory runs ─────────
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}))

// GoogleGenerativeAI must be a regular function (not arrow) to support `new`
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: function () {
    return {
      getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
    }
  },
}))

import { GeminiEvaluationStrategy } from "@/lib/domain/GeminiEvaluationStrategy"

// ── Fixtures ───────────────────────────────────────────────────────────────
const VALID_FEEDBACK: FeedbackResult = {
  scores: { abstraction: 4, responsibilities: 3, relationships: 4, tradeoffs: 3 },
  strengths: ["Good encapsulation", "Clear interfaces"],
  improvements: ["Add more comments", "Consider SOLID principles"],
  overallVerdict: "A solid attempt with room for improvement.",
}

const PROBLEM = {
  title: "Design a Parking Lot",
  description: "Design a parking lot system.",
  requirements: ["Support multiple vehicle types"],
}

const ATTEMPT = { solutionText: "I would use a ParkingLot class with floors and spots." }

function mockResponse(text: string) {
  mockGenerateContent.mockResolvedValueOnce({
    response: { text: () => text },
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("GeminiEvaluationStrategy", () => {
  let strategy: GeminiEvaluationStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    strategy = new GeminiEvaluationStrategy("test-api-key")
  })

  it("should parse a valid raw JSON response correctly", async () => {
    mockResponse(JSON.stringify(VALID_FEEDBACK))

    const result = await strategy.evaluate(PROBLEM, ATTEMPT)

    expect(result.scores.abstraction).toBe(4)
    expect(result.scores.responsibilities).toBe(3)
    expect(result.strengths).toEqual(["Good encapsulation", "Clear interfaces"])
    expect(result.improvements).toEqual(["Add more comments", "Consider SOLID principles"])
    expect(result.overallVerdict).toBe("A solid attempt with room for improvement.")
  })

  it("should strip ```json ... ``` markdown wrapper and parse correctly", async () => {
    mockResponse("```json\n" + JSON.stringify(VALID_FEEDBACK) + "\n```")

    const result = await strategy.evaluate(PROBLEM, ATTEMPT)

    expect(result.scores.abstraction).toBe(4)
    expect(result.overallVerdict).toBe("A solid attempt with room for improvement.")
  })

  it("should strip plain ``` ... ``` wrapper and parse correctly", async () => {
    mockResponse("```\n" + JSON.stringify(VALID_FEEDBACK) + "\n```")

    const result = await strategy.evaluate(PROBLEM, ATTEMPT)

    expect(result.scores.tradeoffs).toBe(3)
  })

  it("should throw a descriptive error on malformed JSON response", async () => {
    mockResponse("This is not valid JSON at all.")

    await expect(strategy.evaluate(PROBLEM, ATTEMPT)).rejects.toThrow(
      "GeminiEvaluationStrategy: failed to parse model response as JSON.",
    )
  })
})