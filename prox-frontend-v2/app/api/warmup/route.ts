import { NextResponse } from 'next/server';
import { searchProductsByKeyword, getCacheStats } from '@/lib/productApi';

// Categories to warm up on deployment
const WARMUP_CATEGORIES = [
  'kitchen',
  'bathroom',
  'bedroom',
  'desk',
  'sofa',
  'entryway',
  'storage',
  'grout cleaner',
  'window cleaner',
  'dust vacuum',
  'pet hair',
  'litter box',
  'modern furniture',
  'rustic decor',
  'minimalist',
  'rug',
  'lamp',
  'mirror',
];

export async function GET(request: Request) {
  const startTime = Date.now();
  const results: { category: string; count: number; cached: boolean }[] = [];

  console.log(`🔥 Warming up ${WARMUP_CATEGORIES.length} categories...`);

  // Run warmup requests in parallel (batches of 5 to avoid rate limits)
  const batchSize = 5;
  for (let i = 0; i < WARMUP_CATEGORIES.length; i += batchSize) {
    const batch = WARMUP_CATEGORIES.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (category) => {
        const cacheStatsBefore = getCacheStats();
        const wasCached = cacheStatsBefore.keys.some(k => k.includes(category.toLowerCase()));

        const products = await searchProductsByKeyword(category);

        return {
          category,
          count: products.length,
          cached: wasCached,
        };
      })
    );
    results.push(...batchResults);
  }

  const duration = Date.now() - startTime;
  const cacheStats = getCacheStats();

  console.log(`✅ Warmup complete in ${duration}ms. Cache size: ${cacheStats.size}`);

  return NextResponse.json({
    success: true,
    message: `Warmed up ${WARMUP_CATEGORIES.length} categories`,
    duration: `${duration}ms`,
    cacheSize: cacheStats.size,
    results,
  });
}

// Also support POST for Vercel deployment hooks
export async function POST(request: Request) {
  return GET(request);
}
