import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("properties.create", () => {
  it("creates a property with valid data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const property = await caller.properties.create({
      nickname: "Test Property",
      address: "123 Test St",
      state: "QLD",
      suburb: "Test Suburb",
      propertyType: "Residential",
      ownershipStructure: "Individual",
      purchaseDate: new Date("2024-01-01"),
      purchasePrice: 50000000, // $500,000 in cents
      status: "Actual",
    });

    expect(property).toBeDefined();
    expect(property.id).toBeDefined();
    expect(typeof property.id).toBe("number");
  });
});

describe("properties.list", () => {
  it("returns empty array when user has no properties", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const properties = await caller.properties.list();

    expect(Array.isArray(properties)).toBe(true);
  });
});

describe("calculations.portfolioSummary", () => {
  it("returns summary with correct structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.calculations.portfolioSummary({
      year: 2025,
    });

    if (summary) {
      expect(summary).toHaveProperty("totalProperties");
      expect(summary).toHaveProperty("totalValue");
      expect(summary).toHaveProperty("totalDebt");
      expect(summary).toHaveProperty("totalEquity");
      expect(typeof summary.totalProperties).toBe("number");
    }
  });
});
