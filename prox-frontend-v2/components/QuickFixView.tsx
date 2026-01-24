'use client';

import { useState } from 'react';
import QuickFixDrawer from './QuickFixDrawer';

export interface QuickFixCategory {
  id: string;
  name: string;
  icon: string;
  searchTerm: string;
  priceRange: string;
  image: string;
}

// Product types with items under $30 - using local solution images
const quickFixCategories: QuickFixCategory[] = [
  // Row 1
  {
    id: 'lazy-susan',
    name: 'Lazy Susans',
    icon: '🔄',
    searchTerm: 'lazy susan kitchen',
    priceRange: '$10-24',
    image: '/images/solutions/lazy-susan.jpg'
  },
  {
    id: 'spice-rack',
    name: 'Spice Racks',
    icon: '🧂',
    searchTerm: 'spice rack kitchen',
    priceRange: '$15-29',
    image: '/images/solutions/tiered-shelf-riser.jpg'
  },
  {
    id: 'under-cabinet-hooks',
    name: 'Under Cabinet Hooks',
    icon: '🪝',
    searchTerm: 'under cabinet hooks kitchen',
    priceRange: '$5-15',
    image: '/images/solutions/under-cabinet-hooks.jpg'
  },
  {
    id: 'utensil-holder',
    name: 'Utensil Holders',
    icon: '🥄',
    searchTerm: 'utensil holder kitchen',
    priceRange: '$15-20',
    image: '/images/solutions/counter-shelf-organizer.jpg'
  },
  // Row 2
  {
    id: 'wall-hooks',
    name: 'Wall Hooks',
    icon: '📌',
    searchTerm: 'adhesive hooks wall',
    priceRange: '$2-20',
    image: '/images/solutions/over-door-clothes-hooks.jpg'
  },
  {
    id: 'coat-racks',
    name: 'Coat Racks',
    icon: '🧥',
    searchTerm: 'coat rack wall mounted',
    priceRange: '$17-26',
    image: '/images/solutions/coat-hooks-shelf.jpg'
  },
  {
    id: 'storage-bins',
    name: 'Storage Bins',
    icon: '📦',
    searchTerm: 'storage bins plastic',
    priceRange: '$15-25',
    image: '/images/solutions/stackable-totes.jpg'
  },
  {
    id: 'under-sink',
    name: 'Under Sink',
    icon: '🚰',
    searchTerm: 'under sink organizer shelf',
    priceRange: '$13-20',
    image: '/images/solutions/expandable-under-sink-shelf.jpg'
  },
  // Row 3
  {
    id: 'shelf-risers',
    name: 'Shelf Risers',
    icon: '📚',
    searchTerm: 'shelf riser cabinet',
    priceRange: '$15-24',
    image: '/images/solutions/tiered-counter-organizer.jpg'
  },
  {
    id: 'cable-clips',
    name: 'Cable Clips',
    icon: '🔌',
    searchTerm: 'cable clips cord management',
    priceRange: '$8-15',
    image: '/images/solutions/cable-clips-velcro.jpg'
  },
  {
    id: 'drawer-organizers',
    name: 'Drawer Organizers',
    icon: '🗄️',
    searchTerm: 'drawer organizer kitchen',
    priceRange: '$12-25',
    image: '/images/solutions/multi-compartment-organizer.jpg'
  },
  {
    id: 'sink-caddies',
    name: 'Sink Caddies',
    icon: '🧽',
    searchTerm: 'sink caddy kitchen sponge',
    priceRange: '$8-18',
    image: '/images/solutions/collapsible-dish-rack.jpg'
  },
];

interface QuickFixViewProps {
  onBack: () => void;
}

export default function QuickFixView({ onBack }: QuickFixViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuickFixCategory | null>(null);

  const handleCategoryClick = (category: QuickFixCategory) => {
    setSelectedCategory(category);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  return (
    <div className="min-h-[60vh] flex flex-col py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-4xl">⚡</span>
          <h1 className="text-3xl font-medium text-gray-900">Quick Fixes</h1>
        </div>
        <p className="text-lg text-gray-600">
          All under $30 — pick a category to browse
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
        {quickFixCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-amber-400/50 transition-all duration-300 aspect-[4/3]"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105 bg-gray-200"
              style={{ backgroundImage: `url(${category.image})` }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 p-3 flex flex-col justify-end text-left">
              <h3 className="font-semibold text-white text-sm mb-0.5 drop-shadow-md">{category.name}</h3>
              <p className="text-xs text-amber-300 font-medium drop-shadow-md">{category.priceRange}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Back Link */}
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to home
        </button>
      </div>

      {/* Drawer */}
      <QuickFixDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        category={selectedCategory}
      />
    </div>
  );
}
