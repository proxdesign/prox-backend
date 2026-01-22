import { getPinterestTrends, getPinterestEngagement } from './pinterest';
import { getRedditTrends, getRedditEngagement } from './reddit';
import { getGoogleTrends, getGoogleTrendsScore } from './googleTrends';
import { getYouTubeTrends, getYouTubeEngagement } from './youtube';
import { calculateWeightedTrendScore, getTrendWeights } from '../trendScoring';

export interface TrendReason {
  platform: 'pinterest' | 'reddit' | 'youtube' | 'google';
  reason: string;
  impact: 'high' | 'medium' | 'low';
  data?: any;
}

export interface AggregatedTrendData {
  keyword: string;
  overallTrendScore: number;
  trendLevel: 'hot' | 'warm' | 'stable' | 'cold';
  trendReasons: TrendReason[];
  socialProofSummary: string;
  platforms: {
    pinterest: number;
    reddit: number;
    youtube: number;
    google: number;
  };
  platformData: {
    pinterest?: any;
    reddit?: any;
    youtube?: any;
    google?: any;
  };
  lastUpdated: string;
}

// Legacy weights for backward compatibility
const PLATFORM_WEIGHTS = {
  google: 0.35,    // Google Trends has highest weight
  youtube: 0.25,   // YouTube is strong indicator
  pinterest: 0.25, // Pinterest for visual products
  reddit: 0.15,    // Reddit for authentic discussions
};

