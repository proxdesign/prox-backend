'use client';

import { useState } from 'react';

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

interface ProductGridProps {
  products: Product[];
  initialLimit?: number;
}

export default function ProductGrid({ products, initialLimit = 12 }: ProductGridProps) {
  const [showAll, setShowAll] = useState(false);

  if (!products || products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-gray-600 text-lg mb-2">No products found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or browsing categories</p>
        </div>
      </div>
    );
  }

  const displayedProducts = showAll ? products : products.slice(0, initialLimit);
  const hasMore = products.length > initialLimit;

  const getProductName = (product: Product): string => {
    return product.product_name || product.title || 'Product';
  };

  const getProductImage = (product: Product): string | undefined => {
    return product.image_url || product.image;
  };

  const getProductLink = (product: Product): string => {
    return product.affiliate_url || product.link || '#';
  };

  const getProductPrice = (product: Product): string => {
    if (!product.price) return '';
    if (typeof product.price === 'number') return `$${product.price.toFixed(2)}`;
    if (typeof product.price === 'string') {
      if (product.price.startsWith('$')) return product.price;
      return `$${product.price}`;
    }
    return '';
  };

  const getReviewCount = (product: Product): number | undefined => {
    return product.review_count || product.ratings_total;
  };

  return (
    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg text-gray-600 font-medium">
          Products
        </h2>
        <span className="text-sm text-gray-500">
          {products.length} found
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedProducts.map((product, idx) => (
          <a
            key={product.id || product.asin || idx}
            href={getProductLink(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            {/* Product Image */}
            <div className="aspect-square w-full bg-gray-50">
              {getProductImage(product) ? (
                <img
                  src={getProductImage(product)}
                  alt={getProductName(product)}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-4xl">📦</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3 space-y-2">
              <h3 className="font-medium text-gray-900 line-clamp-2 leading-tight text-sm">
                {getProductName(product).length > 60
                  ? getProductName(product).substring(0, 60) + '...'
                  : getProductName(product)
                }
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-green-600">
                  {getProductPrice(product)}
                </span>

                {product.rating && (
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400 text-sm">⭐</span>
                    <span className="text-xs font-medium text-gray-700">
                      {product.rating.toFixed(1)}
                    </span>
                    {getReviewCount(product) && (
                      <span className="text-xs text-gray-500">
                        ({getReviewCount(product)! > 999 ? `${Math.round(getReviewCount(product)!/1000)}k` : getReviewCount(product)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* See More Button */}
      {hasMore && !showAll && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            See more products ({products.length - initialLimit} more)
          </button>
        </div>
      )}
    </div>
  );
}
