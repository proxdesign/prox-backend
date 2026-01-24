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
  // Show empty state when no products found
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-base font-medium text-gray-700 mb-2">No products found</p>
          <p className="text-sm text-gray-500">Sorry, we don't have products for this category yet.</p>
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