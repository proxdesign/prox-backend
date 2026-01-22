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

// Category to Amazon search query mapping
const CATEGORY_QUERIES: Record<string, string> = {
  'all': 'furniture sofa couch chair desk table lamp pillow',
  'seating': 'sofa couch sectional sofa loveseat',
  'chairs': 'dining chair office chair accent chair armchair',
  'dining': 'dining table dining chair dining set',
  'desks': 'desk computer desk writing desk office desk',
  'storage': 'bookshelf bookcase shelving unit',
  'lighting': 'table lamp floor lamp desk lamp reading lamp',
  'decor': 'throw pillow decorative pillow cushion home decor',
};

// Backend API URL for real product data
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prox-autonomous-discovery.fly.dev';

// Map search terms to solution IDs
const SEARCH_TO_SOLUTION_MAP: { [key: string]: number } = {
  // Kitchen terms (most popular)
  "spice": 44,
  "rack": 44,
  "utensil": 46,
  "holder": 46,
  "crock": 46,
  "lazy": 41,
  "susan": 41,
  "turntable": 41,
  "counter": 37,
  "organizer": 37,
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
  
  // Living Room / Furniture repair terms
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
  
  // General storage terms
  "storage": 17,
  "ottomans": 17,
  "multipurpose": 17,
  "furniture": 17,
  "living": 17,
  
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
};

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

export async function searchProductsByKeyword(searchTerm: string): Promise<Product[]> {
  console.log(`🔍 Searching for products: "${searchTerm}"`);
  
  // ALWAYS try our backend API first with real kitchen products
  const backendProducts = await searchProductsFromBackend(searchTerm);
  if (backendProducts.length > 0) {
    console.log(`🎉 Using ${backendProducts.length} real products from backend!`);
    return backendProducts;
  }
  
  console.warn('⚠️ Backend returned no products, trying Rainforest API...');
  
  // Fallback to Rainforest API if backend fails
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey || apiKey === 'your_rainforest_api_key_here') {
    console.warn('❌ Backend and Rainforest API not available, using demo data');
    return getDemoProducts('all');
  }
  
  const params = {
    api_key: apiKey,
    type: 'search',
    amazon_domain: 'amazon.com',
    search_term: searchTerm,
    sort_by: 'featured',
    page: '1',
  };

  const queryString = new URLSearchParams(params).toString();

  try {
    const response = await fetch(
      `https://api.rainforestapi.com/request?${queryString}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'ProductDiscovery/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.search_results && Array.isArray(data.search_results)) {
      const products = data.search_results.slice(0, 12).map((item: any) => 
        transformProductWithAffiliateTag({
          title: item.title || 'Product Title Not Available',
          brand: item.brand || '',
          price: item.price?.raw || item.price_upper?.raw || 'Price unavailable',
          currency: 'USD',
          image: item.image || '',
          link: item.link || '#',
          rating: item.rating || 0,
          reviews: item.ratings_total || 0,
          source: 'Amazon',
          asin: item.asin || '',
          trendScore: calculateTrendScoreSync(item),
        })
      );
      
      // Enhance with social trend data in background
      enhanceProductsWithSocialTrends(products.slice(0, 6)).then(enhanced => {
        console.log('Enhanced keyword search products with social trend data');
      }).catch(error => {
        console.warn('Failed to enhance keyword products with social trends:', error);
      });
      
      return products;
    }

    return [];
  } catch (error) {
    console.error('Rainforest API search error:', error);
    return getDemoProducts('all');
  }
}

// Enhance products with real social trend scores
export async function enhanceProductsWithSocialTrends(products: Product[]): Promise<Product[]> {
  try {
    const enhancedProducts = await Promise.all(
      products.map(async (product) => {
        try {
          const socialTrendScore = await calculateTrendScore(product);
          return { ...product, trendScore: socialTrendScore };
        } catch (error) {
          console.warn(`Failed to enhance product ${product.title} with social trends:`, error);
          return product; // Return original product if enhancement fails
        }
      })
    );
    return enhancedProducts;
  } catch (error) {
    console.warn('Failed to enhance products with social trends:', error);
    return products; // Return original products if enhancement fails
  }
}

export async function searchProductsByCategory(category: string): Promise<Product[]> {
  // Check if API key is properly configured
  const apiKey = process.env.RAINFOREST_API_KEY;
  if (!apiKey || apiKey === 'your_rainforest_api_key_here') {
    console.warn('Rainforest API key not configured, using demo data');
    return getDemoProducts(category);
  }
  
  const query = CATEGORY_QUERIES[category.toLowerCase()] || CATEGORY_QUERIES['all'];
  
  const params = {
    api_key: apiKey,
    type: 'search',
    amazon_domain: 'amazon.com',
    search_term: query,
    sort_by: 'featured',
    page: '1',
  };

  const queryString = new URLSearchParams(params).toString();

  try {
    const response = await fetch(
      `https://api.rainforestapi.com/request?${queryString}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        cache: 'force-cache',
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rainforest API error:', response.status, errorText);
      console.warn('Falling back to demo data');
      return getDemoProducts(category);
    }

    const data = await response.json();

    if (!data.search_results || data.search_results.length === 0) {
      console.warn(`No results for category: ${category}`);
      return getDemoProducts(category);
    }

    // Transform to our product format and limit to 12
    const products = data.search_results
      .slice(0, 12)
      .map((item: any) => transformProductWithAffiliateTag({
        title: item.title || 'Unknown Product',
        brand: extractBrand(item.title),
        price: formatPrice(item.price),
        currency: item.price?.currency || 'USD',
        image: item.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
        link: item.link || `https://amazon.com/dp/${item.asin}`,
        rating: item.rating || null,
        reviews: item.ratings_total || 0,
        source: 'Amazon',
        asin: item.asin,
        trendScore: calculateTrendScoreSync(item),
      }));

    console.log(`Fetched ${products.length} products for category: ${category}`);
    
    // Enhance with social trend data in background
    enhanceProductsWithSocialTrends(products.slice(0, 6)).then(enhanced => {
      console.log('Enhanced first 6 products with social trend data');
    }).catch(error => {
      console.warn('Failed to enhance products with social trends:', error);
    });
    
    return products;
      
  } catch (error) {
    console.error('Rainforest API error:', error);
    console.warn('Falling back to demo data');
    return getDemoProducts(category);
  }
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

