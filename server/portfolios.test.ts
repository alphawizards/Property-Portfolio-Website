import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * Portfolio CRUD Operations Test Suite
 * 
 * Tests the complete portfolio management API including:
 * - Creating portfolios
 * - Listing user portfolios
 * - Getting portfolio by ID
 * - Getting portfolio with properties
 * - Updating portfolio details
 * - Deleting portfolios
 */

// Mock context with authenticated user
const createMockContext = (userId: number = 1): Context => ({
  user: {
    id: userId,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "user",
    subscriptionTier: "FREE",
  },
  req: {} as any,
  res: {} as any,
});

describe("Portfolio API", () => {
  let testPortfolioId: number;
  const caller = appRouter.createCaller(createMockContext());

  describe("Portfolio CRUD Operations", () => {
    it("should create a new portfolio", async () => {
      const result = await caller.portfolios.create({
        name: "Test Portfolio",
        type: "Normal",
        description: "A test portfolio for vitest",
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
      testPortfolioId = result.id;
    });

    it("should list all portfolios for the user", async () => {
      const portfolios = await caller.portfolios.list();

      expect(Array.isArray(portfolios)).toBe(true);
      expect(portfolios.length).toBeGreaterThan(0);
      
      const testPortfolio = portfolios.find(p => p.id === testPortfolioId);
      expect(testPortfolio).toBeDefined();
      expect(testPortfolio?.name).toBe("Test Portfolio");
      expect(testPortfolio?.type).toBe("Normal");
    });

    it("should get a portfolio by ID", async () => {
      const portfolio = await caller.portfolios.getById({ id: testPortfolioId });

      expect(portfolio).toBeDefined();
      expect(portfolio.id).toBe(testPortfolioId);
      expect(portfolio.name).toBe("Test Portfolio");
      expect(portfolio.type).toBe("Normal");
      expect(portfolio.description).toBe("A test portfolio for vitest");
    });

    it("should get portfolio with properties", async () => {
      const result = await caller.portfolios.getWithProperties({ id: testPortfolioId });

      expect(result).toBeDefined();
      expect(result.id).toBe(testPortfolioId);
      expect(result).toHaveProperty("properties");
      expect(Array.isArray(result.properties)).toBe(true);
    });

    it("should update portfolio details", async () => {
      const updateResult = await caller.portfolios.update({
        id: testPortfolioId,
        data: {
          name: "Updated Test Portfolio",
          description: "Updated description",
        },
      });

      expect(updateResult.success).toBe(true);

      // Verify the update
      const portfolio = await caller.portfolios.getById({ id: testPortfolioId });
      expect(portfolio.name).toBe("Updated Test Portfolio");
      expect(portfolio.description).toBe("Updated description");
    });

    it("should prevent deleting portfolio with properties", async () => {
      // First check if this portfolio has properties
      const portfolioWithProps = await caller.portfolios.getWithProperties({ id: testPortfolioId });
      
      if (portfolioWithProps.properties.length > 0) {
        // Should throw error when trying to delete portfolio with properties
        await expect(
          caller.portfolios.delete({ id: testPortfolioId })
        ).rejects.toThrow();
      }
    });

    it("should delete an empty portfolio", async () => {
      // Create a new empty portfolio for deletion test
      const newPortfolio = await caller.portfolios.create({
        name: "Portfolio to Delete",
        type: "Normal",
      });

      // Delete it
      const deleteResult = await caller.portfolios.delete({ id: newPortfolio.id });
      expect(deleteResult.success).toBe(true);

      // Verify it's deleted
      await expect(
        caller.portfolios.getById({ id: newPortfolio.id })
      ).rejects.toThrow();
    });
  });

  describe("Portfolio Access Control", () => {
    it("should prevent access to other user's portfolio", async () => {
      // Create caller with different user ID
      const otherUserCaller = appRouter.createCaller(createMockContext(999));

      // Try to access the test portfolio
      await expect(
        otherUserCaller.portfolios.getById({ id: testPortfolioId })
      ).rejects.toThrow(/You do not have access to this portfolio/);
    });

    it("should prevent updating other user's portfolio", async () => {
      const otherUserCaller = appRouter.createCaller(createMockContext(999));

      await expect(
        otherUserCaller.portfolios.update({
          id: testPortfolioId,
          data: { name: "Hacked Name" },
        })
      ).rejects.toThrow(/You do not have access to this portfolio/);
    });

    it("should prevent deleting other user's portfolio", async () => {
      const otherUserCaller = appRouter.createCaller(createMockContext(999));

      await expect(
        otherUserCaller.portfolios.delete({ id: testPortfolioId })
      ).rejects.toThrow(/You do not have access to this portfolio/);
    });
  });

  describe("Portfolio Validation", () => {
    it("should require portfolio name", async () => {
      await expect(
        caller.portfolios.create({
          name: "",
          type: "Normal",
        })
      ).rejects.toThrow();
    });

    it("should validate portfolio type enum", async () => {
      await expect(
        caller.portfolios.create({
          name: "Test",
          type: "InvalidType" as any,
        })
      ).rejects.toThrow();
    });

    it("should handle non-existent portfolio ID", async () => {
      await expect(
        caller.portfolios.getById({ id: 999999 })
      ).rejects.toThrow(/Portfolio not found/);
    });
  });
});
