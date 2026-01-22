import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';

    let timeCondition = "saved_at > NOW() - INTERVAL '7 days'";
    
    if (timeframe === '1d') {
      timeCondition = "saved_at > NOW() - INTERVAL '1 day'";
    } else if (timeframe === '30d') {
      timeCondition = "saved_at > NOW() - INTERVAL '30 days'";
    }

    // Get total saved products
    const totalResult = await db.query('SELECT COUNT(*) as total FROM saved_products');
    const total = parseInt(totalResult.rows[0].total);

    // Get saved products in timeframe
    const timeframeResult = await db.query(`
      SELECT COUNT(*) as timeframe_total 
      FROM saved_products 
      WHERE ${timeCondition}
    `);
    const thisWeek = parseInt(timeframeResult.rows[0].timeframe_total);

    // Get top saved products by title from product_data
    const topProductsResult = await db.query(`
      SELECT 
        product_data->>'title' as title,
        COUNT(*) as saves
      FROM saved_products 
      WHERE product_data->>'title' IS NOT NULL
      GROUP BY product_data->>'title'
      ORDER BY saves DESC
      LIMIT 10
    `);

    // Get saves by category if available
    const categoryResult = await db.query(`
      SELECT 
        list_name,
        COUNT(*) as saves
      FROM saved_products 
      GROUP BY list_name
      ORDER BY saves DESC
    `);

    // Get saves over time
    const timeSeriesResult = await db.query(`
      SELECT 
        DATE(saved_at) as date,
        COUNT(*) as saves
      FROM saved_products 
      WHERE ${timeCondition}
      GROUP BY DATE(saved_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    return NextResponse.json({
      total,
      thisWeek,
      topProducts: topProductsResult.rows.map(row => ({
        title: row.title || 'Unknown Product',
        saves: parseInt(row.saves)
      })),
      byCategory: categoryResult.rows.map(row => ({
        category: row.list_name,
        saves: parseInt(row.saves)
      })),
      timeSeries: timeSeriesResult.rows.map(row => ({
        date: row.date,
        saves: parseInt(row.saves)
      })),
      timeframe
    });

  } catch (error) {
    console.error('Saved products analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve saved products analytics' },
      { status: 500 }
    );
  }
}