import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedTrends, getQuickTrendScore } from '../../../lib/api/trendAggregator';
import { checkRateLimit, getClientIP } from '../../../lib/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  // Check rate limit
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded. Please try again later.', 
        resetIn: Math.ceil(rateLimit.resetIn / 60000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
        }
      }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const quick = searchParams.get('quick') === 'true';
  
  if (!keyword) {
    return NextResponse.json(
      { error: 'Keyword parameter is required' },
      { status: 400 }
    );
  }

  try {
    let trendData;
    
    if (quick) {
      // Quick trend score only
      const trendScore = await getQuickTrendScore(keyword);
      trendData = {
        keyword,
        trendScore,
        quick: true,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Full aggregated trends
      trendData = await getAggregatedTrends(keyword);
    }

    return NextResponse.json({
      success: true,
      data: trendData,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000)),
      }
    });

  } catch (error) {
    console.error('Trending API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch trend data',
        keyword,
      },
      { status: 500 }
    );
  }
}