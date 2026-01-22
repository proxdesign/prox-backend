import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { 
      sessionId, 
      userId, 
      rating, 
      feedbackText,
      conversationData 
    } = await request.json();
    
    // Validate required fields
    if (!sessionId || !rating) {
      return NextResponse.json(
        { error: 'Session ID and rating are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Get authenticated user if available
    const authenticatedUser = await getUserFromRequest(request);
    const finalUserId = authenticatedUser?.id || userId || null;

    // Check for duplicate rating (prevent multiple ratings per session)
    const existingRating = await db.query(`
      SELECT id FROM conversation_feedback 
      WHERE session_id = $1
    `, [sessionId]);

    if (existingRating.rows.length > 0) {
      // Update existing rating instead of creating duplicate
      const result = await db.query(`
        UPDATE conversation_feedback 
        SET 
          rating = $1,
          feedback_text = $2,
          conversation_data = $3,
          user_id = $4,
          created_at = NOW()
        WHERE session_id = $5
        RETURNING id, created_at
      `, [
        rating,
        feedbackText || null,
        conversationData ? JSON.stringify(conversationData) : null,
        finalUserId,
        sessionId
      ]);

      return NextResponse.json({
        success: true,
        feedbackId: result.rows[0].id,
        message: 'Rating updated successfully',
        updated: true
      });
    }

    // Insert new conversation feedback
    const result = await db.query(`
      INSERT INTO conversation_feedback (
        session_id,
        user_id,
        rating,
        feedback_text,
        conversation_data,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, created_at
    `, [
      sessionId,
      finalUserId,
      rating,
      feedbackText || null,
      conversationData ? JSON.stringify(conversationData) : null
    ]);

    return NextResponse.json({
      success: true,
      feedbackId: result.rows[0].id,
      message: 'Rating submitted successfully'
    });

  } catch (error) {
    console.error('Conversation feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

// GET - Retrieve conversation feedback analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';

    let timeCondition = "created_at > NOW() - INTERVAL '7 days'";
    if (timeframe === '1d') timeCondition = "created_at > NOW() - INTERVAL '1 day'";
    if (timeframe === '30d') timeCondition = "created_at > NOW() - INTERVAL '30 days'";

    // Get rating distribution
    const ratingsResult = await db.query(`
      SELECT 
        rating,
        COUNT(*) as count,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_count,
        COUNT(CASE WHEN feedback_text IS NOT NULL AND LENGTH(TRIM(feedback_text)) > 0 THEN 1 END) as with_feedback_count
      FROM conversation_feedback 
      WHERE ${timeCondition}
      GROUP BY rating 
      ORDER BY rating DESC
    `);

    // Get average rating and total responses
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_responses,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_responses,
        COUNT(CASE WHEN feedback_text IS NOT NULL AND LENGTH(TRIM(feedback_text)) > 0 THEN 1 END) as responses_with_feedback
      FROM conversation_feedback 
      WHERE ${timeCondition}
    `);

    const stats = statsResult.rows[0];

    return NextResponse.json({
      timeframe,
      stats: {
        totalResponses: parseInt(stats.total_responses),
        averageRating: parseFloat(stats.average_rating || 0).toFixed(2),
        authenticatedResponses: parseInt(stats.authenticated_responses),
        responsesWithFeedback: parseInt(stats.responses_with_feedback)
      },
      ratingDistribution: ratingsResult.rows.map(row => ({
        rating: row.rating,
        count: parseInt(row.count),
        authenticatedCount: parseInt(row.authenticated_count),
        withFeedbackCount: parseInt(row.with_feedback_count)
      }))
    });

  } catch (error) {
    console.error('Conversation feedback analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation analytics' },
      { status: 500 }
    );
  }
}