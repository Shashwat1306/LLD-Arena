# Design Note — LLD Practice Platform

---

## 1. MVP Scope

LLD Arena is built as a **monolithic Next.js 15 application** using the App Router. The monolith is the right architectural choice for an MVP — it eliminates operational complexity and keeps the codebase navigable without sacrificing the ability to extract services later.

**What the MVP delivers:**

- Browse a curated set of LLD problems with difficulty ratings
- Read problem requirements and write a text-based solution
- Submit for AI evaluation — no account required
- Receive dimensional feedback: four scores (1–5 each), a list of strengths, a list of improvements, and an overall verdict paragraph
- View the history of all past attempts for the current browser session

**What is intentionally out of scope:**

- User authentication
- Diagram-based submissions
- Asynchronous / background evaluation
- Admin tooling for problem management

**Identity model:** learners are identified by a UUID generated on first visit and stored in `localStorage` under the key `lld_session_id`. This provides a personal history view without the friction of sign-up.

---

## 2. User Flow

```
Problem List
    │
    ▼
Select Problem
    │
    ▼
Read Title + Description + Requirements
    │
    ▼
Write Solution (textarea, min 50 chars)
    │
    ▼
Submit
    │
    ├─── Validation fails (< 50 chars) ──► Show error inline, stay on page
    │
    ▼
POST /api/attempts  →  AttemptService.submit()
    │
    ├─── Gemini evaluation fails ──► Attempt marked FAILED, error shown to user
    │
    ▼
Redirect to /attempts/[id]
    │
    ▼
View Feedback
    ├── 4 score bars (abstraction / responsibilities / relationships / tradeoffs)
    ├── Strengths list (green ✓)
    ├── Improvements list (amber ⚠)
    └── Overall verdict paragraph
    │
    ▼
Try Again  ──►  Back to problem editor (pre-filled blank)
    or
Back to Problems  ──►  Problem List
```

---

## 3. Important Classes and Interfaces

### Domain Models

```
Problem
  ├── id: String (cuid)
  ├── title: String
  ├── description: String
  ├── requirements: String[]
  ├── difficulty: Difficulty (EASY | MEDIUM | HARD)
  └── attempts: Attempt[]

Attempt
  ├── id: String (cuid)
  ├── problemId: String  →  Problem
  ├── sessionId: String
  ├── solutionText: String
  ├── status: AttemptStatus (PENDING | EVALUATED | FAILED)
  ├── submittedAt: DateTime
  └── feedback: Feedback?

Feedback
  ├── id: String (cuid)
  ├── attemptId: String  →  Attempt (unique)
  ├── abstractionScore: Int      (1–5)
  ├── responsibilitiesScore: Int (1–5)
  ├── relationshipsScore: Int    (1–5)
  ├── tradeoffsScore: Int        (1–5)
  ├── strengths: String[]
  ├── improvements: String[]
  └── overallVerdict: String
```

### Evaluation Design — Strategy Pattern

The evaluation concern is isolated behind an interface so that the submission orchestration is independent of any specific AI provider.

```
«interface»
EvaluationStrategy
  └── evaluate(problem: ProblemContext, attempt: AttemptContext): Promise<FeedbackResult>
          │
          ├── GeminiEvaluationStrategy   (current — uses gemini-3.6-flash)
          └── RuleBasedEvaluationStrategy (future extension point)

AttemptService
  └── constructor(evaluator: EvaluationStrategy)
  └── submit(problemId, sessionId, solutionText): Promise<{ attemptId, status }>
```

`AttemptService` depends on the `EvaluationStrategy` interface only. Swapping Gemini for another model — or injecting a mock in tests — requires zero changes to `AttemptService`.

### AttemptService Submission Lifecycle

```
submit(problemId, sessionId, solutionText)
  │
  ├── 1. Validate: solutionText.trim().length >= 50
  │         └── throws Error if too short (no DB writes)
  │
  ├── 2. prisma.problem.findUniqueOrThrow({ where: { id: problemId } })
  │
  ├── 3. prisma.attempt.create({ status: "PENDING", ... })
  │
  ├── 4. evaluator.evaluate(problem, { solutionText })
  │         └── on throw ──► prisma.attempt.update({ status: "FAILED" })
  │                          rethrow original error
  │
  ├── 5. prisma.feedback.create({ attemptId, scores, strengths, ... })
  │
  └── 6. prisma.attempt.update({ status: "EVALUATED" })
         return { attemptId, status: "EVALUATED" }
```

---

## 4. Evaluation Approach

