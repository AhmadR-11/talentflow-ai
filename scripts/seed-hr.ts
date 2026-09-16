import { hash } from "bcryptjs"
import { prisma } from "../src/lib/prisma"

async function main() {
  const email = "ahmadraza792003@gmail.com"
  const password = "password123"
  const passwordHash = await hash(password, 10)

  console.log(`Upserting HR Manager account for: ${email}...`)

  const hr = await prisma.hrManager.upsert({
    where: { email },
    update: {
      passwordHash,
      name: "Ahmad Raza",
    },
    create: {
      email,
      name: "Ahmad Raza",
      passwordHash,
    },
  })

  // Ensure default HR preferences exist
  await prisma.hrPreference.upsert({
    where: { hrManagerId: hr.id },
    update: {},
    create: {
      hrManagerId: hr.id,
      defaultWeights: { resume: 30, test: 40, interview: 30 },
      notifyPipeline: true,
      notifyComplete: true,
    },
  })

  console.log(`\n========================================`)
  console.log(`✅ SUCCESS! HR Manager Account Registered:`)
  console.log(`   Name:     ${hr.name}`)
  console.log(`   Email:    ${hr.email}`)
  console.log(`   Password: ${password}`)
  console.log(`========================================\n`)
}

main()
  .catch((err) => {
    console.error("❌ Error seeding HR Manager:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
