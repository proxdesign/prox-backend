import type { Metadata, Viewport } from "next";
import { Raleway, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "../contexts/UserContext";
import GoogleAnalytics from "../components/GoogleAnalytics";
import ScrollToTop from "../components/ScrollToTop";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://proxdiscovery.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Prox | AI-Powered Home Product Discovery",
    template: "%s | Prox"
  },
  description: "Find home products that actually work. Prox analyzes real social media trends to recommend solutions for your space.",
  keywords: [
    "home organization",
    "furniture discovery",
    "product recommendations",
    "AI recommendations",
    "social media trends",
    "home improvement",
    "space solutions",
    "furniture trends",
    "product discovery"
  ],
  authors: [{ name: "Prox Team" }],
  creator: "Prox",
  publisher: "Prox",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Prox",
    title: "Prox | AI-Powered Home Product Discovery",
    description: "Find home products that actually work. Prox analyzes real social media trends to recommend solutions for your space.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prox - AI-Powered Home Product Discovery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prox | AI-Powered Home Product Discovery",
    description: "Find home products that actually work. Prox analyzes real social media trends to recommend solutions for your space.",
    images: ["/og-image.png"],
  },
  verification: {
    // Add verification codes when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Prox',
    description: 'AI-powered home product discovery platform that analyzes social media trends to recommend products that actually work.',
    url: siteUrl,
    applicationCategory: 'ProductRecommendationApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'Prox',
      url: siteUrl,
    },
    featureList: [
      'AI-powered product recommendations',
      'Social media trend analysis',
      'Home organization solutions',
      'Product discovery',
      'User product saving'
    ],
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${raleway.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <GoogleAnalytics />
        <ScrollToTop />
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
