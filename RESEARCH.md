# Research Note — LLD Practice Platform

---

## 1. The Learner Problem

Low-Level Design practice has a clear and under-served gap.

Learners can attempt a Parking Lot, Elevator, or Vending Machine design — but they have no reliable way to know whether their abstractions are clean, whether responsibilities are well-separated, or whether relationships between classes are appropriate. The quality of a design is not obvious from looking at it alone, especially for someone still developing their intuition.

**The three failure modes of existing tools:**

- **Model answer comparison** — platforms provide a reference solution and ask learners to compare manually. This puts the entire burden of evaluation on the learner, which is exactly the skill they're trying to develop. It also provides no structured signal about what is good or weak in *their* solution.
- **HLD / System Design focus** — tools like Grokking and most interview prep resources focus on High-Level Design (distributed systems, capacity planning, API design). Class-level thinking — the kind evaluated in LLD interview rounds — is largely ignored.
- **No iteration loop** — even where model answers exist, there is no mechanism to submit, receive feedback, revise, and try again. The practice loop is broken.

**Core problem: feedback is missing or not actionable.**

A learner who writes a Parking Lot design today has no way to know if their `ParkingSpot` abstraction is clean, whether `FeeCalculator` should be a separate class, or whether they've modelled the relationships correctly. Without structured feedback, repetition does not lead to improvement — it just reinforces whatever habits the learner already has.

---

## 2. Existing Approaches Researched

### Excalidraw / Draw.io
Visual diagramming tools used widely for UML and class diagram sketching. Excellent for communication and collaboration but provide **zero feedback on design quality**. A learner can draw any diagram — good or bad — and the tool will render it faithfully with no opinion. Useful as an output medium, useless as a learning tool.

### InterviewBit / Grokking the System Design
Text-based interview prep courses with written model answers for common design problems. The learner reads the answer and mentally compares it to their own attempt. **No structured evaluation, no iteration loop.** Feedback is entirely self-administered and therefore unreliable — learners systematically overestimate how close their answer is to the model.

### LeetCode (for DSA)
The gold standard for coding practice. The core loop — attempt a problem, submit, receive an objective result, understand what failed, try again — is what makes LeetCode effective. LLD has no equivalent. There is no "run" button for a design, and no automatic evaluation of whether a class hierarchy is well-structured.

**This platform aims to bring the LeetCode practice loop to LLD.** The evaluation cannot be binary (pass/fail) because design quality is dimensional, so the feedback is structured across four axes: abstraction, responsibilities, relationships, and tradeoffs.

---

## 3. Key Gaps Identified

| Gap | Description |
|---|---|
| **No structured feedback** | No existing tool evaluates a learner's LLD attempt and returns specific, actionable feedback tied to design principles |
| **No iteration loop** | Most tools are one-shot — submit (or read), move on. There is no encourage-revise-resubmit cycle |
| **Binary, not dimensional** | Where feedback exists, it is either "correct/incorrect" or undifferentiated prose. Design quality is inherently multi-dimensional — a solution can have clean abstractions but poor responsibility separation |
| **HLD bias** | The market is dominated by system design (HLD) content. Class-level design thinking is underprepared in most interview prep ecosystems |

---

## 4. Product Direction

A focused MVP built around one core loop:

```
Choose Problem → Attempt → Submit → Get Dimensional AI Feedback → Review → Try Again
```

**Scope decisions for the MVP:**

- **Text-based submissions** — diagrams add front-end complexity without improving the quality of feedback at this stage. A well-written text description of a design is sufficient for Gemini to evaluate it meaningfully.
- **4 starter LLD problems** — Parking Lot, Elevator Control System, Vending Machine, In-Memory Key-Value Store. These cover a range of difficulties (EASY → HARD) and design patterns (state machine, observer, strategy, caching).
- **Gemini-powered evaluation** — scoring across 4 LLD-specific dimensions (abstraction, responsibilities, relationships, tradeoffs), each rated 1–5, with human-readable strengths, improvements, and an overall verdict paragraph.
- **Session-based history** — no authentication, but a UUID stored in `localStorage` allows learners to track their past attempts and scores within a browser session.

