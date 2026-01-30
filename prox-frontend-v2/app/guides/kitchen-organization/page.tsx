import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '../../../components/Footer';

export const metadata: Metadata = {
  title: 'How to Declutter Your Kitchen Counters: A Complete Guide | Prox',
  description: 'Learn how to organize your kitchen counters with the right products. Compare cutting boards, knife blocks, utensil holders, spice racks, and more.',
};

export default function KitchenOrganizationGuide() {
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
                <p className="text-white/80 text-sm">Kitchen Organization</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How to Declutter Your Kitchen Counters: A Complete Guide
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            A cluttered kitchen counter makes cooking stressful and your space feel smaller than it is.
            This guide will help you identify the right organizational products for your needs and budget.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Common Counter Clutter Problems
          </h2>
          <p className="text-gray-700 mb-4">
            Most kitchen clutter falls into a few predictable categories:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li><strong>Cooking tools everywhere</strong> - spatulas, spoons, and whisks without a home</li>
            <li><strong>Cutting boards leaning against walls</strong> - taking up space and looking messy</li>
            <li><strong>Spice chaos</strong> - bottles scattered in cabinets or crowding your counter</li>
            <li><strong>Knife block dilemma</strong> - bulky blocks eating precious counter real estate</li>
            <li><strong>Appliance overflow</strong> - toasters, blenders, and coffee makers fighting for space</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Solution Categories
          </h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            Cutting Boards with Integrated Storage
          </h3>
          <p className="text-gray-700 mb-4">
            Modern cutting board sets often include a holder that keeps multiple boards organized vertically,
            saving counter space while keeping boards accessible and dry.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            <strong>What to look for:</strong> Non-slip base, proper ventilation for drying, multiple board sizes included.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            Utensil Holders & Crocks
          </h3>
          <p className="text-gray-700 mb-4">
            A good utensil holder keeps your most-used tools within arm's reach while cooking.
            Look for ones with weighted bases to prevent tipping and divided compartments for organization.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            <strong>What to look for:</strong> Stable base, easy to clean, appropriate size for your collection.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            Spice Racks & Organizers
          </h3>
          <p className="text-gray-700 mb-4">
            From drawer inserts to cabinet door mounts to lazy susans, there's a spice organization
            solution for every kitchen layout. The key is choosing one that matches how you cook.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            <strong>What to look for:</strong> Capacity for your spice collection, visibility of labels, easy access.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            Knife Storage Solutions
          </h3>
          <p className="text-gray-700 mb-4">
            Beyond traditional knife blocks, consider magnetic strips, in-drawer organizers, or
            under-cabinet mounted options to free up counter space while keeping knives safe and accessible.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            <strong>What to look for:</strong> Blade protection, easy access, appropriate capacity.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Budget Guide
          </h2>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Budget Tier: $10-30</h3>
            <p className="text-gray-700">
              Basic utensil holders, simple cutting board sets, single-tier spice racks,
              magnetic knife strips. Good starting point for renters or those testing solutions.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Mid-Range: $30-75</h3>
            <p className="text-gray-700">
              Quality utensil crocks with compartments, premium cutting board sets with stands,
              expandable spice organizers, in-drawer knife blocks. Better materials and durability.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Premium: $75+</h3>
            <p className="text-gray-700">
              Designer utensil holders, professional-grade cutting board systems,
              custom spice drawer inserts, high-end magnetic knife storage. Built to last decades.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 bg-[#5C7C5C]/10 rounded-2xl text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Ready to organize your kitchen?
            </h3>
            <p className="text-gray-600 mb-6">
              Tell us about your specific kitchen challenges and we'll recommend the perfect products.
            </p>
            <Link
              href="/solve"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C7C5C] text-white rounded-xl font-medium hover:bg-[#4a6a4a] transition-colors"
            >
              Find Products for My Kitchen →
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
