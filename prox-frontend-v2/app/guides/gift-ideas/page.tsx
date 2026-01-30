import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '../../../components/Footer';

export const metadata: Metadata = {
  title: "The Smart Shopper's Guide to Home Gifts | Prox",
  description: 'Find the perfect home gift for any occasion. Gift ideas by recipient type, budget tiers, and trending categories.',
};

export default function GiftIdeasGuide() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header */}
      <header className="px-4 py-6" style={{ backgroundColor: '#718479' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/guides"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Back to guides"
            >
              <ArrowLeft size={24} className="text-white" />
            </Link>
            <div className="flex items-center gap-4">
              <img src="/logo-white.png" alt="Prox" className="h-14 w-auto" />
              <div className="w-px bg-white/30 h-10" />
              <div>
                <h1 className="text-2xl font-light text-white">Buying Guide</h1>
                <p className="text-white/80 text-sm">Home Gifts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Smart Shopper's Guide to Home Gifts
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Finding the right home gift can be tricky. This guide helps you match gifts to recipients,
            understand what you can get at different price points, and discover trending options.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Gift Ideas by Recipient Type
          </h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            For New Homeowners
          </h3>
          <p className="text-gray-700 mb-4">
            New homeowners are building their household from scratch. Focus on foundational items
            they might not think to buy themselves but will use daily.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>Quality kitchen tools (cutting boards, utensil sets, knife blocks)</li>
            <li>Organizational solutions (closet systems, drawer organizers)</li>
            <li>Smart home starters (smart plugs, doorbell cameras)</li>
            <li>Cleaning essentials (quality vacuum, mop systems)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            For Parents
          </h3>
          <p className="text-gray-700 mb-4">
            Parents need things that make daily life easier, reduce mess, and help maintain
            sanity in a busy household.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>Quick-clean solutions (robot vacuums, cordless stick vacuums)</li>
            <li>Kitchen time-savers (instant pots, air fryers, food prep tools)</li>
            <li>Organization for chaos (toy storage, entryway organizers)</li>
            <li>Self-care items they won't buy themselves</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            For Cooking Enthusiasts
          </h3>
          <p className="text-gray-700 mb-4">
            People who love cooking often have the basics covered. Look for specialty items,
            upgrades to everyday tools, or unique ingredients.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>Premium cutting boards (end-grain wood, specialty materials)</li>
            <li>Quality knife sets or single specialty knives</li>
            <li>Cast iron or specialty cookware</li>
            <li>Unique spices, oils, or cooking subscriptions</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            For Minimalists
          </h3>
          <p className="text-gray-700 mb-4">
            The minimalist in your life appreciates quality over quantity. Choose items that
            serve multiple purposes or replace several lesser items.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>Multi-functional tools that replace several items</li>
            <li>Consumables (candles, soaps, plants)</li>
            <li>Experience gifts or subscriptions</li>
            <li>Upgrades to items they already own and love</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Budget Guide: What to Expect
          </h2>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Under $25</h3>
            <p className="text-gray-700">
              Quality single items: nice candles, kitchen gadgets, small organizers,
              premium hand soaps, decorative items, quality towels.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">$25-50</h3>
            <p className="text-gray-700">
              Nice sets or single premium items: cutting board sets, small appliances,
              quality knife, nice throw blanket, decorative pillow set.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">$50-100</h3>
            <p className="text-gray-700">
              Substantial gifts: quality small appliances, nice cookware pieces,
              smart home devices, premium organizational systems.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">$100+</h3>
            <p className="text-gray-700">
              Statement pieces: robot vacuums, premium appliances, quality furniture pieces,
              complete cookware sets, smart home systems.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Trending Gift Categories
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li><strong>Smart home devices</strong> - practical and exciting tech gifts</li>
            <li><strong>Sustainable products</strong> - eco-friendly alternatives people appreciate</li>
            <li><strong>Organization solutions</strong> - everyone wants a tidier home</li>
            <li><strong>Air quality</strong> - purifiers and plants are popular post-pandemic</li>
            <li><strong>Kitchen upgrades</strong> - people are cooking more at home</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Matching Gifts to Lifestyle
          </h2>
          <p className="text-gray-700 mb-6">
            The best gifts solve a problem the recipient actually has. Before buying, consider:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li>What do they complain about?</li>
            <li>What's their living situation? (apartment vs house, renter vs owner)</li>
            <li>What's their style? (modern, traditional, minimalist)</li>
            <li>Do they have storage space for bulky items?</li>
          </ul>

          {/* CTA */}
          <div className="mt-12 p-8 bg-[#5C7C5C]/10 rounded-2xl text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Need help finding the perfect gift?
            </h3>
            <p className="text-gray-600 mb-6">
              Tell us about the person you're shopping for and we'll suggest personalized options.
            </p>
            <Link
              href="/gift"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C7C5C] text-white rounded-xl font-medium hover:bg-[#4a6a4a] transition-colors"
            >
              Find the Perfect Gift →
            </Link>
          </div>

          {/* Affiliate Disclosure */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <strong>Affiliate Disclosure:</strong> As an Amazon Associate, Prox earns from qualifying purchases.
              This helps us keep our recommendations free. <a href="/about-recommendations" className="text-[#5C7C5C] hover:underline">Learn more about how we recommend products</a>.
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
