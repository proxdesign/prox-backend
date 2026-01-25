'use client';

import ProductCard from './ProductCard';

interface Product {
  id?: number;
  product_name?: string;
  title?: string;
  price?: number | string;
  rating?: number;
  review_count?: number;
  ratings_total?: number;
  trend_score?: number;
  image_url?: string;
  image?: string;
  affiliate_url?: string;
  link?: string;
  asin?: string;
}

interface ProductPreviewProps {
  products: Product[];
  onSeeAll: () => void;
}

export default function ProductPreview({ products, onSeeAll }: ProductPreviewProps) {
  // Show default state when no products yet
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top picks for you</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Products will appear here as we chat</p>
        </div>
      </div>
    );
  }

  // Show up to 3 products
  const previewProducts = products.slice(0, 3);
  const totalCount = products.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Top picks for you</h3>
          <span className="px-2.5 py-1 bg-oak-100 text-oak-700 text-sm font-medium rounded-full">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Product Cards - Horizontal Layout */}
      <div className="space-y-4 mb-6">
        {previewProducts.map((product, index) => (
          <div key={product.id || product.asin || index} className="border border-gray-100 rounded-lg">
            <ProductCard 
              product={product}
              layout="compact"
            />
          </div>
        ))}
      </div>

      {/* See All Button */}
      <button
        onClick={onSeeAll}
        className="w-full bg-gradient-to-r from-oak-500 to-oak-600 hover:from-oak-600 hover:to-oak-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        <span>See all {totalCount} solutions</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 text-center mt-3">
        These are our top recommendations based on your conversation
      </p>
    </div>
  );
}