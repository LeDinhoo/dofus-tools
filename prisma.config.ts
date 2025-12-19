import "dotenv/config";
import { defineConfig } from "prisma/config";

// On utilise uniquement process.env (le standard JS)
// On met une valeur par défaut pour le build Docker
const DATABASE_URL =
  process.env.DB_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
