import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { properties } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);
await db.delete(properties).where(eq(properties.id, 4));
console.log("Deleted property ID 4");
process.exit(0);
