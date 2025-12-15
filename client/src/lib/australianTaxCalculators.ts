
/**
 * Calculate stamp duty based on Australian state/territory
 *
 * @param purchasePrice - Property purchase price in dollars
 * @param state - Australian state/territory code (e.g., "QLD", "NSW")
 * @param isFirstHome - Whether buyer is a first home buyer
 * @returns Stamp duty amount in dollars
 */
export function calculateStampDuty(
  purchasePrice: number,
  state: string,
  isFirstHome: boolean = false
): number {
  const stateCode = state.toUpperCase().trim();

  // Queensland
  if (stateCode === "QLD" || stateCode === "QUEENSLAND") {
    if (purchasePrice <= 5000) return 0;
    if (purchasePrice <= 75000) return purchasePrice * 0.015;
    if (purchasePrice <= 540000) return 1125 + (purchasePrice - 75000) * 0.035;
    if (purchasePrice <= 1000000) return 17400 + (purchasePrice - 540000) * 0.045;
    return 38100 + (purchasePrice - 1000000) * 0.0575;
  }

  // New South Wales
  if (stateCode === "NSW" || stateCode === "NEW SOUTH WALES") {
    if (purchasePrice <= 14000) return purchasePrice * 0.0125;
    if (purchasePrice <= 32000) return 175 + (purchasePrice - 14000) * 0.015;
    if (purchasePrice <= 85000) return 445 + (purchasePrice - 32000) * 0.0175;
    if (purchasePrice <= 319000) return 1372.5 + (purchasePrice - 85000) * 0.035;
    if (purchasePrice <= 1064000) return 9562.5 + (purchasePrice - 319000) * 0.045;
    return 43087.5 + (purchasePrice - 1064000) * 0.055;
  }

  // Victoria
  if (stateCode === "VIC" || stateCode === "VICTORIA") {
    if (purchasePrice <= 25000) return purchasePrice * 0.014;
    if (purchasePrice <= 130000) return 350 + (purchasePrice - 25000) * 0.024;
    if (purchasePrice <= 960000) return 2870 + (purchasePrice - 130000) * 0.06;
    if (purchasePrice <= 2000000) return 52670 + (purchasePrice - 960000) * 0.055;
    return 109870 + (purchasePrice - 2000000) * 0.065;
  }

  // South Australia
  if (stateCode === "SA" || stateCode === "SOUTH AUSTRALIA") {
    if (purchasePrice <= 12000) return purchasePrice * 0.01;
    if (purchasePrice <= 30000) return 120 + (purchasePrice - 12000) * 0.02;
    if (purchasePrice <= 50000) return 480 + (purchasePrice - 30000) * 0.03;
    if (purchasePrice <= 100000) return 1080 + (purchasePrice - 50000) * 0.035;
    if (purchasePrice <= 200000) return 2830 + (purchasePrice - 100000) * 0.04;
    if (purchasePrice <= 250000) return 6830 + (purchasePrice - 200000) * 0.0425;
    if (purchasePrice <= 300000) return 8955 + (purchasePrice - 250000) * 0.045;
    if (purchasePrice <= 500000) return 11205 + (purchasePrice - 300000) * 0.0475;
    return 20705 + (purchasePrice - 500000) * 0.055;
  }

  // Western Australia
  if (stateCode === "WA" || stateCode === "WESTERN AUSTRALIA") {
    if (purchasePrice <= 80000) return purchasePrice * 0.019;
    if (purchasePrice <= 100000) return 1520 + (purchasePrice - 80000) * 0.029;
    if (purchasePrice <= 250000) return 2100 + (purchasePrice - 100000) * 0.038;
    if (purchasePrice <= 500000) return 7800 + (purchasePrice - 250000) * 0.049;
    return 20050 + (purchasePrice - 500000) * 0.051;
  }

  // Tasmania
  if (stateCode === "TAS" || stateCode === "TASMANIA") {
    if (purchasePrice <= 3000) return purchasePrice * 0.0175;
    if (purchasePrice <= 25000) return 52.5 + (purchasePrice - 3000) * 0.0225;
    if (purchasePrice <= 75000) return 547.5 + (purchasePrice - 25000) * 0.035;
    if (purchasePrice <= 200000) return 2297.5 + (purchasePrice - 75000) * 0.04;
    if (purchasePrice <= 375000) return 7297.5 + (purchasePrice - 200000) * 0.0425;
    if (purchasePrice <= 725000) return 14735 + (purchasePrice - 375000) * 0.045;
    return 30485 + (purchasePrice - 725000) * 0.045;
  }

  // ACT (Australian Capital Territory)
  if (stateCode === "ACT" || stateCode === "AUSTRALIAN CAPITAL TERRITORY") {
    // ACT uses different calculation method - simplified here
    if (purchasePrice <= 200000) return purchasePrice * 0.0118;
    if (purchasePrice <= 300000) return 2360 + (purchasePrice - 200000) * 0.0304;
    if (purchasePrice <= 500000) return 5400 + (purchasePrice - 300000) * 0.046;
    if (purchasePrice <= 750000) return 14600 + (purchasePrice - 500000) * 0.0625;
    if (purchasePrice <= 1000000) return 30225 + (purchasePrice - 750000) * 0.0670;
    if (purchasePrice <= 1455000) return 46975 + (purchasePrice - 1000000) * 0.0685;
    return 78142.5 + (purchasePrice - 1455000) * 0.064;
  }

  // Northern Territory
  if (stateCode === "NT" || stateCode === "NORTHERN TERRITORY") {
    if (purchasePrice <= 525000) return 0; // No stamp duty for properties under $525k in NT
    if (purchasePrice <= 3000000) return (purchasePrice - 525000) * 0.0495;
    if (purchasePrice <= 5000000) return 122513 + (purchasePrice - 3000000) * 0.0575;
    return 237513 + (purchasePrice - 5000000) * 0.0595;
  }

  // Default (unknown state)
  console.warn(`Unknown state: ${state}. Returning 0 for stamp duty.`);
  return 0;
}

/**
 * Auto-calculate typical purchase costs for Australian property
 */
export function autoCalculatePurchaseCosts(
  purchasePrice: number,
  state: string,
  isFirstHome: boolean = false
): {
  stampDuty: number;
  legalFee: number;
  inspectionFee: number;
  conveyancing: number;
  totalCosts: number;
} {
  const stampDuty = calculateStampDuty(purchasePrice, state, isFirstHome);

  // Typical professional fees
  const legalFee = 2000; // Average conveyancing/legal fee
  const inspectionFee = 500; // Average building and pest inspection
  const conveyancing = 1500; // Additional conveyancing costs

  const totalCosts = stampDuty + legalFee + inspectionFee + conveyancing;

  return {
    stampDuty,
    legalFee,
    inspectionFee,
    conveyancing,
    totalCosts,
  };
}

/**
 * Format currency for Australian display
 */
export function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
