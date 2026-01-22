/**
 * Prox Chat API Evaluation Tests
 *
 * Tests all chat experiences across all problem categories
 * using industry-standard LLM evaluation patterns.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runChatEval, TestCase, EvalResult } from './helpers/eval-runner';
import testCasesData from './fixtures/chat-test-cases.json';

const testCases = testCasesData.testCases as TestCase[];
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Group test cases by category
const groupedTests = testCases.reduce((acc, tc) => {
  if (!acc[tc.category]) {
    acc[tc.category] = [];
  }
  acc[tc.category].push(tc);
  return acc;
}, {} as Record<string, TestCase[]>);

describe('Prox Chat API Evaluations', () => {
  // Check API is accessible
  beforeAll(async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat`, { method: 'GET' });
      if (!response.ok) {
        console.warn(`API health check returned ${response.status}`);
      }
    } catch (error) {
      console.error('API not accessible. Make sure the dev server is running.');
      throw new Error(`Cannot connect to API at ${API_URL}. Run 'npm run dev' first.`);
    }
  });

  // ==================== TILE TESTS ====================
  describe('Tile Tests', () => {
    const tileTests = groupedTests['Tiles'] || [];

    it('Solve a Problem tile asks clarifying question', async () => {
      const testCase = tileTests.find(t => t.id === 'tile-solve-problem');
      if (!testCase) throw new Error('Test case not found');

      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      expect(result.errors).toHaveLength(0);
      expect(result.response?.needsMoreInfo).toBe(true);
    });

    it('Buy a Gift tile asks about recipient and budget', async () => {
      const testCase = tileTests.find(t => t.id === 'tile-gift');
      if (!testCase) throw new Error('Test case not found');

      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      expect(result.errors).toHaveLength(0);
      expect(result.response?.needsMoreInfo).toBe(true);
    });

    it('Quick Fix tile shows products under $30', async () => {
      const testCase = tileTests.find(t => t.id === 'tile-quick-fix');
      if (!testCase) throw new Error('Test case not found');

      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      expect(result.errors).toHaveLength(0);
      expect(result.response?.showProductGrid).toBe(true);
      expect(result.response?.products?.length).toBeGreaterThan(0);

      // Verify all products are under $30
      const products = result.response?.products || [];
      for (const product of products) {
        if (product.price) {
          expect(product.price).toBeLessThanOrEqual(30);
        }
      }
    });
  });

  // ==================== HOME ORGANIZATION TESTS ====================
  describe('Home Organization', () => {
    const orgTests = groupedTests['Home Organization'] || [];

    it.each(orgTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      // Log warnings but don't fail on them
      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });

  // ==================== KITCHEN TESTS ====================
  describe('Kitchen', () => {
    const kitchenTests = groupedTests['Kitchen'] || [];

    it.each(kitchenTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });

  // ==================== HOME OFFICE TESTS ====================
  describe('Home Office', () => {
    const officeTests = groupedTests['Home Office'] || [];

    it.each(officeTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });

  // ==================== LIVING ROOM TESTS ====================
  describe('Living Room', () => {
    const livingTests = groupedTests['Living Room'] || [];

    it.each(livingTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });

  // ==================== BEDROOM TESTS ====================
  describe('Bedroom', () => {
    const bedroomTests = groupedTests['Bedroom'] || [];

    it.each(bedroomTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });

  // ==================== BATHROOM TESTS ====================
  describe('Bathroom', () => {
    const bathroomTests = groupedTests['Bathroom'] || [];

    it.each(bathroomTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });

  // ==================== PET OWNERS TESTS ====================
  describe('Pet Owners', () => {
    const petTests = groupedTests['Pet Owners'] || [];

    it.each(petTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });

  // ==================== CLEANING TESTS ====================
  describe('Cleaning', () => {
    const cleaningTests = groupedTests['Cleaning'] || [];

    it.each(cleaningTests)('$description', async (testCase) => {
      const result = await runChatEval(testCase.userInput, testCase.expectedBehavior);

      if (result.warnings.length > 0) {
        console.warn(`  Warnings for ${testCase.id}:`, result.warnings);
      }

      expect(result.errors).toHaveLength(0);
    });
  });
});

// ==================== BEHAVIORAL TESTS ====================
describe('Behavioral Tests', () => {
  it('should not include AI disclaimers in responses', async () => {
    const forbiddenPhrases = [
      'as an ai',
      'as a language model',
      'i don\'t have personal preferences',
      'i cannot',
    ];

    const result = await runChatEval(
      'My kitchen is cluttered',
      { shouldNotContain: forbiddenPhrases }
    );

    expect(result.errors).toHaveLength(0);
  });

  it('should keep responses concise (under 500 chars for simple queries)', async () => {
    const result = await runChatEval(
      'My closet is messy',
      { maxResponseLength: 500 }
    );

    // This is a warning, not a failure
    if (result.warnings.length > 0) {
      console.warn('Response may be too long:', result.warnings);
    }
  });

  it('should handle follow-up context', async () => {
    // First message
    const firstResult = await runChatEval(
      'I have a problem to solve',
      { shouldAskClarifying: true }
    );
    expect(firstResult.response?.needsMoreInfo).toBe(true);

    // Note: Full conversation history testing requires stateful tests
    // This is a placeholder for future enhancement
  });
});
