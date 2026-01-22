interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
  videoUrl: string;
  duration?: string;
}

interface YouTubeTrendData {
  keyword: string;
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  avgViews: number;
  trendScore: number;
  timeRange: string;
  topVideos: YouTubeVideo[];
  topChannels: string[];
}

export async function getYouTubeTrends(keyword: string): Promise<YouTubeTrendData> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  
  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    console.warn('YouTube Data API key not configured, using mock data');
    return getMockYouTubeData(keyword);
  }

  try {
    // Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=relevance&publishedAfter=${getDateWeeksAgo(4)}&maxResults=50&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!searchResponse.ok) {
      throw new Error(`YouTube search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',') || '';

    if (!videoIds) {
      return getMockYouTubeData(keyword);
    }

    // Get detailed video statistics
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!detailsResponse.ok) {
      throw new Error(`YouTube details API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    const videos: YouTubeVideo[] = detailsData.items?.map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || '',
      description: item.snippet?.description || '',
      channelTitle: item.snippet?.channelTitle || '',
      publishedAt: item.snippet?.publishedAt || '',
      viewCount: parseInt(item.statistics?.viewCount || '0'),
      likeCount: parseInt(item.statistics?.likeCount || '0'),
      commentCount: parseInt(item.statistics?.commentCount || '0'),
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url || '',
      videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
      duration: item.contentDetails?.duration,
    })) || [];

    // Calculate trend metrics
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
    const totalLikes = videos.reduce((sum, video) => sum + video.likeCount, 0);
    const totalComments = videos.reduce((sum, video) => sum + video.commentCount, 0);
    const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;

    // Get unique channels
    const topChannels = [...new Set(videos.map(video => video.channelTitle))]
      .filter(channel => channel)
      .slice(0, 10);

    // Calculate trend score (0-10 scale)
    const viewScore = Math.min((avgViews / 100000) * 4, 4); // Views contribute 4 points max
    const engagementScore = totalViews > 0 ? Math.min(((totalLikes + totalComments) / totalViews) * 100 * 3, 3) : 0; // Engagement 3 points max
    const volumeScore = Math.min(totalVideos / 20, 2); // Volume contributes 2 points max
    const diversityScore = Math.min(topChannels.length / 10, 1); // Diversity contributes 1 point max
    
    const trendScore = Math.min(viewScore + engagementScore + volumeScore + diversityScore, 10);

    return {
      keyword,
      totalVideos,
      totalViews,
      totalLikes,
      totalComments,
      avgViews,
      trendScore: Math.round(trendScore * 10) / 10,
      timeRange: '4w',
      topVideos: videos
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 10),
      topChannels,
    };

  } catch (error) {
    console.error('YouTube API error:', error);
    return getMockYouTubeData(keyword);
  }
}

function getDateWeeksAgo(weeks: number): string {
  const date = new Date();
  date.setDate(date.getDate() - (weeks * 7));
  return date.toISOString();
}

function getMockYouTubeData(keyword: string): YouTubeTrendData {
  const baseScore = 3 + Math.random() * 4; // 3-7 range
  const videoCount = Math.floor(20 + Math.random() * 30);
  const avgViews = Math.floor(10000 + Math.random() * 90000);
  
  const mockChannels = [
    'Product Review Pro', 'Tech Unboxed', 'Home & Living', 'Best Buy Guide',
    'Consumer Reports', 'Honest Reviews', 'Product Hunt TV', 'Lifestyle Labs'
  ];

  return {
    keyword,
    totalVideos: videoCount,
    totalViews: videoCount * avgViews,
    totalLikes: videoCount * Math.floor(avgViews * 0.02), // 2% like rate
    totalComments: videoCount * Math.floor(avgViews * 0.005), // 0.5% comment rate
    avgViews,
    trendScore: Math.round(baseScore * 10) / 10,
    timeRange: '4w',
    topVideos: Array.from({ length: 8 }, (_, i) => ({
      id: `mock_video_${i}`,
      title: `${keyword} Review - Is It Worth Buying? (${new Date().getFullYear()})`,
      description: `In this video, I review the ${keyword} and share my honest thoughts...`,
      channelTitle: mockChannels[i % mockChannels.length],
      publishedAt: new Date(Date.now() - Math.random() * 28 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: Math.floor(5000 + Math.random() * 500000),
      likeCount: Math.floor(100 + Math.random() * 5000),
      commentCount: Math.floor(20 + Math.random() * 500),
      thumbnailUrl: `https://images.unsplash.com/photo-${1600000000 + i}?w=320&h=180&fit=crop`,
      videoUrl: `https://youtube.com/watch?v=mock_${i}`,
      duration: 'PT' + Math.floor(3 + Math.random() * 15) + 'M' + Math.floor(Math.random() * 60) + 'S',
    })),
    topChannels: mockChannels.slice(0, 5),
  };
}

export async function getYouTubeEngagement(productTitle: string): Promise<number> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  
  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    return 3 + Math.random() * 4; // Mock score 3-7
  }

  try {
    const trends = await getYouTubeTrends(productTitle);
    return trends.trendScore;
  } catch (error) {
    console.error('YouTube engagement error:', error);
    return 3 + Math.random() * 4;
  }
}

export async function searchYouTubeForProduct(productTitle: string): Promise<YouTubeVideo[]> {
  try {
    const trends = await getYouTubeTrends(productTitle);
    return trends.topVideos;
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

// Helper function to parse YouTube duration format (PT4M13S -> 4:13)
export function parseDuration(duration?: string): string {
  if (!duration) return '0:00';
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}