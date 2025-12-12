/**
 * Australian Tax Utils (2024-2025 Financial Year)
 * Includes Stage 3 Tax Cuts logic.
 */

// 2024-2025 Tax Brackets (Stage 3 Cuts)
export const TAX_BRACKETS_2024_25 = [
    { limit: 18200, rate: 0, base: 0 },
    { limit: 45000, rate: 0.16, base: 0 },
    { limit: 135000, rate: 0.30, base: 4288 },
    { limit: 190000, rate: 0.37, base: 31288 },
    { limit: Infinity, rate: 0.45, base: 51638 }
];

// Medicare Levy Surcharge Thresholds (2024-25 estimates for Singles)
// Note: Families have higher thresholds. This is for Singles.
export const MLS_THRESHOLDS = {
    TIER_1: 97000,  // 1.0%
    TIER_2: 113000, // 1.25%
    TIER_3: 151000  // 1.5%
};

// HECS/HELP Repayment Thresholds 2024-2025
// (Based on ATO published rates, simplified lookup)
export const HECS_THRESHOLDS_2024_25 = [
    { limit: 54435, rate: 0 },
    { limit: 62850, rate: 0.01 },
    { limit: 66620, rate: 0.02 },
    { limit: 70618, rate: 0.025 },
    { limit: 74855, rate: 0.03 },
    { limit: 79346, rate: 0.035 },
    { limit: 84107, rate: 0.04 },
    { limit: 89154, rate: 0.045 },
    { limit: 94503, rate: 0.05 },
    { limit: 100174, rate: 0.055 },
    { limit: 106185, rate: 0.06 },
    { limit: 112556, rate: 0.065 },
    { limit: 119309, rate: 0.07 },
    { limit: 126467, rate: 0.075 },
    { limit: 134056, rate: 0.08 },
    { limit: 142100, rate: 0.085 },
    { limit: 150626, rate: 0.09 },
    { limit: 159663, rate: 0.095 },
    { limit: Infinity, rate: 0.10 }
];

export const SUPER_RATE_2024_25 = 0.115; // 11.5%

export interface TaxResult {
    grossIncome: number;
    incomeTax: number;
    medicareLevy: number;
    medicareLevySurcharge: number;
    hecsRepayment: number;
    superannuation: number;
    netIncome: number;
}

export function calculateAustralianTax(
    grossIncome: number,
    options: {
        hasHecs?: boolean;
        hasPrivateHealth?: boolean;
        isSuperInclusive?: boolean; // If true, grossIncome includes super
    } = {}
): TaxResult {
    let baseSalary = grossIncome;
    let superAmount = 0;

    // 1. Handle Super Inclusive
    if (options.isSuperInclusive) {
        baseSalary = grossIncome / (1 + SUPER_RATE_2024_25);
        superAmount = grossIncome - baseSalary;
    } else {
        superAmount = baseSalary * SUPER_RATE_2024_25;
    }

    // 2. Income Tax
    let incomeTax = 0;
    for (let i = 0; i < TAX_BRACKETS_2024_25.length; i++) {
        const bracket = TAX_BRACKETS_2024_25[i];
        const prevLimit = i === 0 ? 0 : TAX_BRACKETS_2024_25[i - 1].limit;

        if (baseSalary > prevLimit) {
            if (baseSalary <= bracket.limit) {
                incomeTax = bracket.base + (baseSalary - prevLimit) * bracket.rate;
                break;
            } else if (i === TAX_BRACKETS_2024_25.length - 1) {
                incomeTax = bracket.base + (baseSalary - prevLimit) * bracket.rate;
            }
        }
    }

    // 3. Medicare Levy (2% standard)
    // (Low income exemptions exist but simplified to 2% for base implementation)
    let medicareLevy = 0;
    if (baseSalary > 31000) { // Approx low income threshold
        medicareLevy = baseSalary * 0.02;
    }

    // 4. Medicare Levy Surcharge (MLS)
    let medicareLevySurcharge = 0;
    if (!options.hasPrivateHealth) {
        // MLS is calculated on "Income for MLS purposes" which often includes Reportable Fringe Benefits + Super etc.
        // For simplicity, we use Base Salary + Reportable Super (simplified to just Base Salary here unless we want to be super strict).
        // Technically it's (Taxable Income + Reportable Super...)
        // We'll use Base Salary for now.
        const mlsIncome = baseSalary;

        if (mlsIncome > MLS_THRESHOLDS.TIER_3) {
            medicareLevySurcharge = mlsIncome * 0.015;
        } else if (mlsIncome > MLS_THRESHOLDS.TIER_2) {
            medicareLevySurcharge = mlsIncome * 0.0125;
        } else if (mlsIncome > MLS_THRESHOLDS.TIER_1) {
            medicareLevySurcharge = mlsIncome * 0.01;
        }
    }

    // 5. HECS/HELP Repayment
    let hecsRepayment = 0;
    if (options.hasHecs) {
        const repaymentIncome = baseSalary; // + Reportable Fringe Benefits + Net Investment Loss...
        const threshold = HECS_THRESHOLDS_2024_25.find(t => repaymentIncome <= t.limit);
        if (threshold) {
            hecsRepayment = repaymentIncome * threshold.rate;
        }
    }

    const totalDeductions = incomeTax + medicareLevy + medicareLevySurcharge + hecsRepayment;
    const netIncome = baseSalary - totalDeductions;

    return {
        grossIncome: baseSalary,
        incomeTax,
        medicareLevy,
        medicareLevySurcharge,
        hecsRepayment,
        superannuation: superAmount,
        netIncome
    };
}
