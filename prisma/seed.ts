import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const genres = ["textbook", "fiction", "science", "language_learning", "history", "business", "children", "other"];
const subjects = [
  "mathematics", "physics", "chemistry", "computer_science", "electrical_engineering",
  "mechanical_engineering", "economics", "law", "medicine", "foreign_languages", "humanities", "other",
];

async function main() {
  for (const [i, slug] of genres.entries())
    await prisma.genre.upsert({ where: { slug }, update: {}, create: { slug, sortOrder: i } });
  for (const [i, slug] of subjects.entries())
    await prisma.subject.upsert({ where: { slug }, update: {}, create: { slug, sortOrder: i } });

  // Make the account with this e-mail an admin. Set ADMIN_EMAIL (env var), register on the site, then redeploy / re-run the seed.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const { count } = await prisma.user.updateMany({ where: { email: adminEmail }, data: { role: "ADMIN" } });
    console.log(count ? `Admin granted to ${adminEmail}` : `ADMIN_EMAIL set, but no user registered with ${adminEmail} yet`);
  }
}
main().finally(() => prisma.$disconnect());
