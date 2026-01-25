'use client';
import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { BarChart, Users, MessageSquare, Heart, Star, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';

// Hide this admin page in production
if (process.env.NODE_ENV === 'production') {
  notFound();
}

interface AnalyticsData {
  users: {
    total: number;
    newThisWeek: number;
    activeThisWeek: number;
  };
  savedProducts: {
    total: number;
    thisWeek: number;
    topProducts: Array<{
      title: string;
      saves: number;
    }>;
  };
  feedback: {
    productFeedback: Array<{
      feedback_type: string;
      count: number;
    }>;
    conversationFeedback: {
      totalResponses: number;
      averageRating: string;
      ratingDistribution: Array<{
        rating: number;
        count: number;
      }>;
    };
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch multiple analytics endpoints
      const [usersRes, savedRes, productFeedbackRes, conversationFeedbackRes] = await Promise.all([
        fetch(`/api/analytics/users?timeframe=${timeframe}`),
        fetch(`/api/analytics/saved-products?timeframe=${timeframe}`),
        fetch(`/api/feedback/product?timeframe=${timeframe}`),
        fetch(`/api/feedback/conversation?timeframe=${timeframe}`)
      ]);

      const [usersData, savedData, productFeedbackData, conversationFeedbackData] = await Promise.all([
        usersRes.json(),
        savedRes.json(),
        productFeedbackRes.json(),
        conversationFeedbackRes.json()
      ]);

      setData({
        users: usersData,
        savedProducts: savedData,
        feedback: {
          productFeedback: productFeedbackData.feedback || [],
          conversationFeedback: conversationFeedbackData
        }
      });

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const timeframeOptions = [
    { value: '1d', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F2F1' }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#5C7C5C] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#5C7C5C] font-medium">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header */}
      <header className="bg-[#5C7C5C] text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white/80 hover:text-white transition-colors">
                ← Back to App
              </Link>
              <div className="w-px bg-white/20 h-8"></div>
              <div className="flex items-center gap-3">
                <BarChart size={24} />
                <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar size={18} />
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
              >
                {timeframeOptions.map(option => (
                  <option key={option.value} value={option.value} className="text-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-blue-600" size={24} />
                  <h3 className="font-semibold text-gray-900">Total Users</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.users.total}</p>
                <p className="text-sm text-gray-500 mt-1">
                  +{data.users.newThisWeek} new this period
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-green-600" size={24} />
                  <h3 className="font-semibold text-gray-900">Active Users</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.users.activeThisWeek}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.users.total > 0 ? Math.round((data.users.activeThisWeek / data.users.total) * 100) : 0}% of total users
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Heart className="text-red-600" size={24} />
                  <h3 className="font-semibold text-gray-900">Products Saved</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{data.savedProducts.total}</p>
                <p className="text-sm text-gray-500 mt-1">
                  +{data.savedProducts.thisWeek} this period
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="text-yellow-600" size={24} />
                  <h3 className="font-semibold text-gray-900">Avg. Rating</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.feedback.conversationFeedback.averageRating}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.feedback.conversationFeedback.totalResponses} responses
                </p>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Feedback */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} />
                  Product Feedback
                </h3>
                
                {data.feedback.productFeedback.length > 0 ? (
                  <div className="space-y-3">
                    {data.feedback.productFeedback.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {item.feedback_type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#5C7C5C] h-2 rounded-full"
                              style={{ 
                                width: `${Math.min((item.count / Math.max(...data.feedback.productFeedback.map(f => f.count))) * 100, 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No feedback data yet</p>
                )}
              </div>

              {/* Conversation Ratings */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star size={20} />
                  Conversation Ratings
                </h3>
                
                {data.feedback.conversationFeedback.ratingDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const ratingData = data.feedback.conversationFeedback.ratingDistribution.find(r => r.rating === rating);
                      const count = ratingData?.count || 0;
                      const maxCount = Math.max(...data.feedback.conversationFeedback.ratingDistribution.map(r => r.count));
                      
                      return (
                        <div key={rating} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{rating}</span>
                            <div className="flex">
                              {[...Array(rating)].map((_, i) => (
                                <Star key={i} size={12} className="text-yellow-500" fill="currentColor" />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No ratings data yet</p>
                )}
              </div>

              {/* Top Saved Products */}
              {data.savedProducts.topProducts.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart size={20} />
                    Most Saved Products
                  </h3>
                  <div className="space-y-3">
                    {data.savedProducts.topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {product.title}
                        </span>
                        <span className="text-sm font-medium text-gray-900 ml-4">
                          {product.saves} saves
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}