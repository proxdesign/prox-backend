import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '../../../components/Footer';

export const metadata: Metadata = {
  title: 'Cutting Board Buying Guide: Wood vs Plastic vs Bamboo | Prox',
  description: 'Compare cutting board materials, learn about maintenance and hygiene, and find the right size for your kitchen.',
};

export default function CuttingBoardsGuide() {
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
                <p className="text-white/80 text-sm">Cutting Boards</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cutting Board Buying Guide: Wood vs Plastic vs Bamboo
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            The right cutting board makes cooking easier and keeps your knives sharp longer.
            Here's everything you need to know to choose the best material, size, and style.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Material Comparison
          </h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            Wood Cutting Boards
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-green-700 mb-2">Pros</p>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  <li>Gentle on knife edges</li>
                  <li>Natural antibacterial properties</li>
                  <li>Beautiful and long-lasting</li>
                  <li>Self-healing surface</li>
                  <li>Won't dull knives quickly</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-red-700 mb-2">Cons</p>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  <li>Requires regular oiling</li>
                  <li>Cannot go in dishwasher</li>
                  <li>More expensive</li>
                  <li>Can warp if not dried properly</li>
                  <li>Heavier than alternatives</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              <strong>Best for:</strong> Serious home cooks who want longevity and knife protection.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            Plastic Cutting Boards
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-green-700 mb-2">Pros</p>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  <li>Dishwasher safe</li>
                  <li>Affordable</li>
                  <li>Lightweight</li>
                  <li>Color-coded options for food safety</li>
                  <li>No maintenance needed</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-red-700 mb-2">Cons</p>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  <li>Dulls knives faster</li>
                  <li>Deep grooves harbor bacteria</li>
                  <li>Needs replacing more often</li>
                  <li>Can slip on counters</li>
                  <li>Less attractive appearance</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              <strong>Best for:</strong> Raw meat prep, budget-conscious buyers, those who prioritize easy cleanup.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
            Bamboo Cutting Boards
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-green-700 mb-2">Pros</p>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  <li>Eco-friendly and sustainable</li>
                  <li>Naturally antimicrobial</li>
                  <li>Harder than most woods</li>
                  <li>Moderate price point</li>
                  <li>Lightweight</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-red-700 mb-2">Cons</p>
                <ul className="list-disc pl-4 text-gray-700 text-sm space-y-1">
                  <li>Harder on knives than wood</li>
                  <li>Can crack if too dry</li>
                  <li>Requires occasional oiling</li>
                  <li>Quality varies widely</li>
                  <li>Not dishwasher safe</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              <strong>Best for:</strong> Eco-conscious buyers wanting a middle ground between wood and plastic.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Size Considerations
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li><strong>Small (8-10"):</strong> Garnishes, small tasks, limited counter space</li>
            <li><strong>Medium (12-15"):</strong> Everyday cooking, most common choice</li>
            <li><strong>Large (18"+):</strong> Serious cooking, meal prep, carving meats</li>
            <li><strong>Multiple sizes:</strong> Ideal setup has 2-3 boards for different tasks</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Hygiene Considerations
          </h2>
          <p className="text-gray-700 mb-4">
            Food safety is crucial when choosing cutting boards:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
            <li><strong>Separate boards for meat:</strong> Use dedicated boards for raw meat to prevent cross-contamination</li>
            <li><strong>Replace when deeply scored:</strong> Deep grooves harbor bacteria regardless of material</li>
            <li><strong>Clean properly:</strong> Hot soapy water for wood/bamboo, dishwasher for plastic</li>
            <li><strong>Dry thoroughly:</strong> Standing moisture promotes bacteria growth</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Maintenance Tips
          </h2>
          <div className="bg-amber-50 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">For Wood & Bamboo</h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
              <li>Oil monthly with food-safe mineral oil</li>
              <li>Never soak in water or put in dishwasher</li>
              <li>Store upright to allow air circulation</li>
              <li>Sand out deep cuts and re-oil</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Price Expectations
          </h2>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">By Material</h3>
            <ul className="text-gray-700 space-y-2">
              <li><strong>Plastic:</strong> $5-25 (basic to premium)</li>
              <li><strong>Bamboo:</strong> $15-50 (quality varies significantly)</li>
              <li><strong>Hardwood:</strong> $30-100+ (maple, walnut, teak)</li>
              <li><strong>End-grain wood:</strong> $80-200+ (professional grade)</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 bg-[#5C7C5C]/10 rounded-2xl text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Ready to find your perfect cutting board?
            </h3>
            <p className="text-gray-600 mb-6">
              Tell us about your cooking style and we'll recommend the best options.
            </p>
            <Link
              href="/solve"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C7C5C] text-white rounded-xl font-medium hover:bg-[#4a6a4a] transition-colors"
            >
              Get Cutting Board Recommendations →
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
