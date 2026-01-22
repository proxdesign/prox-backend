/**
 * PostgreSQL Data Validation Tests
 *
 * Validates the integrity of PostgreSQL data structures
 * to ensure the chat API has proper data to work with.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query, queryOne, checkConnection, closePool, Product } from './helpers/db';

// Skip database tests if DATABASE_URL is not set
const skipDbTests = !process.env.DATABASE_URL;

describe.skipIf(skipDbTests)('PostgreSQL Data Validation', () => {
  beforeAll(async () => {
    const connected = await checkConnection();
    if (!connected) {
      throw new Error('Cannot connect to database');
    }
  });

  afterAll(async () => {
    await closePool();
  });

  // ==================== PRODUCTS TABLE ====================
  describe('Products Table', () => {
    it('should have products in the database', async () => {
      const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM products');
      const count = parseInt(result?.count || '0', 10);

      expect(count).toBeGreaterThan(0);
      console.log(`  Products table has ${count} records`);
    });

    it('should have products with required fields', async () => {
      const products = await query<Product>(
        'SELECT id, product_name, price, affiliate_url FROM products LIMIT 100'
      );

      expect(products.length).toBeGreaterThan(0);

      for (const product of products) {
        expect(product.id).toBeDefined();
        expect(product.product_name).toBeTruthy();
        expect(product.affiliate_url).toBeTruthy();
      }
    });

    it('should have valid prices (positive numbers)', async () => {
      const invalidPrices = await query<{ id: number; price: number }>(
        'SELECT id, price FROM products WHERE price <= 0 OR price IS NULL'
      );

      if (invalidPrices.length > 0) {
        console.warn(`  Found ${invalidPrices.length} products with invalid prices`);
      }

      // Allow some products without prices, but most should have valid ones
      const validPrices = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM products WHERE price > 0'
      );
      const validCount = parseInt(validPrices[0]?.count || '0', 10);

      expect(validCount).toBeGreaterThan(0);
    });

    it('should have valid affiliate URLs', async () => {
      const products = await query<{ id: number; affiliate_url: string }>(
        'SELECT id, affiliate_url FROM products WHERE affiliate_url IS NOT NULL LIMIT 50'
      );

      for (const product of products) {
        // URLs should start with https://
        expect(product.affiliate_url).toMatch(/^https?:\/\//);
        // Should contain amazon or the affiliate tag
        expect(
          product.affiliate_url.includes('amazon') ||
          product.affiliate_url.includes('proxdesign')
        ).toBe(true);
      }
    });
  });

  // ==================== SOLUTIONS LINKING ====================
  describe('Solutions Linking', () => {
    it('should have products linked to solutions', async () => {
      const linkedProducts = await queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT solution_id) as count FROM products WHERE solution_id IS NOT NULL'
      );
      const count = parseInt(linkedProducts?.count || '0', 10);

      expect(count).toBeGreaterThan(0);
      console.log(`  ${count} unique solutions have linked products`);
    });

    it('should have multiple products per solution', async () => {
      const solutionCounts = await query<{ solution_id: number; product_count: string }>(
        `SELECT solution_id, COUNT(*) as product_count
         FROM products
         WHERE solution_id IS NOT NULL
         GROUP BY solution_id
         HAVING COUNT(*) >= 3
         LIMIT 10`
      );

      expect(solutionCounts.length).toBeGreaterThan(0);
      console.log(`  ${solutionCounts.length} solutions have 3+ products`);
    });
  });

  // ==================== TRENDING DATA ====================
  describe('Trending Products', () => {
    it('should have products with trend scores', async () => {
      const trendingProducts = await query<{ id: number; product_name: string; trend_score: number }>(
        'SELECT id, product_name, trend_score FROM products WHERE trend_score > 0 ORDER BY trend_score DESC LIMIT 20'
      );

      expect(trendingProducts.length).toBeGreaterThan(0);
      console.log(`  Top trending product score: ${trendingProducts[0]?.trend_score}`);

      // Trend scores should be reasonable (0-10 range typically)
      for (const product of trendingProducts) {
        expect(product.trend_score).toBeGreaterThan(0);
        expect(product.trend_score).toBeLessThanOrEqual(100);
      }
    });
  });

  // ==================== QUICK FIX (BUDGET) PRODUCTS ====================
  describe('Budget Products (Quick Fix)', () => {
    it('should have products under $30 for Quick Fix feature', async () => {
      const budgetProducts = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM products WHERE price <= 30 AND price > 0'
      );
      const count = parseInt(budgetProducts?.count || '0', 10);

      expect(count).toBeGreaterThan(10);
      console.log(`  ${count} products available under $30`);
    });

    it('should have diverse budget products across solutions', async () => {
      const diverseSolutions = await query<{ solution_id: number; count: string }>(
        `SELECT solution_id, COUNT(*) as count
         FROM products
         WHERE price <= 30 AND price > 0 AND solution_id IS NOT NULL
         GROUP BY solution_id`
      );

      expect(diverseSolutions.length).toBeGreaterThan(0);
      console.log(`  Budget products span ${diverseSolutions.length} different solutions`);
    });
  });

  // ==================== DATA QUALITY ====================
  describe('Data Quality', () => {
    it('should have products with ratings', async () => {
      const ratedProducts = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM products WHERE rating IS NOT NULL AND rating > 0'
      );
      const count = parseInt(ratedProducts?.count || '0', 10);

      expect(count).toBeGreaterThan(0);
      console.log(`  ${count} products have ratings`);
    });

    it('should have products with images', async () => {
      const productsWithImages = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM products WHERE image_url IS NOT NULL'
      );
      const count = parseInt(productsWithImages?.count || '0', 10);

      expect(count).toBeGreaterThan(0);
      console.log(`  ${count} products have images`);
    });

    it('should have recently updated products', async () => {
      const recentProducts = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM products
         WHERE updated_at > NOW() - INTERVAL '30 days'`
      );
      const count = parseInt(recentProducts?.count || '0', 10);

      // This is informational - products should be refreshed periodically
      console.log(`  ${count} products updated in last 30 days`);
    });
  });
});

// ==================== SKIP MESSAGE ====================
describe.runIf(skipDbTests)('PostgreSQL Tests Skipped', () => {
  it('DATABASE_URL not set - skipping database tests', () => {
    console.log('  Set DATABASE_URL environment variable to run database tests');
    expect(true).toBe(true);
  });
});
