import { PrismaClient, Difficulty } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const problems: {
  title: string
  difficulty: Difficulty
  description: string
  requirements: string[]
}[] = [
  {
    title: "Design a Parking Lot System",
    difficulty: "MEDIUM",
    description:
      "Design an automated multi-floor parking lot system that manages vehicle entry, exit, and spot allocation.",
    requirements: [
      "Support multiple vehicle types (bike, car, truck)",
      "Track spot availability per floor",
      "Generate tickets on entry",
      "Calculate parking fees on exit",
      "Handle full capacity gracefully",
    ],
  },
  {
    title: "Design an Elevator Control System",
    difficulty: "MEDIUM",
    description:
      "Design a supervisory control system for a building with multiple elevators serving multiple floors.",
    requirements: [
      "Manage multiple elevators",
      "Handle up/down floor requests",
      "Optimize elevator dispatch",
      "Track current floor and direction",
      "Handle door open/close states",
    ],
  },
  {
    title: "Design a Vending Machine",
    difficulty: "EASY",
    description:
      "Design a state-driven vending machine that handles item selection, payment, and dispensing.",
    requirements: [
      "Model machine states (idle, item selected, payment, dispensing)",
      "Support multiple payment methods",
      "Handle insufficient funds",
      "Restock inventory",
      "Return change correctly",
    ],
  },
  {
    title: "Design an In-Memory Key-Value Store",
    difficulty: "HARD",
    description:
      "Design a thread-safe in-memory key-value store similar to Redis.",
    requirements: [
      "Support GET, SET, DELETE operations",
      "Implement TTL/expiry for keys",
      "Handle concurrent access safely",
      "Support basic data types",
      "Implement LRU eviction policy",
    ],
  },
]

async function main() {
  console.log("Seeding problems…")

  // Clear existing problems to keep seed idempotent
  await prisma.feedback.deleteMany()
  await prisma.attempt.deleteMany()
  await prisma.problem.deleteMany()

  const result = await prisma.problem.createMany({ data: problems })
  console.log(`  ✓ Created ${result.count} problems`)
  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())