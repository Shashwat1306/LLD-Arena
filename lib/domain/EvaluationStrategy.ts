export interface FeedbackScores {
  abstraction: number
  responsibilities: number
  relationships: number
  tradeoffs: number
}

export interface FeedbackResult {
  scores: FeedbackScores
  strengths: string[]
  improvements: string[]
  overallVerdict: string
}

export interface ProblemContext {
  title: string
  description: string
  requirements: string[]
}

export interface AttemptContext {
  solutionText: string
}

export interface EvaluationStrategy {
  evaluate(
    problem: ProblemContext,
    attempt: AttemptContext,
  ): Promise<FeedbackResult>
}
