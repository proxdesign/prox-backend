'use client';

import { ExploreCategory } from '../lib/exploreData';

interface CategoryCardProps {
  category: ExploreCategory;
  onClick: (category: ExploreCategory) => void;
  size?: 'small' | 'medium' | 'large';
}

export default function CategoryCard({ category, onClick, size = 'medium' }: CategoryCardProps) {
  const heightClasses = {
    small: 'h-28',
    medium: 'h-32',
    large: 'h-40',
  };

  const titleSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <button
      onClick={() => onClick(category)}
      className={`
        ${heightClasses[size]}
        relative overflow-hidden rounded-2xl border border-gray-100
        shadow-sm hover:shadow-lg hover:-translate-y-1
        hover:border-[#5C7C5C]/30 transition-all duration-300
        flex flex-col justify-end text-left w-full
      `}
    >
      {/* Background Image */}
      {category.image ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${category.image})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 p-3">
        <h3 className={`font-semibold text-white ${titleSizes[size]} drop-shadow-md`}>
          {category.name}
        </h3>
      </div>
    </button>
  );
}
