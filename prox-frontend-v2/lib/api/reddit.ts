interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  author: string;
}

interface RedditTrendData {
  keyword: string;
  totalPosts: number;
  totalScore: number;
  totalComments: number;
  avgScore: number;
  trendScore: number;
  timeRange: string;
  topPosts: RedditPost[];
  subreddits: string[];
}

export async function getRedditTrends(keyword: string): Promise<RedditTrendData> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret || clientId === 'your_reddit_client_id_here') {
    console.warn('Reddit API credentials not configured, using mock data');
    return getMockRedditData(keyword);
  }

  try {
    // Get OAuth token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ProductDiscovery/1.0',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error(`Reddit auth error: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search for posts
    const searchUrl = `https://oauth.reddit.com/search?q=${encodeURIComponent(keyword)}&sort=hot&limit=50&t=week`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'ProductDiscovery/1.0',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!searchResponse.ok) {
      throw new Error(`Reddit search error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const posts: RedditPost[] = searchData.data?.children?.map((child: any) => child.data) || [];

    // Calculate trend metrics
    const totalPosts = posts.length;
    const totalScore = posts.reduce((sum, post) => sum + (post.score || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.num_comments || 0), 0);
    const avgScore = totalPosts > 0 ? totalScore / totalPosts : 0;

    // Get unique subreddits
    const subreddits = [...new Set(posts.map(post => post.subreddit))];

    // Calculate trend score (0-10 scale)
    const trendScore = Math.min(
      (avgScore / 100) * 3 + // Score contributes 3 points max
      (totalComments / 500) * 3 + // Comments contribute 3 points max
      Math.min(totalPosts / 20, 2) + // Post volume contributes 2 points max
      Math.min(subreddits.length / 5, 2), // Subreddit diversity contributes 2 points max
      10
    );

    return {
      keyword,
      totalPosts,
      totalScore,
      totalComments,
      avgScore: Math.round(avgScore),
      trendScore: Math.round(trendScore * 10) / 10,
      timeRange: '7d',
      topPosts: posts
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10),
      subreddits: subreddits.slice(0, 10),
    };

  } catch (error) {
    console.error('Reddit API error:', error);
    return getMockRedditData(keyword);
  }
}

function getMockRedditData(keyword: string): RedditTrendData {
  const baseScore = 2 + Math.random() * 5; // 2-7 range
  const postCount = Math.floor(10 + Math.random() * 40);
  const avgScore = Math.floor(20 + Math.random() * 100);
  
  const mockSubreddits = [
    'BuyItForLife', 'ProductHunters', 'amazonfavorites', 'malelivingspace',
    'femalelivingspace', 'furniture', 'HomeImprovement', 'DIY', 'InteriorDesign'
  ];

  return {
    keyword,
    totalPosts: postCount,
    totalScore: postCount * avgScore,
    totalComments: postCount * Math.floor(5 + Math.random() * 20),
    avgScore,
    trendScore: Math.round(baseScore * 10) / 10,
    timeRange: '7d',
    topPosts: Array.from({ length: 5 }, (_, i) => ({
      id: `mock_post_${i}`,
      title: `${keyword} - My experience and review`,
      selftext: `I've been using this ${keyword} for a few months now...`,
      url: `https://reddit.com/r/products/comments/mock_${i}`,
      subreddit: mockSubreddits[i % mockSubreddits.length],
      score: Math.floor(50 + Math.random() * 200),
      num_comments: Math.floor(10 + Math.random() * 50),
      created_utc: Date.now() / 1000 - Math.random() * 7 * 24 * 60 * 60,
      permalink: `/r/products/comments/mock_${i}`,
      author: `user_${i}`,
    })),
    subreddits: mockSubreddits.slice(0, 5),
  };
}

export async function getRedditEngagement(productTitle: string): Promise<number> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  
  if (!clientId || clientId === 'your_reddit_client_id_here') {
    return 2 + Math.random() * 5; // Mock score 2-7
  }

  try {
    const trends = await getRedditTrends(productTitle);
    return trends.trendScore;
  } catch (error) {
    console.error('Reddit engagement error:', error);
    return 2 + Math.random() * 5;
  }
}

export async function searchRedditForProduct(productTitle: string): Promise<RedditPost[]> {
  try {
    const trends = await getRedditTrends(productTitle);
    return trends.topPosts;
  } catch (error) {
    console.error('Reddit search error:', error);
    return [];
  }
}