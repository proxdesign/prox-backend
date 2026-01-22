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

// Canopy API search for Amazon products (primary method)
async function searchProductsViaCanopy(searchTerm: string, limit: number = 12): Promise<Product[]> {
  // Check cache first
  const cacheKey = `canopy:${searchTerm.toLowerCase()}:${limit}`;
  const cached = getCachedProducts(cacheKey);
  if (cached) {
    console.log(`⚡ Cache hit for "${searchTerm}" (${cached.length} products)`);
    return cached;
  }

  const apiKey = process.env.CANOPY_API_KEY;
  if (!apiKey) {
    console.warn('❌ Canopy API key not configured, falling back to demo data');
    return getDemoProducts(searchTerm);
  }

  try {
    console.log(`🌿 Canopy API search for: "${searchTerm}"`);
    const response = await fetch(
      `https://rest.canopyapi.co/api/amazon/search?searchTerm=${encodeURIComponent(searchTerm)}&domain=US&limit=${limit}`,
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
      const products = results.map((item: any) =>
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
      console.log(`✅ Canopy returned ${products.length} products for "${searchTerm}"`);
      // Cache the results
      setCachedProducts(cacheKey, products);
      return products;
    }

    console.warn(`⚠️ No results from Canopy for "${searchTerm}"`);
    return getDemoProducts(searchTerm);
  } catch (error) {
    console.error('Canopy API search error:', error);
    return getDemoProducts(searchTerm);
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
  'pet', 'dog', 'cat', 'litter', 'paw', 'feeding'
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

// Category-specific demo products for when APIs are unavailable
const DEMO_PRODUCTS_BY_CATEGORY: Record<string, Product[]> = {
  bathroom: [
    { title: "SimpleHuman Tension Shower Caddy, Stainless Steel", brand: "SimpleHuman", price: "$69.99", currency: "USD", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800", link: "https://amazon.com/dp/B001ET76AI", rating: 4.6, reviews: 8234, source: "Amazon", asin: "B001ET76AI", trendScore: 8.4 },
    { title: "mDesign Over-Toilet Bathroom Storage Organizer", brand: "mDesign", price: "$44.99", currency: "USD", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800", link: "https://amazon.com/dp/B07BNQR51B", rating: 4.5, reviews: 12453, source: "Amazon", asin: "B07BNQR51B", trendScore: 8.2 },
    { title: "SONGMICS Bamboo Bathroom Shelf, 4-Tier Storage Rack", brand: "SONGMICS", price: "$39.99", currency: "USD", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800", link: "https://amazon.com/dp/B073P52Y2Y", rating: 4.7, reviews: 5678, source: "Amazon", asin: "B073P52Y2Y", trendScore: 8.6 },
    { title: "iDesign Clarity Vanity Organizer, 3-Drawer", brand: "iDesign", price: "$24.99", currency: "USD", image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800", link: "https://amazon.com/dp/B002BWPTEM", rating: 4.4, reviews: 3456, source: "Amazon", asin: "B002BWPTEM", trendScore: 7.8 },
  ],
  bedroom: [
    { title: "Zinus Platform Bed Frame with Headboard, Queen", brand: "Zinus", price: "$249.99", currency: "USD", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800", link: "https://amazon.com/dp/B0BHMD8P65", rating: 4.6, reviews: 23456, source: "Amazon", asin: "B0BHMD8P65", trendScore: 9.1 },
    { title: "South Shore Vito Nightstand with Drawer", brand: "South Shore", price: "$119.99", currency: "USD", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800", link: "https://amazon.com/dp/B00RKWAWBQ", rating: 4.4, reviews: 6543, source: "Amazon", asin: "B00RKWAWBQ", trendScore: 7.6 },
    { title: "SONGMICS Cube Storage Organizer, 16-Cube Closet System", brand: "SONGMICS", price: "$159.99", currency: "USD", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", link: "https://amazon.com/dp/B0C7X8Q9Y2", rating: 4.6, reviews: 15678, source: "Amazon", asin: "B0C7X8Q9Y2", trendScore: 9.2 },
    { title: "VASAGLE Dresser with 6 Drawers, Wood Top", brand: "VASAGLE", price: "$89.99", currency: "USD", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800", link: "https://amazon.com/dp/B08CXNWJ9H", rating: 4.5, reviews: 8765, source: "Amazon", asin: "B08CXNWJ9H", trendScore: 8.3 },
  ],
  kitchen: [
    { title: "Joseph Joseph Expandable Drawer Organizer", brand: "Joseph Joseph", price: "$29.99", currency: "USD", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", link: "https://amazon.com/dp/B007CGXQTA", rating: 4.5, reviews: 4567, source: "Amazon", asin: "B007CGXQTA", trendScore: 8.1 },
    { title: "SimpleHuman Tension Arm Paper Towel Holder", brand: "SimpleHuman", price: "$39.99", currency: "USD", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", link: "https://amazon.com/dp/B00JGKGG5Q", rating: 4.7, reviews: 12345, source: "Amazon", asin: "B00JGKGG5Q", trendScore: 8.8 },
    { title: "Rev-A-Shelf Pull Out Organizer for Base Cabinet", brand: "Rev-A-Shelf", price: "$79.99", currency: "USD", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", link: "https://amazon.com/dp/B00092RKB4", rating: 4.6, reviews: 5678, source: "Amazon", asin: "B00092RKB4", trendScore: 8.4 },
    { title: "OXO Good Grips Expandable Spice Rack", brand: "OXO", price: "$49.99", currency: "USD", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", link: "https://amazon.com/dp/B00NCJC7HG", rating: 4.4, reviews: 3456, source: "Amazon", asin: "B00NCJC7HG", trendScore: 7.9 },
  ],
  'living room': [
    { title: "Modway Engage Mid-Century Modern Sofa", brand: "Modway", price: "$899.99", currency: "USD", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", link: "https://amazon.com/dp/B00S2YFQD4", rating: 4.5, reviews: 2345, source: "Amazon", asin: "B00S2YFQD4", trendScore: 8.7 },
    { title: "Walker Edison Farmhouse Coffee Table with Storage", brand: "Walker Edison", price: "$129.99", currency: "USD", image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800", link: "https://amazon.com/dp/B075QFTGYM", rating: 4.3, reviews: 5432, source: "Amazon", asin: "B075QFTGYM", trendScore: 7.2 },
    { title: "Christopher Knight Home Accent Chair, Beige Fabric", brand: "Christopher Knight", price: "$169.99", currency: "USD", image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800", link: "https://amazon.com/dp/B01CRHFXGE", rating: 4.3, reviews: 11234, source: "Amazon", asin: "B01CRHFXGE", trendScore: 7.9 },
    { title: "Nathan James Theo Wood Ladder Bookshelf, 4-Tier", brand: "Nathan James", price: "$149.99", currency: "USD", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800", link: "https://amazon.com/dp/B07Y4JQ8KR", rating: 4.8, reviews: 7891, source: "Amazon", asin: "B07Y4JQ8KR", trendScore: 8.7 },
  ],
  desk: [
    { title: "Sauder North Avenue Desk with Drawers", brand: "Sauder", price: "$199.99", currency: "USD", image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800", link: "https://amazon.com/dp/B01N5HQZ2O", rating: 4.1, reviews: 4567, source: "Amazon", asin: "B01N5HQZ2O", trendScore: 6.9 },
    { title: "FLEXISPOT Standing Desk Converter", brand: "FLEXISPOT", price: "$259.99", currency: "USD", image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800", link: "https://amazon.com/dp/B01HQUCEVY", rating: 4.5, reviews: 8765, source: "Amazon", asin: "B01HQUCEVY", trendScore: 8.4 },
    { title: "Bush Furniture Somerset L-Shaped Desk", brand: "Bush Furniture", price: "$349.99", currency: "USD", image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800", link: "https://amazon.com/dp/B00UFHV5PC", rating: 4.4, reviews: 3456, source: "Amazon", asin: "B00UFHV5PC", trendScore: 7.8 },
    { title: "Furinno Computer Desk with Keyboard Tray", brand: "Furinno", price: "$59.99", currency: "USD", image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800", link: "https://amazon.com/dp/B00TRVX1UY", rating: 4.0, reviews: 2109, source: "Amazon", asin: "B00TRVX1UY", trendScore: 5.8 },
  ],
  cleaning: [
    { title: "iRobot Roomba i3+ Robot Vacuum with Auto Dirt Disposal", brand: "iRobot", price: "$349.99", currency: "USD", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800", link: "https://amazon.com/dp/B08C4LC7TN", rating: 4.4, reviews: 15678, source: "Amazon", asin: "B08C4LC7TN", trendScore: 9.1 },
    { title: "Bissell CrossWave All-in-One Multi-Surface Cleaner", brand: "Bissell", price: "$279.99", currency: "USD", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800", link: "https://amazon.com/dp/B01DTYAZO4", rating: 4.3, reviews: 23456, source: "Amazon", asin: "B01DTYAZO4", trendScore: 8.7 },
    { title: "Dyson V15 Detect Cordless Vacuum", brand: "Dyson", price: "$749.99", currency: "USD", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800", link: "https://amazon.com/dp/B0916S55FL", rating: 4.7, reviews: 8765, source: "Amazon", asin: "B0916S55FL", trendScore: 9.4 },
    { title: "O-Cedar EasyWring Microfiber Spin Mop", brand: "O-Cedar", price: "$34.99", currency: "USD", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800", link: "https://amazon.com/dp/B00WSWGVZQ", rating: 4.5, reviews: 45678, source: "Amazon", asin: "B00WSWGVZQ", trendScore: 8.9 },
  ],
  pet: [
    { title: "Furminator deShedding Tool for Dogs", brand: "Furminator", price: "$32.99", currency: "USD", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", link: "https://amazon.com/dp/B0040QW35A", rating: 4.6, reviews: 34567, source: "Amazon", asin: "B0040QW35A", trendScore: 9.2 },
    { title: "IRIS USA Top Entry Cat Litter Box", brand: "IRIS USA", price: "$24.99", currency: "USD", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", link: "https://amazon.com/dp/B01AQPV5U2", rating: 4.5, reviews: 12345, source: "Amazon", asin: "B01AQPV5U2", trendScore: 8.6 },
    { title: "PetSafe Drinkwell Pet Water Fountain", brand: "PetSafe", price: "$39.99", currency: "USD", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", link: "https://amazon.com/dp/B000L3XYZ4", rating: 4.4, reviews: 23456, source: "Amazon", asin: "B000L3XYZ4", trendScore: 8.3 },
    { title: "ChomChom Roller Pet Hair Remover", brand: "ChomChom", price: "$29.99", currency: "USD", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", link: "https://amazon.com/dp/B00BAGTNAQ", rating: 4.6, reviews: 56789, source: "Amazon", asin: "B00BAGTNAQ", trendScore: 9.1 },
  ],
  sofa: [
    { title: "Modway Engage Mid-Century Modern Sofa", brand: "Modway", price: "$899.99", currency: "USD", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", link: "https://amazon.com/dp/B00S2YFQD4", rating: 4.5, reviews: 2345, source: "Amazon", asin: "B00S2YFQD4", trendScore: 8.7 },
    { title: "Stone & Beam Lauren Down-Filled Loveseat", brand: "Stone & Beam", price: "$699.99", currency: "USD", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", link: "https://amazon.com/dp/B076JLX4ZX", rating: 4.4, reviews: 1234, source: "Amazon", asin: "B076JLX4ZX", trendScore: 8.2 },
    { title: "Rivet Revolve Modern Upholstered Sofa", brand: "Rivet", price: "$799.99", currency: "USD", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", link: "https://amazon.com/dp/B075X4T2ZK", rating: 4.3, reviews: 3456, source: "Amazon", asin: "B075X4T2ZK", trendScore: 8.0 },
    { title: "HONBAY Reversible Sectional Sofa Couch", brand: "HONBAY", price: "$499.99", currency: "USD", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800", link: "https://amazon.com/dp/B07BFGX1HQ", rating: 4.2, reviews: 5678, source: "Amazon", asin: "B07BFGX1HQ", trendScore: 7.8 },
  ],
  storage: [
    { title: "SONGMICS Cube Storage Organizer, 16-Cube", brand: "SONGMICS", price: "$159.99", currency: "USD", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", link: "https://amazon.com/dp/B0C7X8Q9Y2", rating: 4.6, reviews: 15678, source: "Amazon", asin: "B0C7X8Q9Y2", trendScore: 9.2 },
    { title: "IRIS USA Plastic Storage Bins with Lids, Set of 6", brand: "IRIS USA", price: "$89.99", currency: "USD", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", link: "https://amazon.com/dp/B07H8QXPFL", rating: 4.6, reviews: 9876, source: "Amazon", asin: "B07H8QXPFL", trendScore: 8.3 },
    { title: "VASAGLE 4-Tier Storage Shelf with Hooks", brand: "VASAGLE", price: "$79.99", currency: "USD", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800", link: "https://amazon.com/dp/B0D9Q7GQVK", rating: 4.7, reviews: 12453, source: "Amazon", asin: "B0D9Q7GQVK", trendScore: 8.5 },
    { title: "Sterilite 3-Drawer Cart, White", brand: "Sterilite", price: "$24.99", currency: "USD", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", link: "https://amazon.com/dp/B001NXMN72", rating: 4.5, reviews: 23456, source: "Amazon", asin: "B001NXMN72", trendScore: 8.8 },
  ],
};

// Demo products for when API key is not configured
function getDemoProducts(category: string): Product[] {
  const lowerCategory = category.toLowerCase();

  // Check for direct category match
  if (DEMO_PRODUCTS_BY_CATEGORY[lowerCategory]) {
    return DEMO_PRODUCTS_BY_CATEGORY[lowerCategory].map(p => transformProductWithAffiliateTag(p));
  }

  // Check for keyword matches in category names
  for (const [catKey, products] of Object.entries(DEMO_PRODUCTS_BY_CATEGORY)) {
    if (lowerCategory.includes(catKey) || catKey.includes(lowerCategory)) {
      return products.map(p => transformProductWithAffiliateTag(p));
    }
  }

  // Default fallback - return a mix of popular products
  const allProducts = [
    ...DEMO_PRODUCTS_BY_CATEGORY['living room'],
    ...DEMO_PRODUCTS_BY_CATEGORY.storage,
    ...DEMO_PRODUCTS_BY_CATEGORY.desk,
  ];

  return allProducts.slice(0, 12).map(p => transformProductWithAffiliateTag(p));
}