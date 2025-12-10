import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql", // PlanetScale uses MySQL
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // PlanetScale does not support foreign key constraints
  // We can't strictly disable them here in config but ensuring schema doesn't use reference() helps.
  // Actually, 'casing' might be useful, but maintaining defaults is safer.
});

