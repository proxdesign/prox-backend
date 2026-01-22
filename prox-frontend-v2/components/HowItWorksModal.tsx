'use client';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
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
        <h2 className="text-2xl font-bold text-neutral-800 mb-4">How it Works</h2>
        
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-oak-100 text-oak-700 rounded-full flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Describe Your Problem</h3>
              <p className="text-sm text-neutral-600">Tell us what's bothering you - cluttered counters, tangled cables, pet hair everywhere...</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-oak-100 text-oak-700 rounded-full flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Choose a Product Type</h3>
              <p className="text-sm text-neutral-600">We'll suggest categories of products that can solve your problem.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-oak-100 text-oak-700 rounded-full flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Refine Your Preferences</h3>
              <p className="text-sm text-neutral-600">Select your preferred style, size, or other options to narrow down the results.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-oak-100 text-oak-700 rounded-full flex items-center justify-center font-semibold text-sm">
              4
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800">Shop the Best Products</h3>
              <p className="text-sm text-neutral-600">Browse curated products with ratings, prices, and direct links to purchase.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-oak-600 hover:bg-oak-700 text-white rounded-lg font-medium transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}