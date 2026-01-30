import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'About Our Recommendations | Prox',
  description: 'Learn how Prox finds and recommends products, our business model, and our commitment to editorial independence.',
};

export default function AboutRecommendationsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header */}
      <header className="px-4 py-6" style={{ backgroundColor: '#718479' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={24} className="text-white" />
            </Link>
            <div className="flex items-center gap-4">
              <img src="/logo-white.png" alt="Prox" className="h-14 w-auto" />
              <div className="w-px bg-white/30 h-10" />
              <div>
                <h1 className="text-2xl font-light text-white">About Our Recommendations</h1>
                <p className="text-white/80 text-sm">How we find and suggest products</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12 max-w-3xl mx-auto w-full">
        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How Prox Recommends Products
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            We believe you deserve to know exactly how we find and recommend products.
            Here's everything about our process, business model, and commitment to you.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            How We Find Products
          </h2>
          <p className="text-gray-700 mb-4">
            Prox uses AI to analyze multiple data sources and find products that actually solve
            the problems people face:
          </p>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Ratings & Reviews</h3>
            <p className="text-gray-700">
              We analyze thousands of verified customer reviews to understand real-world
              performance. Our AI looks beyond star ratings to understand what people actually
              say about products—the good and the bad.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Social Media Trends</h3>
            <p className="text-gray-700">
              We monitor YouTube, blogs, and other platforms where real people discuss
              home products. This helps us identify solutions that are actually working
              for people in real homes—not just marketing claims.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Price-to-Value Analysis</h3>
            <p className="text-gray-700">
              We compare products across price points to understand where you get the best
              value. Sometimes the mid-range option outperforms premium products—our AI
              helps identify these opportunities.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Problem-Solution Matching</h3>
            <p className="text-gray-700">
              We don't just recommend popular products. Our AI matches specific problems
              to specific solutions, considering factors like your space, budget, and
              lifestyle preferences.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Our Business Model
          </h2>
          <p className="text-gray-700 mb-4">
            We believe in being transparent about how Prox makes money:
          </p>

          <div className="bg-amber-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Affiliate Commissions</h3>
            <p className="text-gray-700 mb-4">
              Prox earns affiliate commissions when you purchase products through our links.
              As an Amazon Associate, we earn from qualifying purchases. We may also earn
              commissions from other affiliate partners.
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>This is how we keep Prox free</strong> - you never pay for our recommendations</li>
              <li><strong>Commissions are paid by retailers</strong> - nothing is added to your price</li>
              <li><strong>We only recommend products we believe in</strong> - commissions don't influence rankings</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Our Editorial Independence
          </h2>
          <p className="text-gray-700 mb-4">
            Trust is everything. Here's our commitment to you:
          </p>

          <div className="bg-[#5C7C5C]/10 rounded-xl p-6 mb-6">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-[#5C7C5C] font-bold text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Affiliate commissions do not influence which products we recommend</p>
                  <p className="text-gray-600 text-sm">Our AI evaluates products based on quality metrics, not commission rates.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#5C7C5C] font-bold text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">We recommend products we believe will actually solve your problem</p>
                  <p className="text-gray-600 text-sm">Our reputation depends on giving you advice that works.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#5C7C5C] font-bold text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">We include products at all price points</p>
                  <p className="text-gray-600 text-sm">Budget options are often just as good as expensive ones.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#5C7C5C] font-bold text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">We update recommendations based on new data</p>
                  <p className="text-gray-600 text-sm">Our system refreshes every 6 hours with the latest reviews and trends.</p>
                </div>
              </li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
            Questions?
          </h2>
          <p className="text-gray-700 mb-6">
            We're happy to explain more about how Prox works. If you have questions about
            our recommendation process or business model, please reach out.
          </p>

          {/* CTA */}
          <div className="mt-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Ready to find products that work?
            </h3>
            <p className="text-gray-600 mb-6">
              Tell us what problem you're trying to solve and we'll help you find the right solution.
            </p>
            <Link
              href="/solve"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C7C5C] text-white rounded-xl font-medium hover:bg-[#4a6a4a] transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
