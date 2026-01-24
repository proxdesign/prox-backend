// Consolidated data for the Explore page sections

import { styleCategories } from './styleDetection';
import { furnitureCategories, decorCategories, ProductCategory } from './productTaxonomy';

export interface ExploreCategory {
  id: string;
  name: string;
  keywords: string[];
  icon: string;
  image?: string; // Optional background image URL
  type: 'space' | 'style' | 'cleaning' | 'gardening' | 'pet' | 'furniture' | 'decor';
  problemId?: string; // Maps to mockData problem ID for solution-based categories
}

// Section 1: Home Spaces
export const homeSpaces: ExploreCategory[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    keywords: ['kitchen', 'pantry', 'counter organizer'],
    icon: '🍳',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80',
    type: 'space'
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    keywords: ['bathroom', 'shower', 'vanity'],
    icon: '🚿',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&h=300&fit=crop&q=80',
    type: 'space'
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    keywords: ['bedroom', 'closet', 'nightstand'],
    icon: '🛏️',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&h=300&fit=crop&q=80',
    type: 'space'
  },
  {
    id: 'home-office',
    name: 'Home Office',
    keywords: ['desk', 'office', 'cable management'],
    icon: '💻',
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop&q=80',
    type: 'space'
  },
  {
    id: 'living-room',
    name: 'Living Room',
    keywords: ['sofa', 'couch', 'coffee table'],
    icon: '🛋️',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop&q=80',
    type: 'space'
  },
  {
    id: 'entryway',
    name: 'Entryway',
    keywords: ['entryway', 'shoe rack', 'coat hooks'],
    icon: '🚪',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&h=300&fit=crop&q=80',
    type: 'space'
  },
  {
    id: 'storage',
    name: 'Storage',
    keywords: ['storage', 'bins', 'closet organizer'],
    icon: '📦',
    image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400&h=300&fit=crop&q=80',
    type: 'space'
  },
];

// Section 1: Home Styles (converted from styleCategories)
export const homeStyles: ExploreCategory[] = styleCategories.map(style => ({
  id: style.id,
  name: style.name,
  keywords: [...style.keywords, 'furniture', 'decor'],
  icon: getStyleIcon(style.id),
  image: getStyleImage(style.id),
  type: 'style' as const
}));

function getStyleIcon(styleId: string): string {
  const icons: Record<string, string> = {
    'modern': '◼️',
    'rustic': '🪵',
    'industrial': '⚙️',
    'traditional': '🏛️',
    'minimalist': '⬜',
    'bohemian': '🌿',
  };
  return icons[styleId] || '🏠';
}

function getStyleImage(styleId: string): string {
  const images: Record<string, string> = {
    'modern': 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&h=300&fit=crop&q=80',
    'rustic': 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=400&h=300&fit=crop&q=80',
    'industrial': 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop&q=80',
    'traditional': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop&q=80',
    'minimalist': 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400&h=300&fit=crop&q=80',
    'bohemian': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop&q=80',
  };
  return images[styleId] || '';
}

// Section 2: Home Cleaning
export const homeCleaningCategories: ExploreCategory[] = [
  {
    id: 'grout-tile',
    name: 'Grout & Tile',
    keywords: ['grout', 'tile cleaner'],
    icon: '🧱',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop&q=80',
    type: 'cleaning',
    problemId: 'dirty-grout'
  },
  {
    id: 'windows-glass',
    name: 'Windows & Glass',
    keywords: ['window', 'glass cleaner'],
    icon: '🪟',
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0f55?w=400&h=300&fit=crop&q=80',
    type: 'cleaning',
    problemId: 'streaky-windows'
  },
  {
    id: 'dust-allergies',
    name: 'Dust & Allergies',
    keywords: ['air purifier', 'HEPA vacuum', 'allergen reducer'],
    icon: '🌬️',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop&q=80',
    type: 'cleaning',
    problemId: 'dust-allergies'
  },
  {
    id: 'bathroom-cleaning',
    name: 'Bathroom Cleaning',
    keywords: ['bathroom', 'shower cleaner'],
    icon: '🚿',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop&q=80',
    type: 'cleaning',
    problemId: 'soap-scum-hard-water'
  },
  {
    id: 'quick-clean',
    name: 'Quick Clean',
    keywords: ['vacuum', 'mop', 'cleaning'],
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=300&fit=crop&q=80',
    type: 'cleaning',
    problemId: 'cleaning-takes-too-long'
  },
  {
    id: 'stain-removal',
    name: 'Stain Removal',
    keywords: ['fabric stain remover', 'carpet stain cleaner', 'upholstery cleaner'],
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=400&h=300&fit=crop&q=80',
    type: 'cleaning',
    problemId: 'clothing-stains'
  },
];

