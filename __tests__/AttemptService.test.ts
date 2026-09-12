import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock @/lib/prisma BEFORE importing AttemptService ─────────────────────
vi.mock("@/lib/prisma", () => ({
  prisma: {
    problem: {
      findUniqueOrThrow: vi.fn(),
    },
    attempt: {
      create: vi.fn(),
      update: vi.fn(),
    },
    feedback: {
      create: vi.fn(),
    },
  },
}))

import { AttemptService } from "@/lib/domain/AttemptService"
import type { EvaluationStrategy, FeedbackResult } from "@/lib/domain/EvaluationStrategy"
import { prisma } from "@/lib/prisma"

// ── Shared fixtures ────────────────────────────────────────────────────────
const MOCK_PROBLEM = {
  id: "problem-1",
  title: "Design a Parking Lot",
  description: "Design a parking lot system.",
  requirements: ["Support multiple vehicle types"],
  difficulty: "MEDIUM" as const,
  createdAt: new Date(),
}

const MOCK_ATTEMPT = {
  id: "attempt-1",
  problemId: "problem-1",
  sessionId: "session-abc",
  solutionText: "A".repeat(60),
  status: "PENDING" as const,
  submittedAt: new Date(),
}

const MOCK_FEEDBACK: FeedbackResult = {
  scores: { abstraction: 4, responsibilities: 3, relationships: 4, tradeoffs: 3 },
  strengths: ["Good encapsulation"],
  improvements: ["More documentation"],
  overallVerdict: "Solid attempt.",
}

// ── Helpers ────────────────────────────────────────────────────────────────
function makeMockEvaluator(overrides?: Partial<EvaluationStrategy>): EvaluationStrategy {
  return {
    evaluate: vi.fn().mockResolvedValue(MOCK_FEEDBACK),
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("AttemptService.submit()", () => {
  let service: AttemptService

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(prisma.problem.findUniqueOrThrow).mockResolvedValue(MOCK_PROBLEM)
    vi.mocked(prisma.attempt.create).mockResolvedValue(MOCK_ATTEMPT)
    vi.mocked(prisma.attempt.update).mockResolvedValue({ ...MOCK_ATTEMPT, status: "EVALUATED" as const })
    vi.mocked(prisma.feedback.create).mockResolvedValue({
      id: "feedback-1",
      attemptId: "attempt-1",
      abstractionScore: 4,
      responsibilitiesScore: 3,
      relationshipsScore: 4,
      tradeoffsScore: 3,
      strengths: ["Good encapsulation"],
      improvements: ["More documentation"],
      overallVerdict: "Solid attempt.",
      createdAt: new Date(),
    })

    service = new AttemptService(makeMockEvaluator())
  })

  it("should throw if solutionText is less than 50 characters", async () => {
    await expect(
      service.submit("problem-1", "session-abc", "Too short"),
    ).rejects.toThrow("Solution must be at least 50 characters long.")
  })

  it("should not call prisma at all when solution is too short", async () => {
    await expect(
      service.submit("problem-1", "session-abc", "Short"),
    ).rejects.toThrow()

    expect(prisma.problem.findUniqueOrThrow).not.toHaveBeenCalled()
    expect(prisma.attempt.create).not.toHaveBeenCalled()
  })

  it("should create the attempt with PENDING status initially", async () => {
    await service.submit("problem-1", "session-abc", "A".repeat(60))

    expect(prisma.attempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        problemId: "problem-1",
        sessionId: "session-abc",
        status: "PENDING",
      }),
    })
  })

  it("should update attempt to EVALUATED on successful evaluation", async () => {
    await service.submit("problem-1", "session-abc", "A".repeat(60))

    expect(prisma.attempt.update).toHaveBeenCalledWith({
      where: { id: MOCK_ATTEMPT.id },
      data: { status: "EVALUATED" },
    })
  })

  it("should save feedback with correct scores after evaluation", async () => {
    await service.submit("problem-1", "session-abc", "A".repeat(60))

    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attemptId: MOCK_ATTEMPT.id,
        abstractionScore: MOCK_FEEDBACK.scores.abstraction,
        responsibilitiesScore: MOCK_FEEDBACK.scores.responsibilities,
        relationshipsScore: MOCK_FEEDBACK.scores.relationships,
        tradeoffsScore: MOCK_FEEDBACK.scores.tradeoffs,
        strengths: MOCK_FEEDBACK.strengths,
        improvements: MOCK_FEEDBACK.improvements,
        overallVerdict: MOCK_FEEDBACK.overallVerdict,
      }),
    })
  })

  it("should update attempt to FAILED if evaluator throws", async () => {
    const failingEvaluator = makeMockEvaluator({
      evaluate: vi.fn().mockRejectedValue(new Error("Gemini API unreachable")),
    })
    service = new AttemptService(failingEvaluator)

    await expect(
      service.submit("problem-1", "session-abc", "A".repeat(60)),
    ).rejects.toThrow("Gemini API unreachable")

    expect(prisma.attempt.update).toHaveBeenCalledWith({
      where: { id: MOCK_ATTEMPT.id },
      data: { status: "FAILED" },
    })
  })

  it("should rethrow the original error after marking as FAILED", async () => {
    const originalError = new Error("Network timeout")
    const failingEvaluator = makeMockEvaluator({
      evaluate: vi.fn().mockRejectedValue(originalError),
    })
    service = new AttemptService(failingEvaluator)

    await expect(
      service.submit("problem-1", "session-abc", "A".repeat(60)),
    ).rejects.toBe(originalError)
  })

  it("should not save feedback if evaluator throws", async () => {
    const failingEvaluator = makeMockEvaluator({
      evaluate: vi.fn().mockRejectedValue(new Error("fail")),
    })
    service = new AttemptService(failingEvaluator)

    await expect(
      service.submit("problem-1", "session-abc", "A".repeat(60)),
    ).rejects.toThrow()

    expect(prisma.feedback.create).not.toHaveBeenCalled()
  })
})