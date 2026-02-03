interface Product {
  title: string;
  brand?: string;
  price: string;
  currency: string;
  image: string;
  link: string;
  rating?: number;
  reviews?: number;
  source: string;
  asin?: string;
  trendScore?: number;
  affiliateLink?: string;
}

// In-memory cache for product searches
interface CacheEntry {
  products: Product[];
  timestamp: number;
}

const productCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_VERSION = 'v3'; // Increment to invalidate old caches

function getCachedProducts(key: string): Product[] | null {
  const entry = productCache.get(key);
  if (!entry) return null;

  // Check if cache is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    productCache.delete(key);
    return null;
  }

  return entry.products;
}

function setCachedProducts(key: string, products: Product[]): void {
  productCache.set(key, {
    products,
    timestamp: Date.now(),
  });
}

// Export for cache stats/management
export function getCacheStats() {
  return {
    size: productCache.size,
    keys: Array.from(productCache.keys()),
  };
}

const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || '';

export function addAffiliateTag(url: string): string {
  if (!AMAZON_ASSOCIATE_TAG || !url) return url;
  if (!url.includes('amazon.com')) return url;
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('tag', AMAZON_ASSOCIATE_TAG);
    return urlObj.toString();
  } catch {
    // If URL parsing fails, append manually
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tag=${AMAZON_ASSOCIATE_TAG}`;
  }
}

// Apply affiliate tag to product
function transformProductWithAffiliateTag(product: any): Product {
  const affiliateLink = addAffiliateTag(product.link || '');
  
  return {
    ...product,
    link: affiliateLink,
    affiliateLink: affiliateLink,
  };
}

// Backend API URL for real product data
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prox-autonomous-discovery.fly.dev';

// Map search terms to solution IDs
// These map to products stored in the backend database under specific solution categories
const SEARCH_TO_SOLUTION_MAP: { [key: string]: number } = {
  // Kitchen terms
  "spice": 44,
  "rack": 44,
  "utensil": 46,
  "holder": 46,
  "crock": 46,
  "lazy": 41,
  "susan": 41,
  "turntable": 41,
  "counter": 37,
  "cutting": 37,
  "board": 37,
  "appliance": 38,
  "garage": 38,
  "cabinet": 39,
  "hooks": 39,
  "clear": 40,
  "food": 40,
  "pull": 42,
  "tiered": 43,
  "riser": 43,
  "rolling": 15,
  "cart": 15,
  "kitchen": 37,
  "pantry": 40,
  "dish": 37,

  // Living Room / Furniture terms
  "fiberfill": 47,
  "stuffing": 47,
  "polyester": 47,
  "foam": 48,
  "density": 48,
  "insert": 48,
  "support": 49,
  "batting": 50,
  "wrap": 50,
  "cushion": 47,
  "couch": 47,
  "sofa": 47,
  "saggy": 47,
  "flat": 47,
  "living room": 47,
  "coffee table": 47,
  "ottoman": 17,
  "ottomans": 17,

  // Bedroom terms
  "bedroom": 11,
  "nightstand": 11,
  "bed": 11,
  "closet": 8,
  "clothes": 8,
  "hanger": 8,

  // Bathroom terms
  "bathroom": 39,
  "shower": 39,
  "toilet": 39,
  "towel": 39,
  "medicine": 39,
  "vanity": 39,

  // Home Office terms
  "desk": 36,
  "office": 36,
  "cable": 36,
  "monitor": 36,
  "ergonomic": 36,
  "chair": 36,

  // Storage terms
  "storage": 8,
  "bin": 8,
  "basket": 8,
  "container": 8,
  "organizer": 37,
  "shelf": 11,
  "shelving": 11,

  // Installation terms
  "wall": 5,
  "mounted": 5,
  "floating": 11,
  "shelves": 11,
  "bracket": 14,
  "heavy": 12,
  "duty": 12,

  // Room/space terms
  "divider": 1,
  "modular": 2,
  "vertical": 7,
  "stackable": 8,
  "corner": 11,
  "compact": 36,
  "entryway": 36,

  // Cleaning terms
  "cleaning": 40,
  "grout": 40,
  "window": 40,
  "glass": 40,
  "dust": 40,
  "vacuum": 40,
  "mop": 40,
  "stain": 40,
  "remover": 40,

  // Pet terms
  "pet": 17,
  "dog": 17,
  "cat": 17,
  "litter": 17,
  "paw": 17,
  "fur": 17,
  "hair": 17,
  "feeding": 17,
  "bowl": 17,

  // Furniture categories
  "table": 47,
  "tables": 47,
  "chairs": 36,
  "seating": 36,
  "bookshelf": 11,
  "bookcase": 11,
  "dresser": 8,
  "wardrobe": 8,
  "tv stand": 47,
  "entertainment": 47,

  // Decor terms
  "rug": 47,
  "rugs": 47,
  "lamp": 47,
  "lighting": 47,
  "mirror": 39,
  "curtain": 47,
  "curtains": 47,
  "pillow": 47,
  "pillows": 47,
  "throw": 47,
  "art": 47,
  "decor": 47,

  // Style terms
  "modern": 47,
  "rustic": 47,
  "industrial": 47,
  "minimalist": 47,
  "traditional": 47,
  "bohemian": 47,
  "boho": 47,
};

// Excluded product types - these should never appear in home/furniture searches
const EXCLUDED_KEYWORDS = [
  // Food & Beverages
  'noodle', 'pasta', 'crackers', 'cracker', 'snack', 'food', 'candy', 'chocolate', 'cookie',
  'cereal', 'drink', 'beverage', 'tea bag', 'coffee bean', 'sauce', 'seasoning', 'spice mix',
  'chips', 'pretzels', 'nuts', 'seeds', 'granola', 'protein bar', 'energy bar',
  'soup', 'broth', 'canned', 'frozen', 'organic food', 'gluten free', 'keto',
  // Media & Entertainment
  'dvd', 'blu-ray', 'cd', 'vinyl', 'album', 'movie', 'film', 'video game', 'playstation', 'xbox',
  'nintendo', 'book', 'novel', 'paperback', 'hardcover', 'kindle', 'audiobook',
  // Health & Beauty
  'scar gel', 'moisturizer', 'lotion', 'shampoo', 'conditioner', 'body wash',
  'makeup', 'mascara', 'lipstick', 'foundation', 'perfume', 'cologne', 'deodorant',
  'vitamin', 'supplement', 'medicine', 'pill', 'capsule', 'probiotic',
  'face mask', 'skin care', 'anti-aging', 'sunscreen', 'hair dye',
  // Clothing & Accessories (non-home)
  't-shirt', 'tshirt', 'pants', 'jeans', 'dress', 'skirt', 'jacket',
  'shoes', 'sneakers', 'boots', 'sandals', 'socks', 'underwear', 'bra',
  'jewelry', 'necklace', 'bracelet', 'earring',
  // Electronics (non-home)
  'phone case', 'screen protector', 'charger cable', 'earbuds', 'headphones',
  'laptop', 'computer', 'webcam', 'bluetooth speaker', 'smart watch',
  // Toys & Games
  'toy', 'action figure', 'doll', 'lego', 'puzzle', 'board game', 'card game', 'plush',
  // Automotive
  'automotive', 'vehicle', 'tire', 'motor oil', 'windshield', 'car seat',
  // Office/Industrial Supplies (not home decor)
  'printer paper', 'ink cartridge', 'stapler', 'paper clip', 'binder',
  'sharpie', 'marker', 'highlighter', 'pen', 'pencil', 'eraser', 'scissors',
  'tape dispenser', 'packing tape', 'duct tape', 'electrical tape', 'masking tape',
  'contractor bag', 'trash bag', 'garbage bag', 'plastic bag',
  'pipe fitting', 'pvc pipe', 'copper pipe', 'plumbing', 'valve', 'coupling',
  'drill bit', 'saw blade', 'sandpaper', 'welding', 'soldering',
  'safety glasses', 'work gloves', 'hard hat', 'respirator', 'ear plugs',
  'zip tie', 'cable tie', 'wire connector', 'junction box', 'conduit',
  // Musical instruments & Religious items
  'shofar', 'guitar', 'ukulele', 'violin', 'trumpet', 'flute', 'drum', 'harmonica',
  'menorah', 'rosary', 'crucifix', 'prayer', 'religious',
  // Sports & Fitness (non-home)
  'dumbbell', 'barbell', 'yoga mat', 'resistance band', 'jump rope', 'tennis', 'golf',
  'basketball', 'football', 'soccer', 'baseball', 'hockey',
  // Pet products (non-decor)
  'dog food', 'cat food', 'pet treat', 'chew toy', 'leash', 'collar', 'pet bed',
];

// Check if a product title contains excluded keywords
function isExcludedProduct(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

// Filter products to only include home-relevant items
function filterHomeProducts(products: Product[]): Product[] {
  return products.filter(product => {
    const title = product.title || '';
    // Exclude products with banned keywords
    if (isExcludedProduct(title)) {
      console.log(`🚫 Filtered out: "${title.substring(0, 50)}..."`);
      return false;
    }
    return true;
  });
}

// Canopy API search for Amazon products (exported for use as fallback)
export async function searchProductsViaCanopy(searchTerm: string, limit: number = 12): Promise<Product[]> {
  // Check cache first (include version to invalidate on filter updates)
  const cacheKey = `canopy:${CACHE_VERSION}:${searchTerm.toLowerCase()}:${limit}`;
  const cached = getCachedProducts(cacheKey);
  if (cached) {
    console.log(`⚡ Cache hit for "${searchTerm}" (${cached.length} products)`);
    return cached;
  }

  const apiKey = process.env.CANOPY_API_KEY;
  if (!apiKey) {
    console.warn('❌ Canopy API key not configured');
    return [];
  }

  try {
    // Request more products than needed to account for filtering
    const requestLimit = Math.min(limit * 2, 48);
    console.log(`🌿 Canopy API search for: "${searchTerm}" (requesting ${requestLimit} to filter down to ${limit})`);
    const response = await fetch(
      `https://rest.canopyapi.co/api/amazon/search?searchTerm=${encodeURIComponent(searchTerm)}&domain=US&limit=${requestLimit}`,
      {
        method: 'GET',
        headers: {
          'API-KEY': apiKey,
        },
        // Next.js fetch caching - cache for 1 hour
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Canopy API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Navigate to the correct path in the response
    const results = data?.data?.amazonProductSearchResults?.productResults?.results || [];

    if (results.length > 0) {
      const allProducts = results.map((item: any) =>
        transformProductWithAffiliateTag({
          title: item.title || 'Product Title Not Available',
          brand: item.brand || extractBrand(item.title || ''),
          price: item.price?.value ? `$${item.price.value}` : 'Price unavailable',
          currency: 'USD',
          image: item.mainImageUrl || '',
          link: `https://www.amazon.com/dp/${item.asin}`,
          rating: item.rating || 0,
          reviews: item.ratingsTotal || 0,
          source: 'Amazon',
          asin: item.asin || '',
          trendScore: calculateTrendScoreSync({ rating: item.rating, ratings_total: item.ratingsTotal }),
        })
      );

      // Filter out non-home products (food, media, clothing, etc.)
      const filteredProducts = filterHomeProducts(allProducts);
      // Limit to requested amount
      const products = filteredProducts.slice(0, limit);
      console.log(`✅ Canopy returned ${allProducts.length} products, ${filteredProducts.length} after filtering, returning ${products.length} for "${searchTerm}"`);
      // Cache the filtered results
      setCachedProducts(cacheKey, products);
      return products;
    }

    console.warn(`⚠️ No results from Canopy for "${searchTerm}"`);
    return [];
  } catch (error) {
    console.error('Canopy API search error:', error);
    return [];
  }
}

