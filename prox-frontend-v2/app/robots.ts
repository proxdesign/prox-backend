import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://proxdiscovery.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/analytics',
          '/_next/',
          '/static/',
          '/auth/logout',
          '/dashboard/',
          '/admin/',
        ],
      },
      // Allow search engines to crawl important content
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/how-it-works',
          '/privacy',
          '/terms',
          '/saved',
        ],
      },
      // Specific rules for other search engines
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/how-it-works',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}