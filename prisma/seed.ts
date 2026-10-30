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
}
main().finally(() => prisma.$disconnect());
