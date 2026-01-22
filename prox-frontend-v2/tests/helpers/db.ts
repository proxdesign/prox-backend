/**
 * Database Helper for PostgreSQL Tests
 *
 * Provides connection pooling and query utilities for
 * validating PostgreSQL data structures.
 */

import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create a database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Set it to your PostgreSQL connection string to run database tests.'
      );
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('fly.dev') ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return pool;
}

/**
 * Execute a query and return results
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return the first row
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

/**
 * Check if the database is accessible
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Close the database pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Product interface matching the database schema
 */
export interface Product {
  id: number;
  solution_id: number | null;
  product_name: string;
  brand: string | null;
  price: number;
  affiliate_url: string;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  trend_score: number | null;
  partner_name: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Solution interface
 */
export interface Solution {
  id: number;
  problem_id: number;
  name: string;
  keywords: string[];
}

/**
 * Problem interface
 */
export interface Problem {
  id: number;
  category: string;
  name: string;
  description: string;
}
