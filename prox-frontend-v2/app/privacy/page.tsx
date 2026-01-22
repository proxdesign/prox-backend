'use client';

import { useEffect } from 'react';

export default function PrivacyRedirect() {
  useEffect(() => {
    // Redirect to the comprehensive privacy policy page
    window.location.replace('/privacy-policy');
  }, []);

  return (
    <main className="min-h-screen bg-warm-50 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8">Redirecting...</h1>
        <p className="text-neutral-600 mb-4">You are being redirected to our Privacy Policy.</p>
        <p className="text-neutral-600">
          If you are not automatically redirected, <a href="/privacy-policy" className="text-oak-600 hover:text-oak-700 underline">click here</a>.
        </p>
      </div>
    </main>
  );
}