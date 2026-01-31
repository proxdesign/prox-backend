'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ExploreCategory, getSearchQueryForCategory } from '../lib/exploreData';

interface Product {
  asin?: string;
  title: string;
  price?: string;
  image?: string;
  rating?: number;
  ratings_total?: number;
  link?: string;
}

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: ExploreCategory | null;
}

export default function BottomDrawer({ isOpen, onClose, category }: BottomDrawerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products when drawer opens with a category
  useEffect(() => {
    if (isOpen && category) {
      fetchProducts(category);
    }
  }, [isOpen, category]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const fetchProducts = async (cat: ExploreCategory) => {
    setLoading(true);
    setError(null);

    try {
      const searchQuery = getSearchQueryForCategory(cat);
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=24`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.link) {
      // Add affiliate tag if not present
      let url = product.link;
      if (!url.includes('tag=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}tag=proxdesign20-20`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white rounded-t-3xl shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ height: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>{category?.icon}</span>
              <span>{category?.name}</span>
            </h2>
            {!loading && products.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {products.length} products
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close drawer"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-6 py-6" style={{ height: 'calc(80vh - 100px)' }}>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Skeleton cards */}
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col animate-pulse"
                >
                  {/* Image skeleton */}
                  <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mb-3 skeleton-shimmer" />
                  {/* Title skeleton */}
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded mb-2 skeleton-shimmer" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3 mb-3 skeleton-shimmer" />
                  {/* Price skeleton */}
                  <div className="mt-auto">
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 skeleton-shimmer" />
                  </div>
                </div>
              ))}
              <style jsx>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
                .skeleton-shimmer {
                  background-size: 200% 100%;
                  animation: shimmer 1.5s infinite;
                }
              `}</style>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => category && fetchProducts(category)}
                className="mt-4 px-4 py-2 bg-[#5C7C5C] text-white rounded-lg hover:bg-[#4a6a4a] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500">No products found for this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <button
                  key={`${product.asin}-${index}`}
                  onClick={() => handleProductClick(product)}
                  className="
                    bg-white rounded-xl border border-gray-100 p-3
                    hover:shadow-lg hover:border-[#5C7C5C]/30
                    transition-all duration-200 text-left
                    flex flex-col
                  "
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                    {product.title}
                  </h3>

                  <div className="mt-auto">
                    {product.price && (
                      <p className="text-lg font-semibold text-gray-900">
                        {product.price}
                      </p>
                    )}

                    {product.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500 text-sm">★</span>
                        <span className="text-sm text-gray-600">
                          {product.rating.toFixed(1)}
                        </span>
                        {product.ratings_total && (
                          <span className="text-xs text-gray-400">
                            ({product.ratings_total.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
