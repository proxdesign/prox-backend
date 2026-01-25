'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import QuickFixView from '../../components/QuickFixView';
import Footer from '../../components/Footer';

export default function QuickFix() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header */}
      <header className="px-4 py-6" style={{ backgroundColor: '#718479' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Back to Home */}
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={24} className="text-white" />
            </Link>

            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <img
                src="/logo-white.png"
                alt="Prox"
                className="h-14 w-auto"
              />
              <div className="w-px bg-white/30 h-10" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-light text-white">Quick Fix</h1>
                  <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">beta</span>
                </div>
                <p className="text-white/80 text-sm">Under $30, instant solutions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <QuickFixView />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