// Format price from API response
function formatPrice(priceData: any): string {
  if (!priceData) return 'N/A';
  
  if (priceData.value) {
    return `$${priceData.value}`;
  }
  
  if (priceData.raw) {
    // Extract number from raw price string
    const match = priceData.raw.match(/\$?([\d,]+\.?\d*)/);
    if (match) {
      const price = parseFloat(match[1].replace(',', ''));
      return `$${price.toFixed(2)}`;
    }
  }
  
  return 'N/A';
}

// Calculate trend score based on rating, review count, and social signals
async function calculateTrendScore(item: any): Promise<number> {
  const rating = item.rating || 0;
  const reviews = item.ratings_total || 0;
  const title = item.title || '';
  
  // Base score from rating and reviews (60% of total)
  const ratingScore = (rating / 5) * 4; // Max 4 points
  const reviewScore = Math.min((reviews / 1000) * 2, 2); // Max 2 points (caps at 1000 reviews)
  const baseScore = ratingScore + reviewScore;
  
  // Try to get social trend score (40% of total)
  let socialScore = 2; // Default fallback
  try {
    // Dynamic import to avoid SSR issues
    const { getQuickTrendScore } = await import('./api/trendAggregator');
    const socialTrendScore = await getQuickTrendScore(title);
    socialScore = (socialTrendScore / 10) * 4; // Convert 0-10 to 0-4 scale
  } catch (error) {
    console.warn('Could not get social trend score, using fallback:', error);
  }
  
  const totalScore = baseScore + socialScore;
  
  // Round to 1 decimal place
  return Math.min(Math.round(totalScore * 10) / 10, 10);
}

// Synchronous version for when async isn't available
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

