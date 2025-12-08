# Product Specification: Core Features

## 1. Document Management System
**Context:** Users need to store physical asset documents (Leases, Contracts) in the cloud.
**Infrastructure:** Vercel Blob (Preferred for ease) or AWS S3.

### Data Schema (MySQL / PlanetScale)
*Note: Using MySQL types. No `references()` constraints allowed in PlanetScale SQL.*

```typescript
// drizzle/schema.ts
import { mysqlTable, serial, varchar, timestamp, int, text } from 'drizzle-orm/mysql-core';

export const documents = mysqlTable("documents", {
  id: serial("id").primaryKey(),
  // Note: No .references() here. Relations handled in relations.ts
  propertyId: int("property_id").notNull(), 
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 512 }).notNull(), // Public/Private URL
  category: varchar("category", { length: 50 }).notNull(), // 'Contract', 'Lease', 'Insurance'
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});