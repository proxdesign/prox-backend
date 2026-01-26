'use client';

import { useEffect } from 'react';
import { X, ShoppingBag, MessageCircle } from 'lucide-react';

interface Product {
  id?: number;
  product_name?: string;
  title?: string;
  price?: number | string;
  rating?: number;
  review_count?: number;
  ratings_total?: number;
  image_url?: string;
  image?: string;
  affiliate_url?: string;
  link?: string;
  asin?: string;
}

interface ProductDiscoveryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSeeAll: () => void;
  onNarrowDown: () => void;
}

export default function ProductDiscoveryDrawer({
  isOpen,
  onClose,
  products,
  onSeeAll,
  onNarrowDown,
}: ProductDiscoveryDrawerProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || products.length === 0) return null;

  const previewProducts = products.slice(0, 4);
  const totalCount = products.length;

  const getProductTitle = (product: Product) => product.title || product.product_name || 'Product';
  const getProductImage = (product: Product) => product.image || product.image_url || '';
  const getProductPrice = (product: Product) => {
    if (typeof product.price === 'string') return product.price;
    if (typeof product.price === 'number') return `$${product.price.toFixed(2)}`;
    return '';
  };
  const getProductLink = (product: Product) => product.link || product.affiliate_url || '#';

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
        style={{ maxHeight: '70vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B7355]/10 rounded-full flex items-center justify-center">
              <ShoppingBag size={20} className="text-[#8B7355]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {totalCount} products found
              </h2>
              <p className="text-sm text-gray-500">Based on your conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close drawer"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Product Preview - Horizontal Scroll */}
        <div className="px-5 pb-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {previewProducts.map((product, index) => (
              <a
                key={product.id || product.asin || index}
                href={getProductLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-32 bg-gray-50 rounded-xl p-2 hover:bg-gray-100 transition-colors"
              >
                <div className="aspect-square bg-white rounded-lg mb-2 overflow-hidden">
                  {getProductImage(product) ? (
                    <img
                      src={getProductImage(product)}
                      alt={getProductTitle(product)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-900 font-medium line-clamp-2 mb-1">
                  {getProductTitle(product)}
                </p>
                {getProductPrice(product) && (
                  <p className="text-sm font-semibold text-[#8B7355]">
                    {getProductPrice(product)}
                  </p>
                )}
              </a>
            ))}
            {totalCount > 4 && (
              <button
                onClick={onSeeAll}
                className="flex-shrink-0 w-32 bg-gray-50 rounded-xl p-2 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-[#8B7355]/10 rounded-full flex items-center justify-center mb-2">
                  <span className="text-[#8B7355] font-semibold">+{totalCount - 4}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">See more</p>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-6 space-y-3">
          <button
            onClick={onSeeAll}
            className="w-full bg-[#8B7355] hover:bg-[#7A6449] text-white font-medium py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            <span>See All {totalCount} Products</span>
          </button>
          <button
            onClick={() => {
              onNarrowDown();
              onClose();
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            <span>Keep Narrowing Down</span>
          </button>
        </div>
      </div>

      {/* Hide scrollbar utility */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
