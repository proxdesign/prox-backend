'use client';

import { ExploreCategory } from '../lib/exploreData';

interface CategoryChipProps {
  category: ExploreCategory;
  onClick: (category: ExploreCategory) => void;
}

export default function CategoryChip({ category, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={() => onClick(category)}
      className="
        inline-flex items-center gap-2 px-4 py-2
        bg-white/80 backdrop-blur rounded-full border border-gray-200
        shadow-sm hover:shadow-md hover:border-[#5C7C5C]/40
        hover:bg-white transition-all duration-200
        text-sm font-medium text-gray-700 hover:text-gray-900
      "
    >
      <span>{category.icon}</span>
      <span>{category.name}</span>
    </button>
  );
}