// Demo products for when API key is not configured
function getDemoProducts(category: string): Product[] {
  const allProducts = [
    {
      title: "VASAGLE 4-Tier Storage Shelf with Hooks, Industrial Bookshelf",
      brand: "VASAGLE",
      price: "$79.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      link: "https://amazon.com/dp/B0D9Q7GQVK",
      rating: 4.7,
      reviews: 12453,
      source: "Amazon",
      asin: "B0D9Q7GQVK",
      trendScore: 8.5
    },
    {
      title: "Modern Office Chair with Lumbar Support, Ergonomic Desk Chair",
      brand: "Flash Furniture",
      price: "$189.99",
      currency: "USD", 
      image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800",
      link: "https://amazon.com/dp/B0C2SD33DQ",
      rating: 4.4,
      reviews: 8726,
      source: "Amazon",
      asin: "B0C2SD33DQ",
      trendScore: 7.8
    },
    {
      title: "SONGMICS Cube Storage Organizer, 16-Cube Closet System",
      brand: "SONGMICS",
      price: "$159.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      link: "https://amazon.com/dp/B0C7X8Q9Y2",
      rating: 4.6,
      reviews: 15678,
      source: "Amazon",
      asin: "B0C7X8Q9Y2",
      trendScore: 9.2
    },
    {
      title: "Walker Edison Farmhouse Coffee Table with Storage",
      brand: "Walker Edison",
      price: "$129.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
      link: "https://amazon.com/dp/B075QFTGYM",
      rating: 4.3,
      reviews: 5432,
      source: "Amazon",
      asin: "B075QFTGYM",
      trendScore: 7.2
    },
    {
      title: "Zinus Platform Bed Frame with Headboard, King Size",
      brand: "Zinus",
      price: "$299.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      link: "https://amazon.com/dp/B0BHMD8P65",
      rating: 4.5,
      reviews: 23456,
      source: "Amazon",
      asin: "B0BHMD8P65", 
      trendScore: 8.9
    },
    {
      title: "HOMCOM Ottoman Storage Bench with Cushioned Seat",
      brand: "HOMCOM",
      price: "$69.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      link: "https://amazon.com/dp/B084RHDP9X",
      rating: 4.2,
      reviews: 3210,
      source: "Amazon",
      asin: "B084RHDP9X",
      trendScore: 6.8
    },
    {
      title: "Nathan James Theo Wood Ladder Bookshelf, 4-Tier",
      brand: "Nathan James",
      price: "$149.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      link: "https://amazon.com/dp/B07Y4JQ8KR",
      rating: 4.8,
      reviews: 7891,
      source: "Amazon",
      asin: "B07Y4JQ8KR",
      trendScore: 8.7
    },
    {
      title: "Sauder North Avenue Desk with Drawers, Charter Oak",
      brand: "Sauder",
      price: "$199.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800",
      link: "https://amazon.com/dp/B01N5HQZ2O",
      rating: 4.1,
      reviews: 4567,
      source: "Amazon",
      asin: "B01N5HQZ2O",
      trendScore: 6.9
    },
    {
      title: "IRIS USA Plastic Storage Bins with Lids, Set of 6",
      brand: "IRIS USA",
      price: "$89.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      link: "https://amazon.com/dp/B07H8QXPFL",
      rating: 4.6,
      reviews: 9876,
      source: "Amazon", 
      asin: "B07H8QXPFL",
      trendScore: 8.3
    },
    {
      title: "South Shore Vito Nightstand with Drawer, Weathered Oak",
      brand: "South Shore",
      price: "$119.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      link: "https://amazon.com/dp/B00RKWAWBQ",
      rating: 4.4,
      reviews: 6543,
      source: "Amazon",
      asin: "B00RKWAWBQ",
      trendScore: 7.6
    },
    {
      title: "Christopher Knight Home Accent Chair, Beige Fabric",
      brand: "Christopher Knight",
      price: "$169.99", 
      currency: "USD",
      image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800",
      link: "https://amazon.com/dp/B01CRHFXGE",
      rating: 4.3,
      reviews: 11234,
      source: "Amazon",
      asin: "B01CRHFXGE",
      trendScore: 7.9
    },
    {
      title: "Furinno Computer Desk with Keyboard Tray, Espresso",
      brand: "Furinno",
      price: "$59.99",
      currency: "USD",
      image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800",
      link: "https://amazon.com/dp/B00TRVX1UY",
      rating: 4.0,
      reviews: 2109,
      source: "Amazon",
      asin: "B00TRVX1UY",
      trendScore: 5.8
    }
  ];

  // Filter products by category
  const categoryMap: Record<string, string[]> = {
    seating: ['sofa', 'couch', 'sectional', 'loveseat'],
    chairs: ['chair', 'dining chair', 'office chair', 'accent chair'],
    dining: ['dining', 'table'],
    desks: ['desk', 'computer desk', 'writing desk'],
    storage: ['bookshelf', 'bookcase', 'shelf'],
    lighting: ['lamp', 'table lamp', 'floor lamp'],
    decor: ['pillow', 'cushion', 'decor'],
  };

  if (category === 'all') {
    return allProducts.slice(0, 12).map(product => transformProductWithAffiliateTag(product));
  }

  const keywords = categoryMap[category.toLowerCase()] || [];
  const filtered = allProducts.filter(product => 
    keywords.some(keyword => 
      product.title.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  // Apply affiliate tags to demo products too
  return filtered.slice(0, 12).map(product => transformProductWithAffiliateTag(product));
}