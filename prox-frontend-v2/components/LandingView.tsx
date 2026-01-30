'use client';

import { useRouter } from 'next/navigation';
import { trackUseCaseClick } from '@/lib/analytics';

interface LandingViewProps {
  onStartConversation: (prompt: string) => void;
}

export default function LandingView({ onStartConversation }: LandingViewProps) {
  const router = useRouter();

  return (
    <div className="landing-container min-h-[60vh] flex flex-col justify-center items-center py-12 px-4">
      {/* Welcome Message */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-medium text-gray-900 mb-4 tracking-tight">
          Hey! I'm Prox.
        </h1>
        <p className="text-xl text-gray-600 font-light">
          I help people find home products that actually work.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
        {/* Solve a Problem - spans 2 rows on left - navigates to /solve page */}
        <button
          onClick={() => {
            trackUseCaseClick('solve_a_problem');
            router.push('/solve');
          }}
          className="row-span-2 p-8 bg-white/80 backdrop-blur rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#5C7C5C]/30 transition-all duration-300 flex flex-col justify-center text-left animate-fade-in-up-1"
        >
          <span className="text-5xl mb-4">🔧</span>
          <h3 className="font-semibold text-xl text-gray-900 mb-2">Solve a Problem</h3>
          <p className="text-gray-500">Fix something that's been bothering you</p>
        </button>
        
        {/* Explore - top right - navigates to /explore page */}
        <button
          onClick={() => {
            trackUseCaseClick('explore');
            router.push('/explore');
          }}
          className="p-6 bg-white/80 backdrop-blur rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#5C7C5C]/30 transition-all duration-300 text-left animate-fade-in-up-2"
        >
          <span className="text-3xl mb-3 block">✨</span>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">Explore</h3>
          <p className="text-sm text-gray-500">Browse by category</p>
        </button>
        
        {/* Buy a Gift - middle right - navigates to /gift page */}
        <button
          onClick={() => {
            trackUseCaseClick('buy_a_gift');
            router.push('/gift');
          }}
          className="p-6 bg-white/80 backdrop-blur rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#5C7C5C]/30 transition-all duration-300 text-left animate-fade-in-up-3"
        >
          <span className="text-3xl mb-3 block">🎁</span>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">Buy a Gift</h3>
          <p className="text-sm text-gray-500">Find something for someone else</p>
        </button>
      </div>
    </div>
  );
}