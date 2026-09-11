import { prisma } from "@/lib/prisma"
import type { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params

    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        feedback: true,
        problem: true,
      },
    })

    if (!attempt) {
      return Response.json({ error: "Attempt not found" }, { status: 404 })
    }

    return Response.json(attempt)
  } catch (error) {
    console.error("[GET /api/attempts/[id]]", error)
    return Response.json({ error: "Failed to fetch attempt" }, { status: 500 })
  }
}