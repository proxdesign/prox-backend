interface GoogleTrendsTimelineData {
  time: string;
  value: number;
}

interface GoogleTrendsRegionData {
  geoName: string;
  value: number;
  formattedValue: string;
}

interface GoogleTrendsData {
  keyword: string;
  timeRange: string;
  averageInterest: number;
  peakInterest: number;
  trendDirection: 'rising' | 'falling' | 'stable';
  trendScore: number;
  timelineData: GoogleTrendsTimelineData[];
  relatedQueries: string[];
  topRegions: GoogleTrendsRegionData[];
}

// Note: Google Trends doesn't have an official API, so we use google-trends-api npm package
// or scraping methods. For production, consider using Serpapi or similar service.
export async function getGoogleTrends(keyword: string): Promise<GoogleTrendsData> {
  // Check if we have a service like Serpapi configured
  const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_TRENDS_API_KEY;
  
  if (!apiKey || apiKey === 'your_trends_api_key_here') {
    console.warn('Google Trends API key not configured, using mock data');
    return getMockGoogleTrendsData(keyword);
  }

  try {
    // Using Serpapi Google Trends endpoint as an example
    const url = `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&api_key=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 7200 }, // Cache for 2 hours
    });

    if (!response.ok) {
      throw new Error(`Google Trends API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the timeline data
    const timelineData = data.interest_over_time?.timeline_data || [];
    const values = timelineData.map((item: any) => item.values?.[0]?.extracted_value || 0);
    
    const averageInterest = values.length > 0 ? 
      Math.round(values.reduce((sum: number, val: number) => sum + val, 0) / values.length) : 0;
    
    const peakInterest = values.length > 0 ? Math.max(...values) : 0;
    
    // Determine trend direction
    const recent = values.slice(-4); // Last 4 data points
    const older = values.slice(-8, -4); // Previous 4 data points
    const recentAvg = recent.length > 0 ? recent.reduce((a: number, b: number) => a + b, 0) / recent.length : 0;
    const olderAvg = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : 0;
    
    let trendDirection: 'rising' | 'falling' | 'stable';
    if (recentAvg > olderAvg * 1.1) {
      trendDirection = 'rising';
    } else if (recentAvg < olderAvg * 0.9) {
      trendDirection = 'falling';
    } else {
      trendDirection = 'stable';
    }

    // Calculate trend score (0-10)
    const intensityScore = Math.min(averageInterest / 10, 5); // Max 5 points
    const momentumScore = trendDirection === 'rising' ? 3 : trendDirection === 'stable' ? 2 : 1;
    const consistencyScore = peakInterest > 0 ? Math.min(averageInterest / peakInterest * 2, 2) : 0;
    
    const trendScore = Math.min(intensityScore + momentumScore + consistencyScore, 10);

    return {
      keyword,
      timeRange: '12m',
      averageInterest,
      peakInterest,
      trendDirection,
      trendScore: Math.round(trendScore * 10) / 10,
      timelineData: timelineData.map((item: any) => ({
        time: item.date || item.time,
        value: item.values?.[0]?.extracted_value || 0,
      })),
      relatedQueries: data.related_queries?.rising?.map((q: any) => q.query) || [],
      topRegions: data.interest_by_region?.map((region: any) => ({
        geoName: region.location,
        value: region.extracted_value || 0,
        formattedValue: region.value || '0%',
      })) || [],
    };

  } catch (error) {
    console.error('Google Trends API error:', error);
    return getMockGoogleTrendsData(keyword);
  }
}

function getMockGoogleTrendsData(keyword: string): GoogleTrendsData {
  const baseInterest = 20 + Math.random() * 60;
  const peakInterest = baseInterest + Math.random() * 40;
  const directions: ('rising' | 'falling' | 'stable')[] = ['rising', 'falling', 'stable'];
  const trendDirection = directions[Math.floor(Math.random() * directions.length)];
  
  // Generate timeline data for last 12 months
  const timelineData: GoogleTrendsTimelineData[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    let value = baseInterest + (Math.random() - 0.5) * 20;
    
    // Add trend bias
    if (trendDirection === 'rising') {
      value += (11 - i) * 2; // Gradual increase
    } else if (trendDirection === 'falling') {
      value -= (11 - i) * 1.5; // Gradual decrease
    }
    
    value = Math.max(0, Math.min(100, value));
    
    timelineData.push({
      time: date.toISOString().split('T')[0],
      value: Math.round(value),
    });
  }

  const trendScore = trendDirection === 'rising' ? 6 + Math.random() * 3 :
                    trendDirection === 'stable' ? 4 + Math.random() * 3 :
                    2 + Math.random() * 3;

  return {
    keyword,
    timeRange: '12m',
    averageInterest: Math.round(baseInterest),
    peakInterest: Math.round(peakInterest),
    trendDirection,
    trendScore: Math.round(trendScore * 10) / 10,
    timelineData,
    relatedQueries: [
      `${keyword} review`,
      `best ${keyword}`,
      `${keyword} price`,
      `${keyword} vs`,
      `where to buy ${keyword}`,
    ],
    topRegions: [
      { geoName: 'United States', value: 100, formattedValue: '100%' },
      { geoName: 'Canada', value: 45, formattedValue: '45%' },
      { geoName: 'United Kingdom', value: 38, formattedValue: '38%' },
      { geoName: 'Australia', value: 33, formattedValue: '33%' },
      { geoName: 'Germany', value: 28, formattedValue: '28%' },
    ],
  };
}

export async function getGoogleTrendsScore(keyword: string): Promise<number> {
  try {
    const trends = await getGoogleTrends(keyword);
    return trends.trendScore;
  } catch (error) {
    console.error('Google Trends score error:', error);
    return 3 + Math.random() * 4; // Mock score 3-7
  }
}

export async function getRelatedSearchTerms(keyword: string): Promise<string[]> {
  try {
    const trends = await getGoogleTrends(keyword);
    return trends.relatedQueries;
  } catch (error) {
    console.error('Related terms error:', error);
    return [
      `${keyword} review`,
      `best ${keyword}`,
      `${keyword} price`,
    ];
  }
}