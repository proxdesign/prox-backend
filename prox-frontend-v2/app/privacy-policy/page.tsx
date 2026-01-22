'use client';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-warm-50 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-8">Last Updated: January 2025</p>
        
        <div className="prose prose-neutral max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Overview</h2>
            <p className="text-neutral-600 mb-4">
              Prox Product Discovery is an AI-powered platform that helps you discover trending products 
              by analyzing social media trends and user engagement across multiple platforms. This privacy 
              policy explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Information We Collect</h2>
            <p className="text-neutral-600 mb-4">
              We collect information to provide personalized product recommendations and improve our service:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 space-y-2">
              <li><strong>Search queries and preferences</strong> - What you search for and problems you describe</li>
              <li><strong>Interaction data</strong> - Products you view, click, or show interest in</li>
              <li><strong>Device and browser information</strong> - For site functionality and performance</li>
              <li><strong>Cookies and usage data</strong> - To improve user experience and personalize recommendations</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Third-Party Data Sources</h2>
            <p className="text-neutral-600 mb-4">
              We aggregate publicly available trend data from multiple social platforms to power our recommendations:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 space-y-2">
              <li><strong>Reddit</strong> - Community discussions and product recommendations</li>
              <li><strong>Google Trends</strong> - Search volume and rising product interest</li>
              <li><strong>YouTube</strong> - Product reviews and video engagement metrics</li>
              <li><strong>Amazon</strong> - Product details, pricing, and availability</li>
            </ul>
            <p className="text-neutral-600 mt-4">
              <strong>Important:</strong> We cache trend data temporarily (up to 1 hour) to improve performance and comply with API rate limits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Affiliate Disclosure</h2>
            <p className="text-neutral-600 mb-4">
              As an Amazon Associate and affiliate partner, we earn from qualifying purchases. Product links 
              may contain affiliate tracking codes. This helps support our free service but does not influence 
              our trend analysis or product recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Cookies and Tracking</h2>
            <p className="text-neutral-600 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 space-y-2">
              <li>Remember your preferences and search history</li>
              <li>Provide personalized product recommendations</li>
              <li>Analyze site usage and improve our service</li>
              <li>Track affiliate referrals for commission purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Data Security</h2>
            <p className="text-neutral-600 mb-4">
              We implement appropriate security measures to protect your information. We do not permanently 
              store personal data from third-party APIs, and most trend data is automatically purged from 
              our systems within hours.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Children's Privacy</h2>
            <p className="text-neutral-600 mb-4">
              Our service is not intended for children under 13. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected such information, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Your Rights</h2>
            <p className="text-neutral-600 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 space-y-2">
              <li>Request information about data we collect about you</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of data collection (though this may limit service functionality)</li>
              <li>Update or correct your information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">Contact Us</h2>
            <p className="text-neutral-600">
              Questions about this privacy policy should be directed to:<br />
              Prox LLC<br />
              680 N Lake Shore Dr.<br />
              Chicago, IL 60611<br />
              info@proxdesign.com
            </p>
          </section>

        </div>
        
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <a href="/" className="text-oak-600 hover:text-oak-700 font-medium">← Back to Home</a>
        </div>
      </div>
    </main>
  );
}