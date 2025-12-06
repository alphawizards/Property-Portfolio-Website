// @ts-nocheck
import { getDb } from '../db';
import { users, subscriptionTiers, userSubscriptions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Migrate existing users to subscription system
 * Assigns all users without subscriptions to 'basic' tier
 * 
 * Usage: npx tsx server/scripts/migrate-existing-users.ts
 */
export async function migrateExistingUsers() {
  console.log('Starting user migration to subscription system...\n');

  try {
    const db = await getDb();

    // Step 1: Get all users
    console.log('📋 Fetching all users...');
    const allUsers = await db.query.users.findMany();
    console.log(`Found ${allUsers.length} users\n`);

    if (allUsers.length === 0) {
      console.log('✅ No users to migrate\n');
      return;
    }

    // Step 2: Get or create Basic tier
    console.log('🎯 Checking subscription tiers...');
    let basicTier = await db.query.subscriptionTiers.findFirst({
      where: eq(subscriptionTiers.name, 'basic'),
    });

    if (!basicTier) {
      console.log('⚠️  Basic tier not found, creating...');
      const res = await db.insert(subscriptionTiers).values({
        name: 'basic',
        displayName: 'Basic',
        description: 'Free tier for all users',
        maxProperties: 2,
        maxForecastYears: 10,
        canUseAdvancedAnalytics: false,
        canUseScenarioComparison: false,
        canExportReports: false,
        canUseTaxCalculator: false,
        priceMonthly: 0,
        priceYearly: 0,
      });
      basicTier = { id: (res as any)[0].insertId, name: 'basic', displayName: 'Basic' } as any;
    }
    console.log(`✅ Using tier: ${basicTier.displayName}\n`);

    // Step 3: Check which users need subscriptions
    console.log('🔍 Checking for existing subscriptions...');
    const usersWithSubscriptions = await db.query.userSubscriptions.findMany();
    const subscribedUserIds = new Set(
      usersWithSubscriptions.map((s) => s.userId)
    );

    const usersNeedingMigration = allUsers.filter(
      (u) => !subscribedUserIds.has(u.id)
    );
    console.log(
      `Found ${usersNeedingMigration.length} users needing migration\n`
    );

    if (usersNeedingMigration.length === 0) {
      console.log('✅ All users already have subscriptions\n');
      return;
    }

    // Step 4: Migrate users in batches (transaction safety)
    console.log('⚙️  Migrating users...\n');
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersNeedingMigration) {
      try {
        await db.transaction(async (tx) => {
          // Verify user still exists
          const existingUser = await tx.query.users.findFirst({
            where: eq(users.id, user.id),
          });

          if (!existingUser) {
            throw new Error('User not found');
          }

          // Check for race condition
          const existingSubscription =
            await tx.query.userSubscriptions.findFirst({
              where: eq(userSubscriptions.userId, user.id),
            });

          if (existingSubscription) {
            console.log(
              `⏭️  User ${user.id}: Already has subscription`
            );
            return;
          }

          // Create subscription
          await tx.insert(userSubscriptions).values({
            userId: user.id,
            tierId: basicTier.id,
            status: 'active',
            startDate: new Date(),
            endDate: null,
          });

          console.log(
            `✅ User ${user.id}: Migrated to Basic tier`
          );
          successCount++;
        });
      } catch (error) {
        console.error(
          `❌ User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        errorCount++;
      }
    }

    // Step 5: Summary
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   Total processed: ${successCount + errorCount}\n`);

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!\n');
    } else {
      console.log(
        '⚠️  Migration completed with errors. Check logs above.\n'
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run migration if called directly
migrateExistingUsers().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
