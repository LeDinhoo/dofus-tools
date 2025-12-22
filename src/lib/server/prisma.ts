// place files you want to import through the `$lib` alias in this folder.
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "$env/dynamic/private";
import { PrismaPg } from "@prisma/adapter-pg";

const DB_URL = env.DB_URL;

const adapter = new PrismaPg({
  connectionString: DB_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
