import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { loans } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select().from(loans);
console.log("All loans:");
console.log(JSON.stringify(result, null, 2));
process.exit(0);
