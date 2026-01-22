import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    if (!user) {
      // Return general trending products for anonymous users
      return NextResponse.json({
        recommendations: [],
        message: 'Sign in to get personalized recommendations'
      });
    }

    const preferences = user.preferences || {};
    
    // Get user's saved products to understand preferences
    const savedProductsResult = await db.query(`
      SELECT product_data 
      FROM saved_products 
      WHERE user_id = $1 
      ORDER BY saved_at DESC 
      LIMIT 20
    `, [user.id]);

    // Get user's feedback to understand preferences
    const feedbackResult = await db.query(`
      SELECT feedback_type, product_data, COUNT(*) as count
      FROM product_feedback 
      WHERE user_id = $1 
      GROUP BY feedback_type, product_data
      ORDER BY count DESC
    `, [user.id]);

    // Analyze user preferences from saved products and feedback
    const savedProducts = savedProductsResult.rows.map(row => row.product_data);
    const positiveFeedback = feedbackResult.rows.filter(row => 
      ['helpful', 'purchased'].includes(row.feedback_type)
    );

    // Build recommendation criteria
    const criteria = {
      budgetRange: preferences.budgetRange,
      designStyle: preferences.designStyle || [],
      priorities: preferences.priorities || [],
      favoriteCategories: preferences.favoriteCategories || [],
      homeType: preferences.homeType
    };

    // Generate personalized recommendations based on:
    // 1. User preferences
    // 2. Similar users' saved products
    // 3. Trending products in user's preferred categories
    
    const recommendations = [];

    // Add budget-based recommendations
    if (criteria.budgetRange) {
      const budgetFilter = getBudgetFilter(criteria.budgetRange);
      recommendations.push({
        type: 'budget',
        title: `Great picks in your budget range`,
        description: `Products matching your ${getBudgetLabel(criteria.budgetRange)} budget`,
        criteria: budgetFilter
      });
    }

    // Add style-based recommendations
    if (criteria.designStyle.length > 0) {
      recommendations.push({
        type: 'style',
        title: `${criteria.designStyle[0]} style products`,
        description: `Products matching your design preferences`,
        criteria: { styles: criteria.designStyle }
      });
    }

    // Add category-based recommendations
    if (criteria.favoriteCategories.length > 0) {
      recommendations.push({
        type: 'category',
        title: `More ${criteria.favoriteCategories[0]} products`,
        description: `Popular products in your favorite categories`,
        criteria: { categories: criteria.favoriteCategories }
      });
    }

    // Add similar users recommendations
    if (savedProducts.length > 0) {
      recommendations.push({
        type: 'similar_users',
        title: 'Others also saved',
        description: 'Products saved by users with similar preferences',
        criteria: { similar: true }
      });
    }

    // Add trending recommendations
    recommendations.push({
      type: 'trending',
      title: 'Trending now',
      description: 'Popular products this week',
      criteria: { trending: true }
    });

    return NextResponse.json({
      recommendations: recommendations.slice(0, 5), // Limit to 5 recommendation types
      userPreferences: criteria,
      savedProductCount: savedProducts.length,
      feedbackCount: feedbackResult.rows.length
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

function getBudgetFilter(budgetRange: string) {
  const ranges: { [key: string]: { min: number; max: number } } = {
    'under-25': { min: 0, max: 25 },
    '25-50': { min: 25, max: 50 },
    '50-100': { min: 50, max: 100 },
    '100-250': { min: 100, max: 250 },
    '250-500': { min: 250, max: 500 },
    'over-500': { min: 500, max: 9999 }
  };
  return ranges[budgetRange] || { min: 0, max: 9999 };
}

function getBudgetLabel(budgetRange: string) {
  const labels: { [key: string]: string } = {
    'under-25': 'under $25',
    '25-50': '$25-$50',
    '50-100': '$50-$100',
    '100-250': '$100-$250',
    '250-500': '$250-$500',
    'over-500': '$500+'
  };
  return labels[budgetRange] || 'any budget';
}