export async function getAggregatedTrends(keyword: string): Promise<AggregatedTrendData> {
  console.log(`Getting aggregated trends for: ${keyword}`);
  
  try {
    // Fetch data from all platforms in parallel
    const [pinterestData, redditData, youtubeData, googleData] = await Promise.allSettled([
      getPinterestTrends(keyword),
      getRedditTrends(keyword),
      getYouTubeTrends(keyword),
      getGoogleTrends(keyword),
    ]);

    // Extract successful results
    const pinterest = pinterestData.status === 'fulfilled' ? pinterestData.value : null;
    const reddit = redditData.status === 'fulfilled' ? redditData.value : null;
    const youtube = youtubeData.status === 'fulfilled' ? youtubeData.value : null;
    const google = googleData.status === 'fulfilled' ? googleData.value : null;

    // Calculate platform scores
    const platformScores = {
      pinterest: pinterest?.trendScore || 0,
      reddit: reddit?.trendScore || 0,
      youtube: youtube?.trendScore || 0,
      google: google?.trendScore || 0,
    };

    // Calculate weighted overall score using category-specific weights
    const overallTrendScore = Math.round(
      calculateWeightedTrendScore(platformScores) * 10
    ) / 10;

    // Determine trend level
    let trendLevel: 'hot' | 'warm' | 'stable' | 'cold';
    if (overallTrendScore >= 7.5) {
      trendLevel = 'hot';
    } else if (overallTrendScore >= 5.5) {
      trendLevel = 'warm';
    } else if (overallTrendScore >= 3.5) {
      trendLevel = 'stable';
    } else {
      trendLevel = 'cold';
    }

    // Generate trend reasons
    const trendReasons: TrendReason[] = [];

    // Google Trends analysis
    if (google) {
      if (google.trendDirection === 'rising' && google.averageInterest > 30) {
        trendReasons.push({
          platform: 'google',
          reason: `Search interest is rising with ${google.averageInterest}% relative interest`,
          impact: 'high',
          data: { averageInterest: google.averageInterest, direction: google.trendDirection },
        });
      } else if (google.averageInterest > 50) {
        trendReasons.push({
          platform: 'google',
          reason: `High search volume with ${google.averageInterest}% interest`,
          impact: 'medium',
          data: { averageInterest: google.averageInterest },
        });
      }
    }

    // YouTube analysis
    if (youtube && youtube.totalViews > 500000) {
      const avgViews = Math.round(youtube.totalViews / youtube.totalVideos);
      trendReasons.push({
        platform: 'youtube',
        reason: `${youtube.totalVideos} videos with ${formatNumber(youtube.totalViews)} total views (avg: ${formatNumber(avgViews)})`,
        impact: avgViews > 100000 ? 'high' : 'medium',
        data: { totalViews: youtube.totalViews, avgViews },
      });
    }

    // Pinterest analysis
    if (pinterest && pinterest.totalSaves > 1000) {
      trendReasons.push({
        platform: 'pinterest',
        reason: `${pinterest.totalPins} pins with ${formatNumber(pinterest.totalSaves)} saves`,
        impact: pinterest.avgEngagement > 50 ? 'high' : 'medium',
        data: { totalPins: pinterest.totalPins, totalSaves: pinterest.totalSaves },
      });
    }

    // Reddit analysis
    if (reddit && reddit.totalScore > 500) {
      trendReasons.push({
        platform: 'reddit',
        reason: `${reddit.totalPosts} discussions across ${reddit.subreddits.length} communities`,
        impact: reddit.avgScore > 100 ? 'medium' : 'low',
        data: { totalPosts: reddit.totalPosts, totalScore: reddit.totalScore },
      });
    }

    // Generate social proof summary
    const socialProofSummary = generateSocialProofSummary(
      overallTrendScore,
      trendLevel,
      trendReasons,
      keyword
    );

    return {
      keyword,
      overallTrendScore,
      trendLevel,
      trendReasons,
      socialProofSummary,
      platforms: platformScores,
      platformData: {
        pinterest,
        reddit,
        youtube,
        google,
      },
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Trend aggregation error:', error);
    
    // Return fallback data
    return {
      keyword,
      overallTrendScore: 4.0,
      trendLevel: 'stable',
      trendReasons: [
        {
          platform: 'google',
          reason: 'Unable to fetch real-time trend data',
          impact: 'low',
        }
      ],
      socialProofSummary: `${keyword} shows stable interest across social platforms.`,
      platforms: { pinterest: 4, reddit: 3, youtube: 4, google: 5 },
      platformData: {},
      lastUpdated: new Date().toISOString(),
    };
  }
}

function generateSocialProofSummary(
  score: number,
  level: string,
  reasons: TrendReason[],
  keyword: string
): string {
  const highImpactReasons = reasons.filter(r => r.impact === 'high');
  const mediumImpactReasons = reasons.filter(r => r.impact === 'medium');

  if (level === 'hot') {
    if (highImpactReasons.length >= 2) {
      return `🔥 ${keyword} is trending hot across multiple platforms with strong engagement and rising search interest.`;
    }
    return `🔥 ${keyword} is gaining significant traction with high social engagement.`;
  } else if (level === 'warm') {
    if (highImpactReasons.length >= 1) {
      return `📈 ${keyword} shows strong momentum with notable activity on key platforms.`;
    }
    return `📈 ${keyword} has consistent interest with solid social proof across platforms.`;
  } else if (level === 'stable') {
    if (mediumImpactReasons.length >= 2) {
      return `📊 ${keyword} maintains steady interest with regular discussions and content creation.`;
    }
    return `📊 ${keyword} has stable interest with moderate social activity.`;
  } else {
    return `📉 ${keyword} shows limited social activity and trending signals.`;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Quick score functions for product enrichment
export async function getQuickTrendScore(keyword: string): Promise<number> {
  try {
    // Use faster individual platform functions
    const [pScore, rScore, yScore, gScore] = await Promise.allSettled([
      getPinterestEngagement(keyword),
      getRedditEngagement(keyword),
      getYouTubeEngagement(keyword),
      getGoogleTrendsScore(keyword),
    ]);

    const pinterest = pScore.status === 'fulfilled' ? pScore.value : 4;
    const reddit = rScore.status === 'fulfilled' ? rScore.value : 3;
    const youtube = yScore.status === 'fulfilled' ? yScore.value : 4;
    const google = gScore.status === 'fulfilled' ? gScore.value : 5;

    const weightedScore = 
      google * PLATFORM_WEIGHTS.google +
      youtube * PLATFORM_WEIGHTS.youtube +
      pinterest * PLATFORM_WEIGHTS.pinterest +
      reddit * PLATFORM_WEIGHTS.reddit;

    return Math.round(weightedScore * 10) / 10;
  } catch (error) {
    console.error('Quick trend score error:', error);
    return 4.0; // Fallback score
  }
}

export function getTrendLevelFromScore(score: number): 'hot' | 'warm' | 'stable' | 'cold' {
  if (score >= 7.5) return 'hot';
  if (score >= 5.5) return 'warm';
  if (score >= 3.5) return 'stable';
  return 'cold';
}

// Rate limiting helper
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export function getCachedTrendData(keyword: string): AggregatedTrendData | null {
  const cached = requestCache.get(keyword);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedTrendData(keyword: string, data: AggregatedTrendData): void {
  requestCache.set(keyword, { data, timestamp: Date.now() });
}