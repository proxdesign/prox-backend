'use client';

import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';

interface Filter {
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: Filter[];
  onRemove: (label: string) => void;
  onAdd?: (filter: Filter) => void;
}

export default function FilterBar({ filters, onRemove, onAdd }: FilterBarProps) {
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);

  const styleOptions = ['Modern', 'Traditional', 'Rustic', 'Minimalist', 'Industrial'];
  
  // Check if style filter already exists
  const hasStyleFilter = filters.some(f => f.label.toLowerCase() === 'style');

  const handleAddStyle = (style: string) => {
    if (onAdd && !hasStyleFilter) {
      onAdd({ label: 'Style', value: style });
    }
    setShowStyleDropdown(false);
  };

  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 flex-shrink-0">Filters:</span>
        
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <div
              key={filter.label}
              className="flex items-center gap-1.5 bg-sage-100 hover:bg-sage-150 text-sage-700 px-3 py-1.5 rounded-full text-sm font-medium border border-sage-200 transition-colors flex-shrink-0 group"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-sage-600 font-medium">{filter.label}:</span>
                <span>{filter.value}</span>
              </span>
              <button
                onClick={() => onRemove(filter.label)}
                className="ml-1 p-0.5 hover:bg-sage-200 rounded-full transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X size={12} className="text-sage-600 hover:text-sage-800" />
              </button>
            </div>
          ))}
          
          {/* Add Filter Button with Style Dropdown */}
          {onAdd && !hasStyleFilter && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-150 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 transition-colors"
              >
                <Plus size={14} />
                <span>Add style</span>
                <ChevronDown size={12} className={`transition-transform ${showStyleDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Style Dropdown */}
              {showStyleDropdown && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowStyleDropdown(false)}
                  />
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 font-medium px-2 py-1 mb-1">Style</div>
                      {styleOptions.map((style) => (
                        <button
                          key={style}
                          onClick={() => handleAddStyle(style)}
                          className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results count - can be added later */}
      <div className="mt-2 text-xs text-gray-500">
        {filters.length === 1 ? '1 filter applied' : `${filters.length} filters applied`}
      </div>
    </div>
  );
}