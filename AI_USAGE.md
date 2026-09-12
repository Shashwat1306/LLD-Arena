# AI Usage Log

This file documents every significant decision where AI assistance was used during development, including what was suggested, what was accepted or rejected, and why.

---

## 1. Strategy Pattern for Evaluation

**Decision:** `AttemptService` depends on an `EvaluationStrategy` interface rather than calling Gemini directly.

**AI involvement:** AI suggested extracting the evaluation concern into a Strategy interface to decouple the submission flow from any specific AI provider.

**Outcome: ✅ Accepted**

The suggestion directly addressed the extensibility requirement — swapping Gemini for another model (or a test double) requires zero changes to `AttemptService`. It also made the service unit-testable with a plain mock, without needing to stub HTTP calls.

---

## 2. Gemini Prompt Structure

**Decision:** The system prompt asks Gemini to score the solution on four named dimensions and return strict JSON with no markdown.

**AI involvement:** AI drafted the initial system prompt, including the instruction to return raw JSON only and the general structure of the response shape.

**Outcome: ✅ Accepted with modifications**

The base prompt structure and the "no markdown, no backticks" instruction were kept as-is. The four scoring dimensions were changed from generic software quality metrics (e.g. "readability", "correctness") to LLD-specific ones: **abstraction**, **responsibilities**, **relationships**, and **tradeoffs** — better aligned with what an interviewer would evaluate in a design round.

A `stripMarkdown()` helper was also added defensively, since models occasionally wrap JSON in fences despite explicit instructions.

---

## 3. Prisma Schema Design

**Decision:** Store the four feedback scores as individual integer columns (`abstractionScore`, `responsibilitiesScore`, `relationshipsScore`, `tradeoffsScore`) rather than a single `JSONB` column.

**AI involvement:** AI suggested the separate-fields approach as an alternative to a JSON blob, reasoning that it preserves queryability and type safety at the schema level.

**Outcome: ✅ Accepted**

Separate columns allow filtering or ordering attempts by any individual dimension using a plain SQL `WHERE` or `ORDER BY` — something that would require PostgreSQL JSON operators with a blob approach. The schema is slightly more verbose but the query ergonomics are significantly better, especially for a future leaderboard or analytics feature.

---

## 4. Error Handling Approach

**Decision:** On evaluation failure, mark the attempt as `FAILED` and rethrow the error to the client. No retries.

**AI involvement:** AI suggested implementing a retry queue (e.g. using a background worker or a message broker like BullMQ) to handle transient Gemini API failures gracefully without exposing errors to the user.

**Outcome: ❌ Rejected — scope boundary**

A retry queue introduces significant infrastructure complexity (worker process, Redis or similar, job persistence) that is out of scope for this prototype. The simpler `FAILED` status approach is honest about the failure, keeps the codebase lean, and leaves a clear extension point. The user can simply re-submit, which is acceptable for a practice platform with no SLA.

---

## 5. Test Case Generation

**Decision:** Use Vitest with `vi.mock()` to test `AttemptService` and `GeminiEvaluationStrategy` in isolation.

**AI involvement:** AI generated the base set of test cases covering the happy path: successful evaluation updating status to `EVALUATED`, feedback being persisted with correct field values, and valid JSON being parsed from the model response.

**Outcome: ✅ Accepted with manual additions**

Two edge cases were added manually that AI did not initially include:

- **Empty / too-short submission** — verifying that `AttemptService` rejects before touching the database, which confirms the validation guard works and avoids unnecessary DB writes.
- **Malformed JSON from the model** — verifying that `GeminiEvaluationStrategy` throws a descriptive error (including the raw response) when the model returns non-JSON, which is a realistic failure mode given the prompt is probabilistic.

The `vi.hoisted()` pattern for mocking a constructor (`GoogleGenerativeAI`) was also worked out manually after AI's initial arrow-function mock failed with "is not a constructor".

