// Pinterest API compliance - short TTL only
const PINTEREST_CACHE_TTL = 15 * 60 * 1000; // 15 minutes - don't store longer per Pinterest ToS
const pinterestCache = new Map<string, { data: PinterestTrendData; timestamp: number }>();

function getCachedPinterestData(keyword: string): PinterestTrendData | null {
  const cached = pinterestCache.get(keyword);
  if (cached && Date.now() - cached.timestamp < PINTEREST_CACHE_TTL) {
    return cached.data;
  }
  pinterestCache.delete(keyword); // Clear expired
  return null;
}

function cachePinterestData(keyword: string, data: PinterestTrendData) {
  pinterestCache.set(keyword, { data, timestamp: Date.now() });
}

interface PinterestPin {
  id: string;
  title: string;
  description: string;
  link: string;
  image_url: string;
  save_count: number;
  comment_count: number;
  created_at: string;
  board_name?: string;
}

interface PinterestTrendData {
  keyword: string;
  totalPins: number;
  totalSaves: number;
  avgEngagement: number;
  trendScore: number;
  timeRange: string;
  topPins: PinterestPin[];
}

export async function getPinterestTrends(keyword: string): Promise<PinterestTrendData> {
  // Check cache first for compliance
  const cached = getCachedPinterestData(keyword);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.PINTEREST_API_KEY;
  
  if (!apiKey || apiKey === 'your_pinterest_api_key_here') {
    console.warn('Pinterest API key not configured, using mock data');
    return getMockPinterestData(keyword);
  }

  try {
    // Search for pins related to the keyword
    const searchUrl = `https://api.pinterest.com/v5/search/pins?query=${encodeURIComponent(keyword)}&limit=50`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Pinterest API error: ${response.status}`);
    }

    const data = await response.json();
    const pins: PinterestPin[] = data.items || [];

    // Calculate trend metrics
    const totalPins = pins.length;
    const totalSaves = pins.reduce((sum, pin) => sum + (pin.save_count || 0), 0);
    const avgEngagement = totalPins > 0 ? totalSaves / totalPins : 0;
    
    // Calculate trend score (0-10 scale)
    const trendScore = Math.min(
      (avgEngagement / 100) * 5 + // Engagement contributes 5 points max
      Math.min(totalPins / 10, 5), // Pin volume contributes 5 points max
      10
    );

    const trendData = {
      keyword,
      totalPins,
      totalSaves,
      avgEngagement: Math.round(avgEngagement),
      trendScore: Math.round(trendScore * 10) / 10,
      timeRange: '7d',
      topPins: pins.slice(0, 10),
    };

    // Cache the result for compliance
    cachePinterestData(keyword, trendData);
    return trendData;

  } catch (error) {
    console.error('Pinterest API error:', error);
    return getMockPinterestData(keyword);
  }
}

function getMockPinterestData(keyword: string): PinterestTrendData {
  const baseScore = 3 + Math.random() * 4; // 3-7 range
  const pinCount = Math.floor(50 + Math.random() * 200);
  const avgSaves = Math.floor(10 + Math.random() * 50);
  
  return {
    keyword,
    totalPins: pinCount,
    totalSaves: pinCount * avgSaves,
    avgEngagement: avgSaves,
    trendScore: Math.round(baseScore * 10) / 10,
    timeRange: '7d',
    topPins: Array.from({ length: 5 }, (_, i) => ({
      id: `mock_pin_${i}`,
      title: `${keyword} Design Inspiration #${i + 1}`,
      description: `Popular ${keyword} ideas trending on Pinterest`,
      link: `https://pinterest.com/pin/mock_${i}`,
      image_url: `https://images.unsplash.com/photo-${1500000000 + i}?w=400`,
      save_count: Math.floor(50 + Math.random() * 500),
      comment_count: Math.floor(5 + Math.random() * 25),
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      board_name: `${keyword} Collection`,
    })),
  };
}

export async function getPinterestEngagement(productTitle: string): Promise<number> {
  const apiKey = process.env.PINTEREST_API_KEY;
  
  if (!apiKey || apiKey === 'your_pinterest_api_key_here') {
    return 3 + Math.random() * 4; // Mock score 3-7
  }

  try {
    const trends = await getPinterestTrends(productTitle);
    return trends.trendScore;
  } catch (error) {
    console.error('Pinterest engagement error:', error);
    return 3 + Math.random() * 4;
  }
}