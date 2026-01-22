'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { GA_MEASUREMENT_ID, trackPageView } from '@/lib/analytics';

/**
 * Google Analytics tracking component that automatically tracks page views
 */
function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const title = document.title;
    
    // Track page view
    trackPageView(url, title);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Main Google Analytics component that loads gtag.js and initializes tracking
 */
export default function GoogleAnalytics() {
  // Don't load GA if measurement ID is not set (allow in development for testing)
  if (
    !GA_MEASUREMENT_ID ||
    GA_MEASUREMENT_ID === 'G-XXXXXXXXXX'
  ) {
    return null;
  }

  return (
    <>
      {/* Load Google Analytics gtag.js */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      
      {/* Initialize gtag */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
      
      {/* Track page navigation */}
      <Suspense fallback={null}>
        <GoogleAnalyticsTracker />
      </Suspense>
    </>
  );
}