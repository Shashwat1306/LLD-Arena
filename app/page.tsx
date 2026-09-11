"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Problem {
  id: string
  title: string
  description: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
}

const difficultyColor: Record<Problem["difficulty"], string> = {
  EASY:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  HARD:   "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/problems")
      .then((r) => r.json())
      .then(setProblems)
      .catch(() => setError("Failed to load problems."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">LLD Practice</h1>
            <p className="text-muted-foreground mt-1">
              Pick a problem and get AI-powered design feedback.
            </p>
          </div>
          <Link href="/history" className={cn(buttonVariants({ variant: "outline" }))}>
            My History
          </Link>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-destructive text-center py-20">{error}</p>
        )}

        {!loading && !error && problems.length === 0 && (
          <p className="text-muted-foreground text-center py-20">
            No problems yet. Seed the database to get started.
          </p>
        )}

        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2">
            {problems.map((p) => (
              <Link key={p.id} href={`/problems/${p.id}`} className="group outline-none">
                <Card className="h-full border-border/60 bg-card hover:border-primary/40 hover:bg-card/80 transition-all duration-200 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </CardTitle>
                      <Badge className={`shrink-0 text-xs border ${difficultyColor[p.difficulty]}`}>
                        {p.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                      {p.description}
                    </CardDescription>
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