import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, properties } from "../drizzle/schema.ts";

async function verifyDb() {
    console.log("🔍 connecting to database to verify data...");

    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        const db = drizzle(connection);

        // Count users
        const allUsers = await db.select().from(users);
        console.log(`✅ Found ${allUsers.length} users in the database.`);

        if (allUsers.length > 0) {
            console.log("Users:");
            allUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}`));
        } else {
            console.warn("⚠️  No users found!");
        }

        // Count properties
        const allProperties = await db.select().from(properties);
        console.log(`\n✅ Found ${allProperties.length} properties in the database.`);

        // Check for Golden Master specific data
        const goldenUser = allUsers.find(u => u.email === 'demo@propertywizards.com');
        if (goldenUser) {
            console.log(`\n🌟 Golden Master User FOUND:`);
            console.log(`  ID: ${goldenUser.id}`);
            console.log(`  OpenID: ${goldenUser.openId}`);
            console.log(`  Tier: ${goldenUser.subscriptionTier}`);

            const userProps = allProperties.filter(p => p.userId === goldenUser.id);
            console.log(`  Properties: ${userProps.length}`);
            userProps.forEach(p => console.log(`    - ${p.nickname} (${p.status})`));

            if (userProps.length >= 3) {
                console.log("\n✅ SUCCESS: Golden Master seed data appears to be loaded correctly!");
            } else {
                console.log("\n⚠️  WARNING: Golden Master user exists but has fewer than 3 properties.");
            }
        } else {
            console.log("\n⚠️  Golden Master User (demo@propertywizards.com) NOT found.");
        }

        await connection.end();

    } catch (error) {
        console.error("❌ Database verification failed:", error);
        process.exit(1);
    }
}

verifyDb();
