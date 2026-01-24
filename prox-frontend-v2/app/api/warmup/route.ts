import { NextRequest, NextResponse } from 'next/server';
import { searchProductsByKeyword, getCacheStats } from '@/lib/productApi';

// Quick Fix categories (under $30 products)
const QUICK_FIX_CATEGORIES = [
  { name: 'Lazy Susans', searchTerm: 'lazy susan kitchen', maxPrice: 30 },
  { name: 'Spice Racks', searchTerm: 'spice rack kitchen', maxPrice: 30 },
  { name: 'Under Cabinet Hooks', searchTerm: 'under cabinet hooks kitchen', maxPrice: 30 },
  { name: 'Utensil Holders', searchTerm: 'utensil holder kitchen', maxPrice: 30 },
  { name: 'Wall Hooks', searchTerm: 'adhesive hooks wall', maxPrice: 30 },
  { name: 'Coat Racks', searchTerm: 'coat rack wall mounted', maxPrice: 30 },
  { name: 'Storage Bins', searchTerm: 'storage bins plastic', maxPrice: 30 },
  { name: 'Under Sink', searchTerm: 'under sink organizer shelf', maxPrice: 30 },
  { name: 'Shelf Risers', searchTerm: 'shelf riser cabinet', maxPrice: 30 },
  { name: 'Cable Clips', searchTerm: 'cable clips cord management', maxPrice: 30 },
  { name: 'Drawer Organizers', searchTerm: 'drawer organizer kitchen', maxPrice: 30 },
  { name: 'Sink Caddies', searchTerm: 'sink caddy kitchen sponge', maxPrice: 30 },
];

// General categories for explore/browse
const GENERAL_CATEGORIES = [
  'kitchen organization',
  'bathroom storage',
  'bedroom furniture',
  'desk accessories',
  'entryway storage',
  'closet organizers',
  'pet supplies',
  'cleaning supplies',
  // Gardening categories
  'indoor planter',
  'garden tool set',
  'watering can',
  'plant food fertilizer',
  'garden decor outdoor',
  'herb garden kit',
];

// Affiliate source configuration (for future multi-affiliate support)
interface AffiliateSource {
  name: string;
  enabled: boolean;
  warmupFn: (searchTerm: string) => Promise<number>;
}

// Currently only Amazon/Canopy, but structured for expansion
const AFFILIATE_SOURCES: AffiliateSource[] = [
  {
    name: 'amazon',
    enabled: true,
    warmupFn: async (searchTerm: string) => {
      const products = await searchProductsByKeyword(searchTerm);
      return products.length;
    },
  },
  // Future: CJ Affiliates
  // {
  //   name: 'cj',
  //   enabled: false,
  //   warmupFn: async (searchTerm: string) => {
  //     // const products = await searchCJProducts(searchTerm);
  //     // return products.length;
  //     return 0;
  //   },
  // },
  // Future: ShareASale
  // {
  //   name: 'shareasale',
  //   enabled: false,
  //   warmupFn: async (searchTerm: string) => {
  //     // const products = await searchShareASale(searchTerm);
  //     // return products.length;
  //     return 0;
  //   },
  // },
];

interface WarmupResult {
  category: string;
  source: string;
  count: number;
  cached: boolean;
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'all'; // 'all', 'quickfix', 'general'
  const source = searchParams.get('source') || 'all'; // 'all', 'amazon', 'cj', etc.

  const startTime = Date.now();
  const results: WarmupResult[] = [];

  // Determine which categories to warm up
  let categoriesToWarmup: { name: string; searchTerm: string }[] = [];

  if (type === 'all' || type === 'quickfix') {
    categoriesToWarmup.push(...QUICK_FIX_CATEGORIES.map(c => ({
      name: c.name,
      searchTerm: c.searchTerm
    })));
  }

  if (type === 'all' || type === 'general') {
    categoriesToWarmup.push(...GENERAL_CATEGORIES.map(c => ({
      name: c,
      searchTerm: c
    })));
  }

  // Determine which affiliate sources to use
  const sourcesToUse = AFFILIATE_SOURCES.filter(s =>
    s.enabled && (source === 'all' || s.name === source)
  );

  console.log(`🔥 Warming up ${categoriesToWarmup.length} categories across ${sourcesToUse.length} sources...`);

  // Run warmup requests in parallel (batches of 5 to avoid rate limits)
  const batchSize = 5;

  for (const affiliateSource of sourcesToUse) {
    for (let i = 0; i < categoriesToWarmup.length; i += batchSize) {
      const batch = categoriesToWarmup.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (category) => {
          try {
            const cacheStatsBefore = getCacheStats();
            const wasCached = cacheStatsBefore.keys.some(k =>
              k.toLowerCase().includes(category.searchTerm.toLowerCase().split(' ')[0])
            );

            const count = await affiliateSource.warmupFn(category.searchTerm);

            return {
              category: category.name,
              source: affiliateSource.name,
              count,
              cached: wasCached,
            };
          } catch (error) {
            console.error(`Error warming up ${category.name}:`, error);
            return {
              category: category.name,
              source: affiliateSource.name,
              count: 0,
              cached: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      results.push(...batchResults);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < categoriesToWarmup.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  const duration = Date.now() - startTime;
  const cacheStats = getCacheStats();
  const successCount = results.filter(r => r.count > 0).length;
  const errorCount = results.filter(r => r.error).length;

  console.log(`✅ Warmup complete in ${duration}ms. Success: ${successCount}, Errors: ${errorCount}, Cache size: ${cacheStats.size}`);

  return NextResponse.json({
    success: true,
    message: `Warmed up ${categoriesToWarmup.length} categories`,
    duration: `${duration}ms`,
    stats: {
      total: results.length,
      success: successCount,
      errors: errorCount,
      cacheSize: cacheStats.size,
    },
    sources: sourcesToUse.map(s => s.name),
    results,
  });
}

// Support POST for deployment hooks and automation
export async function POST(request: NextRequest) {
  return GET(request);
}
