import path from "node:path";
import { defineConfig } from "prisma/config";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

export default defineConfig({
  experimental: { adapter: true },
  schema: path.join("prisma", "schema.prisma"),
  engine: "js",
  adapter: async () =>
    new PrismaLibSQL({
      url: `file:${path.join(__dirname, "prisma", "dev.db")}`,
    }),
});
