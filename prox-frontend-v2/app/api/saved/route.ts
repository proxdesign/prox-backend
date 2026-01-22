import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

// GET - Get user's saved products
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const result = await db.query(`
      SELECT 
        sp.id,
        sp.product_id,
        sp.saved_at,
        sp.notes,
        sp.list_name,
        sp.product_data
      FROM saved_products sp
      WHERE sp.user_id = $1
      ORDER BY sp.saved_at DESC
    `, [user.id]);
    
    return NextResponse.json({ 
      saved: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Failed to fetch saved products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved products' },
      { status: 500 }
    );
  }
}

// POST - Save a product
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { productId, productData, listName = 'Favorites', notes } = await request.json();
    
    if (!productId || !productData) {
      return NextResponse.json(
        { error: 'Product ID and product data are required' },
        { status: 400 }
      );
    }
    
    // Check if already saved
    const existing = await db.query(
      'SELECT id FROM saved_products WHERE user_id = $1 AND product_id = $2 AND list_name = $3',
      [user.id, productId, listName]
    );
    
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { message: 'Product already saved' },
        { status: 200 }
      );
    }
    
    // Save the product
    const result = await db.query(`
      INSERT INTO saved_products (user_id, product_id, list_name, notes, product_data, saved_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, saved_at
    `, [user.id, productId, listName, notes || null, JSON.stringify(productData)]);
    
    return NextResponse.json({
      success: true,
      saved: result.rows[0],
      message: 'Product saved successfully'
    });
    
  } catch (error) {
    console.error('Failed to save product:', error);
    return NextResponse.json(
      { error: 'Failed to save product' },
      { status: 500 }
    );
  }
}