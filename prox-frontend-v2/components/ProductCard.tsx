'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { generateMockTrendData } from '../lib/mockData';
import { useUser, useAuthHeaders } from '../contexts/UserContext';
import { trackAffiliateClick, trackProductSave, trackProductUnsave, trackProductClick, trackError } from '@/lib/analytics';

interface Product {
  id?: number;
  asin?: string;
  title: string;
  price?: string;
  image?: string;
  rating?: number;
  ratings_total?: number;
  link?: string;
}

interface ProductCardProps {
  product: Product;
  initialSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
  onLoginRequired?: () => void;
}

export default function ProductCard({ 
  product, 
  initialSaved = false, 
  onSaveChange,
  onLoginRequired 
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
  const trendData = generateMockTrendData(product);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  
  const affiliateTag = process.env.NEXT_PUBLIC_AFFILIATE_TAG || 'yourtag-20';
  const affiliateLink = product.link?.includes('?') 
    ? `${product.link}&tag=${affiliateTag}`
    : `${product.link}?tag=${affiliateTag}`;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      onLoginRequired?.();
      return;
    }
    
    if (!product.id) {
      console.error('Product ID is required to save');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isSaved) {
        // Remove from saved
        const response = await fetch(`/api/saved/${product.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove from saved');
        }
      } else {
        // Add to saved
        const response = await fetch('/api/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ 
            productId: product.id,
            productData: {
              title: product.title,
              price: product.price,
              image: product.image,
              link: product.link,
              asin: product.asin
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save product');
        }
      }
      
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);
      onSaveChange?.(newSavedState);
      
      // Track save/unsave action
      if (newSavedState) {
        trackProductSave(product.id, product.title);
      } else {
        trackProductUnsave(product.id, product.title);
      }
    } catch (error) {
      console.error('Save operation failed:', error);
      trackError('product_save_error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAffiliateClick = () => {
    // Track affiliate click
    if (product.id) {
      trackAffiliateClick(product.id, product.title, 'amazon');
      trackProductClick(product.id, product.title, 'product_card');
    }
  };

  return (
    <div 
      className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Save Button - Top Left */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`absolute top-3 left-3 z-10 p-2 rounded-full transition-all duration-200 ${
          isSaved 
            ? 'bg-red-50 text-red-500 scale-110' 
            : 'bg-white/80 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-white/90'
        } ${isSaving ? 'animate-pulse' : ''}`}
      >
        <Heart 
          size={18} 
          fill={isSaved ? 'currentColor' : 'none'}
          strokeWidth={isSaved ? 0 : 2}
        />
      </button>

      {/* Image Container - Natural aspect ratio */}
      <a 
        href={affiliateLink} 
        target="_blank" 
        rel="noopener noreferrer sponsored"
        onClick={handleAffiliateClick}
      >
        <div className="relative">
          <img 
            src={product.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'} 
            alt={product.title}
            className="w-full object-cover"
            style={{ minHeight: '180px', maxHeight: '350px' }}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800';
            }}
          />

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <span className="bg-white text-neutral-900 px-4 py-2 rounded-full font-medium text-sm shadow-lg">
              View on Amazon
            </span>
          </div>
        </div>
      </a>

      {/* Compact Info */}
      <div className="p-3">
        {/* Title - 2 lines max */}
        <h3 className="font-medium text-neutral-900 text-sm leading-tight line-clamp-2 mb-1">
          {product.title}
        </h3>
        
        {/* Price and Rating Row */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-neutral-900">
            {product.price || 'See Price'}
          </span>
          
          {product.rating && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <span className="text-amber-500">★</span>
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Affiliate indicator - subtle */}
        <p className="text-[10px] text-neutral-400 mt-1">Affiliate link</p>
      </div>
    </div>
  );
}