'use client';

import { useEffect } from 'react';

export default function ScrollToTop() {
  useEffect(() => {
    // Only scroll to top on actual page load/refresh, not on SPA navigation
    const hasRefreshed = !window.performance || window.performance.navigation.type === 1;
    
    if (hasRefreshed) {
      // Disable browser's scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }

      // Force scroll to top on page refresh only
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  return null; // This component doesn't render anything
}