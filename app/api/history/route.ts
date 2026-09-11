import { prisma } from "@/lib/prisma"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return Response.json(
        { error: "sessionId query parameter is required" },
        { status: 400 },
      )
    }

    const attempts = await prisma.attempt.findMany({
      where: { sessionId },
      orderBy: { submittedAt: "desc" },
      include: {
        problem: {
          select: { title: true },
        },
        feedback: {
          select: {
            abstractionScore: true,
            responsibilitiesScore: true,
            relationshipsScore: true,
            tradeoffsScore: true,
          },
        },
      },
    })

    return Response.json(attempts)
  } catch (error) {
    console.error("[GET /api/history]", error)
    return Response.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}