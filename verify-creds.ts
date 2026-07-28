import 'dotenv/config';
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const credsToCheck = [
  { email: "radha@vsource.com", password: "Vsource@123" },
  { email: "navya@vsourceoverseas.com", password: "Vsource@123" },
  { email: "Receptionist@vsource.com", password: "Vsource@123" },
];

async function main() {
  for (const { email, password } of credsToCheck) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`${email}: NOT FOUND`);
      continue;
    }
    const match = await bcrypt.compare(password, user.password);
    console.log(`${email}: FOUND, password match = ${match}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
