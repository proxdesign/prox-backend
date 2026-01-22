import { NextRequest, NextResponse } from 'next/server';
import { searchProductsByCategory, searchProductsByKeyword } from '../../../lib/productApi';
import { checkRateLimit, getClientIP } from '../../../lib/rateLimit';

export const dynamic = 'force-dynamic'; // Disable static generation
export const revalidate = 3600; // Revalidate every hour

export async function GET(request: NextRequest) {
  // Check rate limit first
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Rate limit exceeded. Please try again later.', 
        resetIn: Math.ceil(rateLimit.resetIn / 60000),
        products: [],
        count: 0
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
          'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000))
        }
      }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category')?.toLowerCase() || 'all';
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  
  console.log(`API Route: Fetching products for ${search ? `search: ${search}` : `category: ${category}`} (limit: ${limit})`);
  
  try {
    const allProducts = search 
      ? await searchProductsByKeyword(search)
      : await searchProductsByCategory(category);
    
    const products = allProducts.slice(0, limit);
    
    return NextResponse.json({ 
      success: true,
      products,
      category: search ? 'search' : category,
      searchTerm: search,
      count: products.length,
      total: allProducts.length,
      limit,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
      }
    });
    
  } catch (error) {
    console.error('Product API route error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch products',
        products: [],
        category,
        count: 0,
      },
      { status: 500 }
    );
  }
}