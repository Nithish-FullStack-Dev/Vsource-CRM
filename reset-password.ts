import 'dotenv/config';
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const newPassword = "Test1234!"; // change this to whatever you want
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email: "admin@vsource.com" },
    data: { password: hash },
  });
  console.log("Password updated. New password:", newPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
