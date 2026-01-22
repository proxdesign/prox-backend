'use client';

interface CardShelfProps {
  step: 2 | 3;
  items: Array<{
    id: string;
    label: string;
    image?: string;
  }>;
  onSelect: (id: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function CardShelf({ step, items, onSelect, onPrevious, onNext, hasPrevious, hasNext }: CardShelfProps) {
  return (
    <div className="bg-neutral-50 rounded-2xl p-4 sm:p-6">
      <div className="relative pr-16"> {/* Add right padding for arrows */}
        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item, index) => (
            <button
              key={`${item.id}-${item.image ? 'img' : 'no'}-${index}`}
              onClick={() => onSelect(item.id)}
              className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all aspect-square"
            >
              {/* Image or Placeholder */}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-oak-50 to-oak-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-oak-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />

              {/* Chip label */}
              <div className="absolute bottom-2 left-2 right-2">
                <span className="inline-block px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded text-xs font-medium text-neutral-800 shadow-sm truncate max-w-full">
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation Arrows - Right side, stacked */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 flex flex-col gap-2">
          {/* Up/Previous Arrow */}
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              hasPrevious 
                ? 'bg-sage-100 hover:bg-sage-200 text-sage-700 cursor-pointer shadow-sm' 
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Down/Next Arrow */}
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              hasNext 
                ? 'bg-sage-100 hover:bg-sage-200 text-sage-700 cursor-pointer shadow-sm' 
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}