// Section 3: Gardening & Outdoor
export const gardeningCategories: ExploreCategory[] = [
  {
    id: 'planters-pots',
    name: 'Planters & Pots',
    keywords: ['indoor planter', 'plant pot', 'ceramic planter'],
    icon: '🪴',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop&q=80',
    type: 'gardening'
  },
  {
    id: 'garden-tools',
    name: 'Garden Tools',
    keywords: ['garden tool set', 'pruning shears', 'gardening gloves'],
    icon: '🧤',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&q=80',
    type: 'gardening'
  },
  {
    id: 'watering',
    name: 'Watering',
    keywords: ['watering can', 'plant watering system', 'garden hose'],
    icon: '💧',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=300&fit=crop&q=80',
    type: 'gardening'
  },
  {
    id: 'plant-care',
    name: 'Plant Care',
    keywords: ['plant food fertilizer', 'potting soil', 'plant stakes'],
    icon: '🌱',
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=300&fit=crop&q=80',
    type: 'gardening'
  },
  {
    id: 'outdoor-decor',
    name: 'Outdoor Decor',
    keywords: ['garden decor', 'outdoor solar lights', 'garden statue'],
    icon: '🏡',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80',
    type: 'gardening'
  },
  {
    id: 'herb-garden',
    name: 'Herb Garden',
    keywords: ['herb garden kit', 'indoor herb planter', 'herb growing'],
    icon: '🌿',
    image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=400&h=300&fit=crop&q=80',
    type: 'gardening'
  },
];

// Section 4: Pet Cleaning
export const petCleaningCategories: ExploreCategory[] = [
  {
    id: 'pet-hair',
    name: 'Pet Hair',
    keywords: ['pet hair remover', 'fur removal brush', 'lint roller pet'],
    icon: '🐕',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&q=80',
    type: 'pet',
    problemId: 'pet-hair-everywhere'
  },
  {
    id: 'litter-odor',
    name: 'Litter & Odor',
    keywords: ['cat litter box', 'litter odor control', 'cat litter deodorizer'],
    icon: '🐱',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop&q=80',
    type: 'pet',
    problemId: 'litter-box-odor'
  },
  {
    id: 'paw-care',
    name: 'Paw Care',
    keywords: ['dog paw cleaner', 'paw washer', 'muddy paw cleaner'],
    icon: '🐾',
    image: 'https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=400&h=300&fit=crop&q=80',
    type: 'pet',
    problemId: 'muddy-paws'
  },
  {
    id: 'feeding',
    name: 'Feeding',
    keywords: ['pet food bowl', 'dog feeder', 'elevated pet bowl'],
    icon: '🍽️',
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&h=300&fit=crop&q=80',
    type: 'pet',
    problemId: 'messy-feeding-area'
  },
  {
    id: 'pet-stains',
    name: 'Pet Stains',
    keywords: ['pet stain remover', 'enzyme cleaner pet', 'pet urine cleaner'],
    icon: '💧',
    image: 'https://images.unsplash.com/photo-1587764379873-97837921fd44?w=400&h=300&fit=crop&q=80',
    type: 'pet',
    problemId: 'pet-urine-stains'
  },
];

// Section 4: Furniture (from productTaxonomy)
export const furnitureExploreCategories: ExploreCategory[] = furnitureCategories.map(cat => ({
  id: cat.id,
  name: cat.name,
  keywords: cat.keywords,
  icon: cat.icon || '🪑',
  type: 'furniture' as const
}));

// Section 4: Decor (from productTaxonomy)
export const decorExploreCategories: ExploreCategory[] = decorCategories.map(cat => ({
  id: cat.id,
  name: cat.name,
  keywords: cat.keywords,
  icon: cat.icon || '🏠',
  type: 'decor' as const
}));

// Helper to get all categories
export function getAllExploreCategories(): ExploreCategory[] {
  return [
    ...homeSpaces,
    ...homeStyles,
    ...homeCleaningCategories,
    ...gardeningCategories,
    ...petCleaningCategories,
    ...furnitureExploreCategories,
    ...decorExploreCategories,
  ];
}

// Helper to find category by ID
export function getExploreCategoryById(id: string): ExploreCategory | undefined {
  return getAllExploreCategories().find(cat => cat.id === id);
}

// Helper to get search query for a category
export function getSearchQueryForCategory(category: ExploreCategory): string {
  // Use just the first keyword for cleaner search matching
  return category.keywords[0];
}