// Connect to our real backend API with kitchen products
export async function searchProductsFromBackend(searchTerm: string): Promise<Product[]> {
  try {
    console.log('🔗 Connecting to backend API for real kitchen products');
    
    // Try to find a matching solution for the search term
    const lowerSearchTerm = searchTerm.toLowerCase();
    let solutionId: number | null = null;
    
    // Check for exact matches first
    for (const [keyword, id] of Object.entries(SEARCH_TO_SOLUTION_MAP)) {
      if (lowerSearchTerm.includes(keyword)) {
        solutionId = id;
        console.log(`🎯 Matched search "${searchTerm}" to solution ${solutionId} (${keyword})`);
        break;
      }
    }
    
    let apiUrl: string;
    if (solutionId) {
      // Use solution-specific endpoint
      apiUrl = `${BACKEND_API_URL}/solutions/${solutionId}/products`;
      console.log(`📋 Fetching products for specific solution ${solutionId}`);
    } else {
      // Fall back to general trending products
      apiUrl = `${BACKEND_API_URL}/trending-products?limit=12&min_trend_score=0`;
      console.log(`📋 No specific solution found for "${searchTerm}", using general trending products`);
    }
    
    const cacheBust = `cache_bust=${Date.now()}`;
    const separator = apiUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${apiUrl}${separator}${cacheBust}`);
    
    if (!response.ok) {
      throw new Error(`Backend API responded with status ${response.status}`);
    }
    
    const backendProducts = await response.json();
    console.log(`📦 Backend returned ${backendProducts.length} products`);
    
    if (Array.isArray(backendProducts) && backendProducts.length > 0) {
      const transformedProducts = backendProducts.slice(0, 12).map((item: any) => ({
        title: item.product_name || 'Product Title Not Available',
        brand: item.brand || '',
        price: item.price ? `$${item.price}` : 'Price unavailable',
        currency: 'USD',
        image: item.image_url || '',
        link: item.affiliate_url || '#',
        rating: item.rating || 0,
        reviews: item.review_count || 0,
        source: 'Amazon',
        asin: extractAsinFromUrl(item.affiliate_url || ''),
        trendScore: item.trend_score || 0,
        affiliateLink: item.affiliate_url || ''
      }));
      
      console.log(`✅ Transformed ${transformedProducts.length} backend products`);
      console.log(`📋 Sample product: "${transformedProducts[0]?.title?.substring(0, 40)}..."`);
      return transformedProducts;
    }
    
    throw new Error('No products returned from backend');
  } catch (error) {
    console.error('❌ Backend API error:', error);
    return [];
  }
}

// Helper function to extract ASIN from Amazon URL
function extractAsinFromUrl(url: string): string {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : '';
}

// Generic category terms that should use Canopy API directly
// (backend doesn't have products organized by these categories)
const GENERIC_CATEGORY_TERMS = [
  'bathroom', 'bedroom', 'living room', 'kitchen', 'office', 'entryway',
  'modern', 'rustic', 'industrial', 'minimalist', 'traditional', 'bohemian', 'boho',
  'sofa', 'couch', 'chair', 'table', 'desk', 'bed', 'dresser', 'rug', 'lamp',
  'mirror', 'curtain', 'pillow', 'art', 'decor', 'lighting',
  'cleaning', 'grout', 'window', 'dust', 'vacuum', 'mop', 'stain',
  'pet', 'dog', 'cat', 'litter', 'paw', 'feeding',
  // Quick Fix specific terms - search Amazon directly
  'lazy susan', 'spice rack', 'under cabinet', 'utensil holder',
  'wall hooks', 'adhesive hooks', 'coat rack', 'storage bins',
  'under sink', 'shelf riser', 'cable clips', 'drawer organizer',
  'sink caddy', 'sponge holder',
  // Gardening terms
  'planter', 'garden tool', 'watering can', 'plant food', 'potting soil',
  'garden decor', 'solar lights', 'herb garden', 'pruning', 'gardening'
];

function isGenericCategorySearch(term: string): boolean {
  const lowerTerm = term.toLowerCase();
  return GENERIC_CATEGORY_TERMS.some(cat => lowerTerm.includes(cat));
}

export async function searchProductsByKeyword(searchTerm: string): Promise<Product[]> {
  console.log(`🔍 Searching for products: "${searchTerm}"`);

  // For generic category searches (rooms, styles, furniture types),
  // use Canopy API for real Amazon product search
  if (isGenericCategorySearch(searchTerm)) {
    console.log(`📦 Generic category search detected, using Canopy API for: "${searchTerm}"`);
    return searchProductsViaCanopy(searchTerm, 24);
  }

  // For specific solution-type searches, try backend first
  const backendProducts = await searchProductsFromBackend(searchTerm);
  if (backendProducts.length > 0) {
    console.log(`🎉 Using ${backendProducts.length} real products from backend!`);
    return backendProducts;
  }

  console.warn('⚠️ Backend returned no products, trying Canopy API...');

  // Fallback to Canopy API if backend fails
  return searchProductsViaCanopy(searchTerm, 12);
}

export async function searchProductsByCategory(category: string): Promise<Product[]> {
  // Use Canopy API for category searches
  return searchProductsViaCanopy(category, 12);
}

// Extract brand name from product title
function extractBrand(title: string): string {
  if (!title) return 'Unknown Brand';
  
  // Common furniture brands on Amazon
  const brands = [
    'VASAGLE', 'SONGMICS', 'Zinus', 'Walker Edison',
    'Novogratz', 'Sauder', 'Furinno', 'Amazon Basics',
    'Christopher Knight', 'Linon', 'Steelcase', 'HON',
    'Flash Furniture', 'Modway', 'Winsome', 'Yaheetech',
    'Best Choice Products', 'Nathan James', 'South Shore',
    'HOMCOM', 'IRIS USA', 'Prepac', 'Coaster', 'Ashley'
  ];
  
  const foundBrand = brands.find(brand => 
    title.toLowerCase().includes(brand.toLowerCase())
  );
  
  if (foundBrand) return foundBrand;
  
  // If no known brand, take first word if it's capitalized
  const firstWord = title.split(' ')[0];
  return firstWord.length > 15 ? 'Various' : firstWord;
}

// Calculate trend score based on rating and review count
function calculateTrendScoreSync(item: any): number {
  const rating = item.rating || 0;
  const reviews = item.ratings_total || 0;
  
  // Formula: weighted combination of rating and popularity
  // Rating contributes 70%, review count contributes 30%
  const ratingScore = (rating / 5) * 7; // Max 7 points
  const reviewScore = Math.min((reviews / 1000) * 3, 3); // Max 3 points (caps at 1000 reviews)
  
  const totalScore = ratingScore + reviewScore;
  
  // Round to 1 decimal place
  return Math.min(Math.round(totalScore * 10) / 10, 10);
}

