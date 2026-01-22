import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { 
      productId, 
      sessionId, 
      userId, 
      feedbackType, 
      feedbackText,
      productData 
    } = await request.json();
    
    // Validate required fields
    if (!productId || !feedbackType) {
      return NextResponse.json(
        { error: 'Product ID and feedback type are required' },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validFeedbackTypes = [
      'helpful', 
      'not_helpful', 
      'too_expensive', 
      'wrong_style', 
      'wrong_size', 
      'purchased'
    ];

    if (!validFeedbackTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Get user from request if available (for authenticated feedback)
    const authenticatedUser = await getUserFromRequest(request);
    const finalUserId = authenticatedUser?.id || userId || null;

    // Check for duplicate feedback (prevent spam)
    if (finalUserId) {
      const existingFeedback = await db.query(`
        SELECT id FROM product_feedback 
        WHERE user_id = $1 AND product_id = $2 AND feedback_type = $3 
        AND created_at > NOW() - INTERVAL '1 hour'
      `, [finalUserId, productId, feedbackType]);

      if (existingFeedback.rows.length > 0) {
        return NextResponse.json(
          { message: 'Feedback already recorded' },
          { status: 200 }
        );
      }
    }

    // Insert feedback
    const result = await db.query(`
      INSERT INTO product_feedback (
        user_id, 
        product_id, 
        session_id, 
        feedback_type, 
        feedback_text, 
        product_data, 
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at
    `, [
      finalUserId,
      productId.toString(),
      sessionId || null,
      feedbackType,
      feedbackText || null,
      productData ? JSON.stringify(productData) : null
    ]);

    return NextResponse.json({
      success: true,
      feedbackId: result.rows[0].id,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Product feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// GET - Retrieve feedback analytics (optional, for admin use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const timeframe = searchParams.get('timeframe') || '7d';

    let timeCondition = "created_at > NOW() - INTERVAL '7 days'";
    if (timeframe === '1d') timeCondition = "created_at > NOW() - INTERVAL '1 day'";
    if (timeframe === '30d') timeCondition = "created_at > NOW() - INTERVAL '30 days'";

    let query = `
      SELECT 
        feedback_type,
        COUNT(*) as count,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_count
      FROM product_feedback 
      WHERE ${timeCondition}
    `;
    
    const params = [];
    
    if (productId) {
      query += ' AND product_id = $1';
      params.push(productId);
    }
    
    query += ' GROUP BY feedback_type ORDER BY count DESC';

    const result = await db.query(query, params);

    return NextResponse.json({
      feedback: result.rows,
      timeframe,
      productId: productId || 'all'
    });

  } catch (error) {
    console.error('Feedback analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback analytics' },
      { status: 500 }
    );
  }
}