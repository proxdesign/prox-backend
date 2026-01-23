'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CategoryCard from './CategoryCard';
import CategoryChip from './CategoryChip';
import BottomDrawer from './BottomDrawer';
import Footer from './Footer';
import {
  ExploreCategory,
  homeSpaces,
  homeStyles,
  homeCleaningCategories,
  petCleaningCategories,
  furnitureExploreCategories,
  decorExploreCategories,
  getSearchQueryForCategory,
} from '../lib/exploreData';

export default function ExplorePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExploreCategory | null>(null);

  // Prefetch all categories in background when page loads
  useEffect(() => {
    const allCategories = [
      ...homeSpaces,
      ...homeStyles,
      ...homeCleaningCategories,
      ...petCleaningCategories,
      ...furnitureExploreCategories,
      ...decorExploreCategories,
    ];

    // Prefetch in batches to avoid overwhelming the server
    const prefetchBatch = async (categories: ExploreCategory[], batchIndex: number) => {
      await Promise.all(
        categories.map(cat => {
          const searchQuery = getSearchQueryForCategory(cat);
          // Use fetch with low priority
          return fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=24`, {
            priority: 'low',
          } as RequestInit).catch(() => {}); // Silently ignore errors
        })
      );
    };

    // Start prefetching after a short delay to not block initial render
    const timeoutId = setTimeout(() => {
      const batchSize = 3;
      for (let i = 0; i < allCategories.length; i += batchSize) {
        const batch = allCategories.slice(i, i + batchSize);
        // Stagger batches more to spread load and avoid rate limits
        setTimeout(() => prefetchBatch(batch, i / batchSize), (i / batchSize) * 1000);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleCategoryClick = (category: ExploreCategory) => {
    setSelectedCategory(category);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    // Keep selectedCategory for a moment to allow smooth close animation
    setTimeout(() => setSelectedCategory(null), 300);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header */}
      <header className="px-4 py-6" style={{ backgroundColor: '#718479' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Back to Home */}
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={24} className="text-white" />
            </Link>

            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <img
                src="/logo-white.png"
                alt="Prox"
                className="h-14 w-auto"
              />
              <div className="w-px bg-white/30 h-10" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-light text-white">Explore</h1>
                  <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">beta</span>
                </div>
                <p className="text-white/80 text-sm">Browse by category</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        {/* Section 1: Home Spaces & Styles */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Home Spaces & Styles
          </h2>

          {/* Spaces */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Spaces
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {homeSpaces.map(space => (
                <CategoryCard
                  key={space.id}
                  category={space}
                  onClick={handleCategoryClick}
                  size="small"
                />
              ))}
            </div>
          </div>

          {/* Styles */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Styles
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {homeStyles.map(style => (
                <CategoryCard
                  key={style.id}
                  category={style}
                  onClick={handleCategoryClick}
                  size="small"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Home Cleaning */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Home Cleaning
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {homeCleaningCategories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={handleCategoryClick}
                size="small"
              />
            ))}
          </div>
        </section>

        {/* Section 3: Pet Cleaning */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pet Cleaning
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {petCleaningCategories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={handleCategoryClick}
                size="small"
              />
            ))}
          </div>
        </section>

        {/* Section 4: Browse Products (Chips) */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Browse Products
          </h2>

          {/* Furniture */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Furniture
            </h3>
            <div className="flex flex-wrap gap-2">
              {furnitureExploreCategories.map(category => (
                <CategoryChip
                  key={category.id}
                  category={category}
                  onClick={handleCategoryClick}
                />
              ))}
            </div>
          </div>

          {/* Decor & More */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              Decor & More
            </h3>
            <div className="flex flex-wrap gap-2">
              {decorExploreCategories.map(category => (
                <CategoryChip
                  key={category.id}
                  category={category}
                  onClick={handleCategoryClick}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>

      {/* Bottom Drawer */}
      <BottomDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        category={selectedCategory}
      />
    </div>
  );
}
