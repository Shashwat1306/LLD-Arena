"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Feedback {
  abstractionScore: number
  responsibilitiesScore: number
  relationshipsScore: number
  tradeoffsScore: number
  strengths: string[]
  improvements: string[]
  overallVerdict: string
}

interface AttemptDetail {
  id: string
  status: string
  solutionText: string
  problem: { id: string; title: string }
  feedback: Feedback | null
}

const SCORE_LABELS: {
  key: keyof Omit<Feedback, "strengths" | "improvements" | "overallVerdict">
  label: string
}[] = [
  { key: "abstractionScore",      label: "Abstraction" },
  { key: "responsibilitiesScore", label: "Responsibilities" },
  { key: "relationshipsScore",    label: "Relationships" },
  { key: "tradeoffsScore",        label: "Tradeoffs" },
]

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 5) * 100
  const color =
    score >= 4 ? "bg-emerald-500" :
    score >= 3 ? "bg-amber-500"   :
    "bg-rose-500"
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-foreground/80">{label}</span>
        <span className="font-semibold tabular-nums">{score}/5</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const statusColor: Record<string, string> = {
  EVALUATED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PENDING:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  FAILED:    "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>()
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/attempts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setAttempt(data)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load feedback."))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error ?? "Attempt not found."}</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>Back to Problems</Link>
      </div>
    )
  }

  const { feedback, problem } = attempt

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
            <Badge className={`text-xs border ${statusColor[attempt.status] ?? ""}`}>
              {attempt.status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">AI Feedback Report</p>
        </div>

        {!feedback ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-8 text-center text-muted-foreground">
            {attempt.status === "PENDING" ? "Evaluation is still in progress…" : "No feedback available for this attempt."}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Scores */}
            <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Scores</h2>
              {SCORE_LABELS.map(({ key, label }) => (
                <ScoreBar key={key} label={label} score={feedback[key]} />
              ))}
            </div>

            {/* Strengths */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Strengths</h2>
              <ul className="space-y-2">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Areas for Improvement</h2>
              <ul className="space-y-2">
                {feedback.improvements.map((imp, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-amber-400 shrink-0">⚠</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verdict */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Overall Verdict</h2>
              <p className="text-sm leading-relaxed">{feedback.overallVerdict}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Link href={`/problems/${problem.id}`} className={cn(buttonVariants())}>
            Try Again
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to Problems
          </Link>
        </div>
      </div>
    </div>
  )
}