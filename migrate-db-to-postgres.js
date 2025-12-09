const fs = require('fs');

// Read the file
let content = fs.readFileSync('server/db.ts', 'utf8');

// 1. Replace onDuplicateKeyUpdate with onConflictDoUpdate for users table
content = content.replace(
  /await db\.insert\(users\)\.values\(values\)\.onDuplicateKeyUpdate\(\{[\s\S]*?\}\);/,
  `await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });`
);

// 2. Replace onDuplicateKeyUpdate for purchaseCosts
content = content.replace(
  /await db\s+\.insert\(purchaseCosts\)\s+\.values\(costs\)\s+\.onDuplicateKeyUpdate\(\{[\s\S]*?\}\);/,
  `await db
    .insert(purchaseCosts)
    .values(costs)
    .onConflictDoUpdate({
      target: purchaseCosts.propertyId,
      set: {
        agentFee: costs.agentFee,
        stampDuty: costs.stampDuty,
        legalFee: costs.legalFee,
        inspectionFee: costs.inspectionFee,
        otherCosts: costs.otherCosts,
      },
    });`
);

// 3. Replace onDuplicateKeyUpdate for portfolioGoals
content = content.replace(
  /await db\s+\.insert\(portfolioGoals\)\s+\.values\(goal\)\s+\.onDuplicateKeyUpdate\(\{[\s\S]*?\}\);/,
  `await db
    .insert(portfolioGoals)
    .values(goal)
    .onConflictDoUpdate({
      target: portfolioGoals.userId,
      set: {
        goalYear: goal.goalYear,
        targetEquity: goal.targetEquity,
        targetValue: goal.targetValue,
      },
    });`
);

// 4. Fix all insertId to RETURNING id pattern - function declarations
const insertPatterns = [
  // Basic pattern: const result = await db.insert(...).values(...);
  { 
    regex: /const result = await db\.insert\((portfolios|properties|propertyOwnership|propertyUsagePeriods|loans|propertyValuations|growthRatePeriods|rentalIncome|expenseLogs|expenseBreakdown|depreciationSchedule|capitalExpenditure|loanScenarios|scenarios)\)\.values\(([^)]+)\);(\s+)return parseInt\(result\.insertId\);/g,
    replacement: 'const result = await db.insert($1).values($2).returning({ id: $1.id });$3return result[0].id;'
  },
];

insertPatterns.forEach(pattern => {
  content = content.replace(pattern.regex, pattern.replacement);
});

// 5. Fix transaction insertId patterns
content = content.replace(
  /const scenarioInsertResult = await tx\.insert\(scenarios\)\.values\(\{[\s\S]*?\}\);(\s+)const scenarioId = parseInt\(scenarioInsertResult\.insertId\);/,
  `const scenarioInsertResult = await tx.insert(scenarios).values({
      userId,
      originalPortfolioId: portfolioId,
      name: scenarioName,
    }).returning({ id: scenarios.id });$1const scenarioId = scenarioInsertResult[0].id;`
);

content = content.replace(
  /const newPropInsertResult = await tx\.insert\(properties\)\.values\(newPropData\);(\s+)const newPropId = parseInt\(newPropInsertResult\.insertId\);/,
  `const newPropInsertResult = await tx.insert(properties).values(newPropData).returning({ id: properties.id });$1const newPropId = newPropInsertResult[0].id;`
);

// 6. Fix the complex insertId pattern with casting
content = content.replace(
  /const result = await db\.insert\(loanScenarios\)\.values\(scenario\);(\s+)return Number\(\(result as any\)\.insertId\);/,
  `const result = await db.insert(loanScenarios).values(scenario).returning({ id: loanScenarios.id });$1return result[0].id;`
);

// Write the file
fs.writeFileSync('server/db.ts', content);
console.log('✓ Migrated server/db.ts to PostgreSQL');
