'use client';

interface Product {
  id: number;
  product_name: string;
  price: number;
  rating: number;
  review_count: number;
  trend_score: number;
  image_url: string;
  affiliate_url: string;
}

interface ProductGridProps {
  products: Product[];
}

const generateTooltip = (product: Product): string => {
  const reasons = [];
  
  if (product.review_count > 1000) {
    reasons.push(`Loved by ${product.review_count.toLocaleString()} people`);
  }
  
  if (product.rating >= 4.5) {
    reasons.push(`Highly rated at ${product.rating}/5 stars`);
  }
  
  if (product.trend_score > 9) {
    reasons.push('Hot trend right now');
  }
  
  if (product.price < 30) {
    reasons.push('Budget-friendly');
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Trending product';
};

export default function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">Products will appear here...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg text-gray-600 font-medium">
          Trending Now
        </h2>
        <span className="text-sm text-gray-500">
          {products.length} products
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {products.map((product, idx) => (
          <div key={product.id || idx} className="group relative">
            <a
              href={product.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Product Image */}
              <div className="aspect-square w-full bg-gray-50">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.product_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-3 space-y-2">
                <h3 className="font-medium text-gray-900 line-clamp-2 leading-tight text-sm">
                  {product.product_name.length > 60 
                    ? product.product_name.substring(0, 60) + '...'
                    : product.product_name
                  }
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-green-600">
                    ${product.price}
                  </span>
                  
                  {product.rating && (
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400 text-sm">⭐</span>
                      <span className="text-xs font-medium text-gray-700">
                        {product.rating}
                      </span>
                      {product.review_count && (
                        <span className="text-xs text-gray-500">
                          ({product.review_count > 999 ? `${Math.round(product.review_count/1000)}k` : product.review_count})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {product.trend_score && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Trending</span>
                      <span className="text-gray-700 font-medium">
                        {Math.round(product.trend_score * 10)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{width: `${Math.min(product.trend_score * 10, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </a>
            
            {/* Hover Tooltip */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs whitespace-nowrap">
                {generateTooltip(product)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {products.length} trending products
        </div>
      )}
    </div>
  );
}