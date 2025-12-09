import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL);

async function applySchema() {
  try {
    console.log('Creating feedback_category enum...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE "feedbackCategory" AS ENUM ('Bug', 'Feature Request', 'General', 'Complaint', 'Praise', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log('Creating feedback_status enum...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE "feedbackStatus" AS ENUM ('New', 'In Progress', 'Resolved', 'Closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log('Creating feedback table...');
    await sql`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER,
        category "feedbackCategory" DEFAULT 'General' NOT NULL,
        rating INTEGER,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        "userEmail" VARCHAR(320),
        "userName" VARCHAR(255),
        status "feedbackStatus" DEFAULT 'New' NOT NULL,
        "adminNotes" TEXT,
        "resolvedAt" TIMESTAMP,
        "resolvedBy" INTEGER,
        source VARCHAR(50) DEFAULT 'in-app',
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log('Creating broadcast_emails table...');
    await sql`
      CREATE TABLE IF NOT EXISTS broadcast_emails (
        id SERIAL PRIMARY KEY,
        "createdBy" INTEGER NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        "recipientFilter" VARCHAR(100),
        "recipientCount" INTEGER DEFAULT 0,
        "sentCount" INTEGER DEFAULT 0,
        "openCount" INTEGER DEFAULT 0,
        "clickCount" INTEGER DEFAULT 0,
        "loopsTransactionalId" VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        "scheduledAt" TIMESTAMP,
        "sentAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log('✅ Schema applied successfully!');
    
    // Verify tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('feedback', 'broadcast_emails');
    `;
    console.log('✅ Verified tables:', tables.map(t => t.table_name));

  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applySchema();
