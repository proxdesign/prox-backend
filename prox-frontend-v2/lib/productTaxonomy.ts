// Product taxonomy for browsing furniture and decor by category

export interface ProductCategory {
  id: string;
  name: string;
  keywords: string[];
  icon?: string;
}

// Furniture categories
export const furnitureCategories: ProductCategory[] = [
  {
    id: 'sofas',
    name: 'Sofas & Couches',
    keywords: ['sofa', 'couch', 'loveseat', 'sectional', 'sleeper sofa'],
    icon: '🛋️'
  },
  {
    id: 'tables',
    name: 'Tables',
    keywords: ['coffee table', 'side table', 'end table', 'console table', 'accent table'],
    icon: '🪑'
  },
  {
    id: 'chairs',
    name: 'Chairs',
    keywords: ['accent chair', 'armchair', 'dining chair', 'lounge chair', 'reading chair'],
    icon: '💺'
  },
  {
    id: 'desks',
    name: 'Desks',
    keywords: ['desk', 'writing desk', 'computer desk', 'standing desk', 'home office desk'],
    icon: '🖥️'
  },
  {
    id: 'shelving',
    name: 'Shelving',
    keywords: ['bookshelf', 'shelving unit', 'floating shelves', 'wall shelf', 'bookcase'],
    icon: '📚'
  },
  {
    id: 'beds',
    name: 'Beds',
    keywords: ['bed frame', 'platform bed', 'headboard', 'bed', 'bedroom furniture'],
    icon: '🛏️'
  },
  {
    id: 'dressers',
    name: 'Dressers',
    keywords: ['dresser', 'chest of drawers', 'nightstand', 'bedroom storage', 'wardrobe'],
    icon: '🗄️'
  },
  {
    id: 'ottomans',
    name: 'Ottomans',
    keywords: ['ottoman', 'footstool', 'pouf', 'storage ottoman', 'bench'],
    icon: '🟫'
  },
  {
    id: 'tv-stands',
    name: 'TV Stands',
    keywords: ['tv stand', 'entertainment center', 'media console', 'tv cabinet'],
    icon: '📺'
  },
];

// Decor and home accessories categories
export const decorCategories: ProductCategory[] = [
  {
    id: 'rugs',
    name: 'Rugs',
    keywords: ['area rug', 'rug', 'carpet', 'runner rug', 'accent rug'],
    icon: '🟨'
  },
  {
    id: 'lighting',
    name: 'Lighting',
    keywords: ['lamp', 'floor lamp', 'table lamp', 'pendant light', 'string lights'],
    icon: '💡'
  },
  {
    id: 'mirrors',
    name: 'Mirrors',
    keywords: ['wall mirror', 'floor mirror', 'decorative mirror', 'vanity mirror'],
    icon: '🪞'
  },
  {
    id: 'curtains',
    name: 'Curtains',
    keywords: ['curtains', 'drapes', 'window treatments', 'blackout curtains', 'sheer curtains'],
    icon: '🪟'
  },
  {
    id: 'pillows',
    name: 'Pillows & Throws',
    keywords: ['throw pillow', 'decorative pillow', 'throw blanket', 'cushion'],
    icon: '🛋️'
  },
  {
    id: 'wall-art',
    name: 'Wall Art',
    keywords: ['wall art', 'canvas art', 'framed art', 'wall decor', 'prints'],
    icon: '🖼️'
  },
  {
    id: 'baskets',
    name: 'Baskets & Bins',
    keywords: ['storage basket', 'woven basket', 'decorative basket', 'bin', 'organizer basket'],
    icon: '🧺'
  },
];

// Helper to get all product categories
export function getAllProductCategories(): ProductCategory[] {
  return [...furnitureCategories, ...decorCategories];
}

// Helper to find category by ID
export function getCategoryById(id: string): ProductCategory | undefined {
  return getAllProductCategories().find(cat => cat.id === id);
}

// Helper to get search query for a category
export function getCategorySearchQuery(category: ProductCategory): string {
  return category.keywords.slice(0, 2).join(' ');
}
