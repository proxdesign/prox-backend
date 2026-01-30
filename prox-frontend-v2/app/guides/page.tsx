'use client';

import Link from 'next/link';
import { ArrowLeft, ChefHat, Gift, Layers } from 'lucide-react';
import Footer from '../../components/Footer';

const guides = [
  {
    slug: 'kitchen-organization',
    title: 'How to Declutter Your Kitchen Counters',
    description: 'A complete guide to organizing your kitchen with the right products for every budget.',
    icon: ChefHat,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    slug: 'gift-ideas',
    title: "The Smart Shopper's Guide to Home Gifts",
    description: 'Find the perfect home gift for any occasion and any budget.',
    icon: Gift,
    color: 'bg-rose-50 text-rose-600',
  },
  {
    slug: 'cutting-boards',
    title: 'Cutting Board Buying Guide',
    description: 'Wood vs Plastic vs Bamboo: everything you need to know before buying.',
    icon: Layers,
    color: 'bg-emerald-50 text-emerald-600',
  },
];

export default function GuidesPage() {
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
                <h1 className="text-2xl font-light text-white">Buying Guides</h1>
                <p className="text-white/80 text-sm">Expert advice to help you choose</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Find the Right Products for Your Home
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our buying guides help you understand what to look for, compare options,
            and make confident purchasing decisions.
          </p>
        </div>

        {/* Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className={`w-12 h-12 rounded-xl ${guide.color} flex items-center justify-center mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {guide.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {guide.description}
                </p>
                <span className="text-[#5C7C5C] font-medium text-sm hover:underline">
                  Read Guide →
                </span>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Not sure what you need?
          </h3>
          <p className="text-gray-600 mb-6">
            Tell us about your problem and we'll recommend the right products for you.
          </p>
          <Link
            href="/solve"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5C7C5C] text-white rounded-xl font-medium hover:bg-[#4a6a4a] transition-colors"
          >
            Get Personalized Recommendations
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
