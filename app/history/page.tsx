"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HistoryItem {
  id: string
  status: string
  submittedAt: string
  problem: { title: string }
  feedback: {
    abstractionScore: number
    responsibilitiesScore: number
    relationshipsScore: number
    tradeoffsScore: number
  } | null
}

const statusColor: Record<string, string> = {
  EVALUATED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PENDING:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  FAILED:    "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

function avgScore(f: HistoryItem["feedback"]): string {
  if (!f) return "—"
  const avg = (f.abstractionScore + f.responsibilitiesScore + f.relationshipsScore + f.tradeoffsScore) / 4
  return avg.toFixed(1)
}

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = localStorage.getItem("lld_session_id")
    if (!sessionId) {
      setLoading(false)
      return
    }
    fetch(`/api/history?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data: HistoryItem[] | { error: string }) => {
        if ("error" in data) throw new Error(data.error)
        setAttempts(data)
      })
      .catch(() => setError("Failed to load history."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My History</h1>
            <p className="text-muted-foreground text-sm mt-1">All your past submissions</p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            ← Problems
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-center py-20">{error}</p>}

        {!loading && !error && attempts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
            <p className="text-4xl">📭</p>
            <p className="text-sm">No attempts yet. Start solving problems!</p>
            <Link href="/" className={cn(buttonVariants())}>Browse Problems</Link>
          </div>
        )}

        {!loading && !error && attempts.length > 0 && (
          <div className="space-y-3">
            {attempts.map((a) => (
              <Link key={a.id} href={`/attempts/${a.id}`} className="group block outline-none">
                <Card className="border-border/60 bg-card hover:border-primary/40 transition-all duration-200 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {a.problem.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {a.feedback && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          Avg&nbsp;{avgScore(a.feedback)}/5
                        </span>
                      )}
                      <Badge className={`text-xs border ${statusColor[a.status] ?? ""}`}>
                        {a.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}