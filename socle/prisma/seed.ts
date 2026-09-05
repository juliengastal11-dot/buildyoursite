import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Remplacé au bootstrap par des données réalistes issues du blueprint.
  await db.contact.deleteMany();
  await db.contact.create({
    data: {
      nom: "Exemple",
      email: "exemple@test.fr",
      message: "Seed du socle.",
    },
  });
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
