import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema.ts";

import mysql from "mysql2/promise";

// Initialize database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

async function makeAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error("❌ Please provide an email address.");
        console.error("Usage: node scripts/make-admin.mjs <email>");
        process.exit(1);
    }

    console.log(`🔍 Looking for user with email: ${email}...`);

    try {
        const [user] = await db.select().from(users).where(eq(users.email, email));

        if (!user) {
            console.error(`❌ User not found!`);
            console.error("  - Has the user signed up/logged in yet?");
            console.error("  - Did you type the email correctly?");
            process.exit(1);
        }

        if (user.role === "admin") {
            console.log(`⚠️  User '${user.name}' is ALREADY an admin.`);
            process.exit(0);
        }

        console.log(`found user: ${user.name} (ID: ${user.id})`);
        console.log(`Current Role: ${user.role}`);

        await db.update(users)
            .set({ role: "admin" })
            .where(eq(users.id, user.id));

        console.log(`✅ SUCCESS! User '${user.name}' is now an Admin.`);
        console.log("  - They may need to refresh their browser to see admin features.");

    } catch (error) {
        console.error("❌ Error updating user:", error);
        process.exit(1);
    }

    process.exit(0);
}

makeAdmin();
