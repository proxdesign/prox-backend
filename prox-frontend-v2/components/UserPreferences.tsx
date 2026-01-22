'use client';
import { useState, useEffect } from 'react';
import { Settings, Home, DollarSign, Palette, Star, Save } from 'lucide-react';
import { useUser, useAuthHeaders } from '../contexts/UserContext';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Preferences {
  homeType: string;
  budgetRange: string;
  designStyle: string[];
  priorities: string[];
  priceAlerts: boolean;
  emailNotifications: boolean;
  favoriteCategories: string[];
}

const defaultPreferences: Preferences = {
  homeType: '',
  budgetRange: '',
  designStyle: [],
  priorities: [],
  priceAlerts: false,
  emailNotifications: false,
  favoriteCategories: []
};

export function UserPreferences({ isOpen, onClose }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const { user, updateUser } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  // Load user preferences on mount
  useEffect(() => {
    if (isOpen && user?.preferences) {
      setPreferences({ ...defaultPreferences, ...user.preferences });
    }
  }, [isOpen, user]);

  const homeTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' }
  ];

  const budgetRanges = [
    { value: 'under-25', label: 'Under $25' },
    { value: '25-50', label: '$25 - $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100-250', label: '$100 - $250' },
    { value: '250-500', label: '$250 - $500' },
    { value: 'over-500', label: '$500+' }
  ];

  const designStyles = [
    'Modern', 'Minimalist', 'Scandinavian', 'Industrial', 
    'Bohemian', 'Traditional', 'Rustic', 'Contemporary',
    'Mid-Century', 'Farmhouse', 'Eclectic', 'Vintage'
  ];

  const priorityOptions = [
    'Space Saving', 'Organization', 'Aesthetics', 'Durability',
    'Easy to Clean', 'Multi-functional', 'Eco-friendly', 'Quick Setup'
  ];

  const categories = [
    'Kitchen', 'Bedroom', 'Living Room', 'Bathroom', 'Office',
    'Storage', 'Cleaning', 'Pet Supplies', 'Outdoor', 'Lighting'
  ];

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      // Update user context
      updateUser({ preferences });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArrayValue = (array: string[], value: string) => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="text-[#5C7C5C]" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Help us personalize your product recommendations
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Home Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
              <Home size={16} />
              What type of home do you live in?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {homeTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPreferences(prev => ({ ...prev, homeType: type.value }))}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    preferences.homeType === type.value
                      ? 'border-[#5C7C5C] bg-[#5C7C5C]/10 text-[#5C7C5C]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
              <DollarSign size={16} />
              Typical budget range for home products?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {budgetRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setPreferences(prev => ({ ...prev, budgetRange: range.value }))}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    preferences.budgetRange === range.value
                      ? 'border-[#5C7C5C] bg-[#5C7C5C]/10 text-[#5C7C5C]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Design Style */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
              <Palette size={16} />
              Design styles you like (select multiple)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {designStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => setPreferences(prev => ({ 
                    ...prev, 
                    designStyle: toggleArrayValue(prev.designStyle, style)
                  }))}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    preferences.designStyle.includes(style)
                      ? 'border-[#5C7C5C] bg-[#5C7C5C]/10 text-[#5C7C5C]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Priorities */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
              <Star size={16} />
              What's most important to you?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {priorityOptions.map((priority) => (
                <button
                  key={priority}
                  onClick={() => setPreferences(prev => ({ 
                    ...prev, 
                    priorities: toggleArrayValue(prev.priorities, priority)
                  }))}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    preferences.priorities.includes(priority)
                      ? 'border-[#5C7C5C] bg-[#5C7C5C]/10 text-[#5C7C5C]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Favorite Categories */}
          <div>
            <label className="text-sm font-medium text-gray-900 mb-3 block">
              Categories you're most interested in
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setPreferences(prev => ({ 
                    ...prev, 
                    favoriteCategories: toggleArrayValue(prev.favoriteCategories, category)
                  }))}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    preferences.favoriteCategories.includes(category)
                      ? 'border-[#5C7C5C] bg-[#5C7C5C]/10 text-[#5C7C5C]'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <label className="text-sm font-medium text-gray-900 mb-3 block">
              Notification Preferences
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.priceAlerts}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    priceAlerts: e.target.checked 
                  }))}
                  className="w-4 h-4 text-[#5C7C5C] border-gray-300 rounded focus:ring-[#5C7C5C]"
                />
                <span className="text-sm text-gray-700">
                  Price drop alerts for saved products
                </span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    emailNotifications: e.target.checked 
                  }))}
                  className="w-4 h-4 text-[#5C7C5C] border-gray-300 rounded focus:ring-[#5C7C5C]"
                />
                <span className="text-sm text-gray-700">
                  Weekly product recommendations via email
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                saved 
                  ? 'bg-green-600'
                  : 'bg-[#5C7C5C] hover:bg-[#4a6a4a]'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  ✓ Saved!
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}