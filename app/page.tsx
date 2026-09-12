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

const difficultyDot: Record<Problem["difficulty"], string> = {
  EASY:   "bg-emerald-400",
  MEDIUM: "bg-amber-400",
  HARD:   "bg-rose-400",
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/problems")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error("Unexpected response format")
        setProblems(data as Problem[])
      })
      .catch(() => setError("Failed to load problems."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold tracking-tight text-sm">
            <span className="text-primary">LLD</span>
            <span className="text-foreground"> Arena</span>
          </span>
          <Link
            href="/history"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            My History
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
        {/* Badge pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-muted/40 text-xs text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Powered by Google Gemini
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
          <span className="text-foreground">LLD </span>
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
            Arena
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
          Practice Low-Level Design with instant, dimensional AI feedback.
          Write your solution, submit, and see exactly where your design shines — and where it doesn&apos;t.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          {[
            "4 LLD dimensions scored",
            "Strengths & improvements",
            "Overall verdict",
            "Session history",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 rounded-full border border-border/50 bg-muted/30"
            >
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Problems
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>
      </div>

      {/* ── Problem grid ────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pb-24">

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && problems.length === 0 && (
          <p className="text-muted-foreground text-center py-24">
            No problems yet. Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">npx prisma db seed</code> to get started.
          </p>
        )}

        {!loading && !error && problems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {problems.map((p) => (
              <Link
                key={p.id}
                href={`/problems/${p.id}`}
                className="group outline-none"
              >
                <Card className="h-full rounded-2xl border-border/50 bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-[0.95rem] font-semibold leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </CardTitle>
                      <Badge
                        className={cn(
                          "shrink-0 text-[10px] font-semibold border tracking-wide uppercase",
                          difficultyColor[p.difficulty],
                        )}
                      >
                        <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", difficultyDot[p.difficulty])} />
                        {p.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                      {p.description}
                    </CardDescription>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-primary/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Start attempt
                      <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-6">
        <p className="text-center text-xs text-muted-foreground">
          LLD Arena · AI feedback powered by Google Gemini
        </p>
      </footer>

    </div>
  )
}