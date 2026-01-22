'use client';

interface WhyProxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhyProxModal({ isOpen, onClose }: WhyProxModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Why Prox?</h2>
        <p className="text-neutral-600 mb-6">Finding the right product shouldn't be overwhelming.</p>
        
        <div className="space-y-5">
          {/* Benefit 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Problem-First Approach</h3>
              <p className="text-sm text-neutral-600">Instead of endless browsing, describe your problem and we'll find solutions that actually work.</p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-oak-100 text-oak-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Curated Recommendations</h3>
              <p className="text-sm text-neutral-600">Our AI filters through thousands of products to show you only the best-rated, most relevant options.</p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-sage-100 text-sage-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Save Time & Money</h3>
              <p className="text-sm text-neutral-600">No more buyer's remorse. Find the right product the first time with confidence.</p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-warm-100 text-neutral-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Unbiased Results</h3>
              <p className="text-sm text-neutral-600">We show you products based on quality and fit, not paid placements or sponsorships.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-oak-600 hover:bg-oak-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Finding Products
          </button>
        </div>
      </div>
    </div>
  );
}