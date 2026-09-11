"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Problem {
  id: string
  title: string
  description: string
  requirements: string[]
  difficulty: "EASY" | "MEDIUM" | "HARD"
}

const difficultyColor: Record<string, string> = {
  EASY:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  HARD:   "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

function getOrCreateSessionId(): string {
  const key = "lld_session_id"
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export default function AttemptEditorPage() {
  const { id: problemId } = useParams<{ id: string }>()
  const router = useRouter()

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loadingProblem, setLoadingProblem] = useState(true)
  const [solution, setSolution] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId()
    fetch("/api/problems")
      .then((r) => r.json())
      .then((problems: Problem[]) => {
        const found = problems.find((p) => p.id === problemId)
        if (!found) setError("Problem not found.")
        else setProblem(found)
      })
      .catch(() => setError("Failed to load problem."))
      .finally(() => setLoadingProblem(false))
  }, [problemId])

  async function handleSubmit() {
    setError(null)
    if (solution.trim().length < 50) {
      setError("Solution must be at least 50 characters long.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          sessionId: sessionIdRef.current,
          solutionText: solution,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Submission failed")
      router.push(`/attempts/${data.attemptId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed")
      setSubmitting(false)
    }
  }

  if (loadingProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error ?? "Problem not found."}</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Problems
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 text-muted-foreground")}
        >
          ← Back to Problems
        </Link>

        {/* Problem header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
            <Badge className={`text-xs border ${difficultyColor[problem.difficulty]}`}>
              {problem.difficulty}
            </Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
        </div>

        {/* Requirements */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Requirements
          </h2>
          <ul className="space-y-2">
            {problem.requirements.map((req, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Solution editor */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Your LLD Solution
          </h2>
          <Textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Describe your classes, interfaces, relationships, and design decisions..."
            className="min-h-64 font-mono text-sm resize-y bg-muted/30 border-border/60 focus:border-primary/60"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {solution.trim().length} chars · minimum 50
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full sm:w-auto"
          size="lg"
        >
          {submitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Evaluating…
            </>
          ) : (
            "Submit for Feedback"
          )}
        </Button>
      </div>
    </div>
  )
}