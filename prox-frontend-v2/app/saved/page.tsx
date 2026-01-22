'use client';
import { useEffect, useState } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { LoginModal } from '@/components/LoginModal';
import { useUser, useAuthHeaders } from '@/contexts/UserContext';

interface SavedProduct {
  id: number;
  product_id: number;
  saved_at: string;
  notes?: string;
  list_name: string;
  product_data: {
    title: string;
    price?: string;
    image?: string;
    link?: string;
    asin?: string;
  };
}

export default function SavedPage() {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isLoading: userLoading, login } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  useEffect(() => {
    if (!userLoading) {
      if (user) {
        fetchSaved();
      } else {
        setLoading(false);
      }
    }
  }, [user, userLoading]);

  const fetchSaved = async () => {
    try {
      const authHeaders = getAuthHeaders();
      const validHeaders: Record<string, string> = {};
      if (authHeaders && authHeaders.Authorization) {
        validHeaders.Authorization = authHeaders.Authorization;
      }
      const response = await fetch('/api/saved', {
        headers: validHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved products');
      }
      
      const data = await response.json();
      setSavedProducts(data.saved || []);
    } catch (error) {
      console.error('Failed to fetch saved products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (productId: number) => {
    setSavedProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const handleLoginRequired = () => {
    setShowLoginModal(true);
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F2F1' }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#5C7C5C] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#5C7C5C] font-medium">Loading your saved products...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#F0F2F1' }}>
          <div className="text-center max-w-md">
            <Heart size={64} className="text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">Sign in to see your saved products</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Create an account to save products and access them anytime. Build your personal collection of home products.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-3 bg-[#5C7C5C] text-white rounded-lg hover:bg-[#4a6a4a] transition-colors font-medium"
              >
                Sign In / Sign Up
              </button>
              <Link 
                href="/"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors font-medium inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={(user) => {
            login(user, localStorage.getItem('prox_token') || '');
            setShowLoginModal(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header */}
      <header className="bg-[#5C7C5C] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href="/"
              className="text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Saved Products</h1>
              <p className="text-white/80">
                {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-6xl mx-auto p-4 py-8">
        {savedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Heart size={64} className="text-gray-300 mx-auto mb-6" />
              <h2 className="text-xl font-medium text-gray-900 mb-3">No saved products yet</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                When you find products you like, tap the heart icon to save them here. 
                Start exploring to build your collection!
              </p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C7C5C] text-white rounded-lg hover:bg-[#4a6a4a] transition-colors font-medium"
              >
                <ArrowLeft size={18} />
                Start Exploring
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Saved Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedProducts.map((savedItem) => {
                const product = {
                  id: savedItem.product_id,
                  title: savedItem.product_data.title,
                  price: savedItem.product_data.price,
                  image: savedItem.product_data.image,
                  link: savedItem.product_data.link,
                  asin: savedItem.product_data.asin
                };

                return (
                  <div key={savedItem.id} className="relative">
                    <ProductCard
                      product={product}
                      initialSaved={true}
                      onSaveChange={(saved) => {
                        if (!saved) handleRemove(savedItem.product_id);
                      }}
                      onLoginRequired={handleLoginRequired}
                    />
                    
                    {/* Saved Date */}
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Saved {new Date(savedItem.saved_at).toLocaleDateString()}
                    </div>
                    
                    {/* Notes */}
                    {savedItem.notes && (
                      <div className="mt-1 text-xs text-gray-600 text-center italic">
                        "{savedItem.notes}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Message */}
            <div className="text-center mt-12 py-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Found something you love? Keep exploring to find more great products!
              </p>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 mt-3 text-[#5C7C5C] hover:underline font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}