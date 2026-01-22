'use client';
import { useState, useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { useUser, useAuthHeaders } from '../contexts/UserContext';
import Link from 'next/link';

interface SavedProduct {
  id: number;
  product_data: {
    title: string;
    price?: string;
    image?: string;
  };
}

export function SavedProductsIndicator() {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  useEffect(() => {
    if (user) {
      fetchRecentSaved();
    }
  }, [user]);

  const fetchRecentSaved = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/saved?limit=3', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedProducts(data.saved?.slice(0, 3) || []);
      }
    } catch (error) {
      console.error('Failed to fetch saved products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) return null;

  if (savedProducts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-[#5C7C5C]/5 to-[#5C7C5C]/10 rounded-lg p-4 border border-[#5C7C5C]/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5C7C5C]/10 rounded-full">
            <Heart size={20} className="text-[#5C7C5C]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Start saving products</h3>
            <p className="text-sm text-gray-600">
              Tap the heart icon on products you like to save them for later
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-[#5C7C5C]" fill="currentColor" />
          <h3 className="font-medium text-gray-900">Your Saved Products</h3>
        </div>
        <Link 
          href="/saved"
          className="text-sm text-[#5C7C5C] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {savedProducts.map((item) => (
          <div key={item.id} className="group relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {item.product_data.image ? (
                <img 
                  src={item.product_data.image} 
                  alt={item.product_data.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Heart size={16} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="mt-1">
              <p className="text-xs text-gray-600 line-clamp-2 leading-tight">
                {item.product_data.title}
              </p>
              {item.product_data.price && (
                <p className="text-xs font-medium text-gray-900 mt-0.5">
                  {item.product_data.price}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles size={14} />
          <span>Products you've saved appear here for quick access</span>
        </div>
      </div>
    </div>
  );
}