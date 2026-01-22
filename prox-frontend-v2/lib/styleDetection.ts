export interface StyleCategory {
  id: string;
  name: string;
  keywords: string[];
}

export const styleCategories: StyleCategory[] = [
  { id: 'modern', name: 'Modern', keywords: ['modern', 'contemporary', 'sleek', 'clean lines', 'minimalist'] },
  { id: 'rustic', name: 'Rustic', keywords: ['rustic', 'farmhouse', 'wood', 'barn', 'country', 'vintage', 'reclaimed'] },
  { id: 'industrial', name: 'Industrial', keywords: ['industrial', 'metal', 'iron', 'pipe', 'steel', 'warehouse'] },
  { id: 'traditional', name: 'Traditional', keywords: ['traditional', 'classic', 'elegant', 'ornate', 'antique'] },
  { id: 'minimalist', name: 'Minimalist', keywords: ['minimalist', 'simple', 'basic', 'essential', 'zen', 'plain'] },
  { id: 'bohemian', name: 'Bohemian', keywords: ['boho', 'bohemian', 'eclectic', 'colorful', 'woven', 'macrame', 'rattan'] },
];

export function detectStyle(product: { title?: string; description?: string }): StyleCategory | null {
  const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
  
  for (const style of styleCategories) {
    if (style.keywords.some(kw => text.includes(kw))) {
      return style;
    }
  }
  return null;
}

export function groupProductsByStyle(products: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  for (const product of products) {
    const style = detectStyle(product);
    const styleId = style?.id || 'other';
    if (!grouped[styleId]) grouped[styleId] = [];
    grouped[styleId].push(product);
  }
  
  return grouped;
}

export function getRepresentativeProductPerStyle(products: any[]): Array<{ style: StyleCategory; product: any }> {
  if (products.length === 0) return [];
  
  const grouped = groupProductsByStyle(products);
  const representatives: Array<{ style: StyleCategory; product: any }> = [];
  
  // First, add products that matched a style
  for (const style of styleCategories) {
    if (grouped[style.id]?.length > 0) {
      representatives.push({
        style,
        product: grouped[style.id][0]
      });
    }
  }
  
  // If we have less than 4, distribute remaining products across styles
  if (representatives.length < 4 && products.length > 0) {
    const usedProducts = new Set(representatives.map(r => r.product.asin || r.product.title));
    const unusedProducts = products.filter(p => !usedProducts.has(p.asin || p.title));
    const unusedStyles = styleCategories.filter(s => !representatives.find(r => r.style.id === s.id));
    
    let i = 0;
    while (representatives.length < 4 && i < unusedProducts.length && i < unusedStyles.length) {
      representatives.push({
        style: unusedStyles[i],
        product: unusedProducts[i]
      });
      i++;
    }
  }
  
  return representatives.slice(0, 4);
}