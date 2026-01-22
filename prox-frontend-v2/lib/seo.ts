// SEO utility functions for Prox application

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

export const defaultSEO = {
  title: 'Prox | AI-Powered Home Product Discovery',
  description: 'Find home products that actually work. Prox analyzes real social media trends to recommend solutions for your space.',
  keywords: [
    'home organization',
    'furniture discovery', 
    'product recommendations',
    'AI recommendations',
    'social media trends',
    'home improvement',
    'space solutions',
    'furniture trends',
    'product discovery'
  ],
  image: '/og-image.png',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://proxdiscovery.com',
};

export function generatePageMetadata(config: SEOConfig = {}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://proxdiscovery.com';
  
  return {
    title: config.title ? `${config.title} | Prox` : defaultSEO.title,
    description: config.description || defaultSEO.description,
    keywords: config.keywords || defaultSEO.keywords,
    openGraph: {
      title: config.title || defaultSEO.title,
      description: config.description || defaultSEO.description,
      url: config.url || siteUrl,
      siteName: 'Prox',
      images: [
        {
          url: config.image || defaultSEO.image,
          width: 1200,
          height: 630,
          alt: config.title || defaultSEO.title,
        },
      ],
      locale: 'en_US',
      type: config.type || 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title || defaultSEO.title,
      description: config.description || defaultSEO.description,
      images: [config.image || defaultSEO.image],
    },
    alternates: {
      canonical: config.url || siteUrl,
    },
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  price?: number;
  rating?: number;
  brand?: string;
  category?: string;
  image?: string;
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    category: product.category,
    image: product.image,
    url: product.url,
    offers: product.price ? {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    } : undefined,
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      bestRating: 10,
      worstRating: 1,
    } : undefined,
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
  totalTime?: string;
  supply?: string[];
  tool?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    supply: howTo.supply?.map(item => ({
      '@type': 'HowToSupply',
      name: item,
    })),
    tool: howTo.tool?.map(item => ({
      '@type': 'HowToTool',  
      name: item,
    })),
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}

// Keywords for different product categories
export const categoryKeywords = {
  storage: [
    'storage solutions',
    'organization products',
    'storage containers',
    'closet organizers',
    'storage bins',
  ],
  furniture: [
    'space-saving furniture',
    'small space furniture', 
    'multi-functional furniture',
    'compact furniture',
    'furniture for apartments',
  ],
  kitchen: [
    'kitchen organization',
    'kitchen storage',
    'kitchen gadgets',
    'small kitchen solutions',
    'kitchen tools',
  ],
  bedroom: [
    'bedroom organization',
    'bedroom storage',
    'bedroom furniture',
    'small bedroom ideas',
    'bedroom solutions',
  ],
  office: [
    'home office organization',
    'desk organizers',
    'office storage',
    'workspace solutions',
    'office furniture',
  ],
  bathroom: [
    'bathroom organization',
    'bathroom storage',
    'bathroom accessories',
    'small bathroom solutions',
    'bathroom products',
  ],
};

// Generate category-specific SEO content
export function generateCategorySEO(category: keyof typeof categoryKeywords) {
  const keywords = categoryKeywords[category] || [];
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  
  return {
    title: `${categoryName} Products & Solutions`,
    description: `Discover trending ${category} products that actually work. AI-powered recommendations based on real social media reviews and trends.`,
    keywords: [...keywords, ...defaultSEO.keywords],
  };
}

// Generate trending products SEO
export function generateTrendingSEO(timeframe: string = 'this week') {
  return {
    title: `Trending Home Products ${timeframe}`,
    description: `Discover the most popular home and organization products trending ${timeframe}. Real recommendations from social media analysis.`,
    keywords: [
      'trending home products',
      'popular furniture',
      'viral home organization',
      'trending storage solutions',
      ...defaultSEO.keywords,
    ],
  };
}