### Deterministic checks (instant, always applied)

| Check | Behaviour |
|---|---|
| Empty / whitespace-only submission | Rejected before any DB write |
| Solution under 50 characters | Rejected with user-facing error message |
| Attempt status lifecycle | PENDING → EVALUATED or FAILED, never left in PENDING |

### LLM evaluation (Gemini 3.6 Flash)

The LLM is used only where reasoning is required — evaluating the quality of a software design cannot be reduced to keyword matching or rule-based heuristics.

Gemini is asked to produce:
- A score from 1–5 for each of: **abstraction**, **responsibilities**, **relationships**, **tradeoffs**
- A list of **strengths** (what the design does well)
- A list of **improvements** (specific, actionable suggestions)
- An **overall verdict** paragraph

The response is requested as strict raw JSON with no markdown. A `stripMarkdown()` helper defensively strips any accidental backtick wrappers before `JSON.parse()`.

### Why this split

Deterministic checks are instant and reliable — they should not involve an API call. The LLM is invoked only for the part of the problem that genuinely requires understanding: evaluating design quality across four principled dimensions. This keeps latency low for validation failures and cost proportional to actual evaluation work.

### Note on non-determinism

LLM evaluation is probabilistic by nature. The same solution may receive slightly different scores across submissions. This is acceptable for a practice platform where the goal is directional feedback, not a precise grade. The model is prompted with a system instruction and a structured schema to minimise variance. Where possible, temperature is kept at 0 (Gemini's default for structured output requests).

---

## 5. Key Trade-offs

| Decision | Choice Made | Reason |
|---|---|---|
| **Authentication** | Skipped — `sessionId` in `localStorage` | Auth adds friction and infrastructure without improving the evaluation experience. History loss on cache clear is acceptable for an MVP. |
| **Submission format** | Text only | Diagram parsing (image-to-UML) adds significant complexity. Text is sufficient for Gemini to assess design quality meaningfully. |
| **Sync vs async evaluation** | Synchronous | Gemini responds in 2–10s, well within acceptable UX range. A job queue (BullMQ + Redis) would add substantial operational complexity beyond scope. |
| **Monolith vs microservices** | Monolith (Next.js) | Right call for MVP scale. All code in one repo, one deploy. Explicit recommendation in the brief. |
| **Score storage: columns vs JSON blob** | Separate integer columns | Each dimension (`abstractionScore` etc.) is a first-class queryable field. Future analytics (e.g. "attempts ordered by abstraction score") are a plain `ORDER BY` rather than a JSON operator. |
| **Retry logic on evaluation failure** | None — `FAILED` status only | Retry queues are out of scope. Marking attempts `FAILED` is honest, visible, and leaves a clear extension point. Users can resubmit. |

---

## 6. How It Handles Evaluation Failure

When the Gemini API call fails (network error, quota exceeded, malformed response):

1. `AttemptService` catches the error in the `try/catch` wrapping the evaluation call
2. `prisma.attempt.update({ status: "FAILED" })` is called immediately
3. The original error is rethrown to the API route handler
4. The route returns a `500` response with the error message
5. The client shows a user-facing error with an option to retry

**No partial feedback is saved.** The `Feedback` record is only created after a successful evaluation. An attempt in `FAILED` state has no linked `Feedback`.

**No retry queue.** This is an intentional scope boundary. The `FAILED` status is a clear signal to the user, and resubmission is one button click away. Adding retry infrastructure (job queue, worker process, dead-letter handling) would be the natural next step for a production version.

---

## 7. Extensibility

The architecture is designed to absorb the most likely future changes without structural surgery:

| Future requirement | How it's handled today |
|---|---|
| **New AI evaluator** (e.g. GPT-4o, Claude) | Implement `EvaluationStrategy`, inject into `AttemptService`. No other changes. |
| **Diagram-based submissions** | Extend `Attempt` with a `diagramUrl` field; update `AttemptContext` in the strategy interface to carry it. |
| **Async / background evaluation** | Wrap `AttemptService.submit()` with a job queue. The domain logic is unchanged — the queue just calls `submit()` instead of the API route. |
| **Per-dimension analytics** | Separate score columns already support `ORDER BY abstractionScore DESC` and similar queries with no schema change. |
| **Multiple evaluators per attempt** | The strategy interface returns a `FeedbackResult`; storing results from multiple strategies is a schema extension (add `evaluatorId` to `Feedback`). |
| **Problem authoring UI** | Add a protected `/admin` route that calls `prisma.problem.create()`. Domain model is already complete. |

