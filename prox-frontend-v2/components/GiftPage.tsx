'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ChatInterface from './ChatInterface';
import ProductPreview from './ProductPreview';
import ProductGrid from './ProductGrid';
import FilterBar from './FilterBar';
import FloatingChat from './FloatingChat';
import Footer from './Footer';
import { Problem } from '../lib/mockData';

type Stage = 'discovery' | 'preview' | 'browse';

export default function GiftPage() {
  // Chat state
  const [chatProducts, setChatProducts] = useState<any[]>([]);
  const [chatSolutions, setChatSolutions] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState<Stage>('discovery');
  const [context, setContext] = useState({ space: '', challenge: '', size: '', budget: '' });
  const [filters, setFilters] = useState<Array<{label: string, value: string}>>([]);

  // Floating chat state (for browse stage)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Handlers
  const handleChatProductsUpdate = (newProducts: any[]) => {
    setChatProducts(newProducts);
    if (newProducts.length > 0 && currentStage === 'discovery') {
      setCurrentStage('preview');
    }
  };

  const handleChatSolutionsUpdate = async (newSolutions: any[]) => {
    setChatSolutions(newSolutions);
    if (newSolutions.length > 0) {
      try {
        const firstSolution = newSolutions[0];
        const searchTerm = firstSolution.keywords?.[0] || firstSolution.name;
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=6`);
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            setChatProducts(data.products);
            setCurrentStage('preview');
          }
        }
      } catch (error) {
        console.error('Error auto-fetching products:', error);
      }
    }
  };

  const handleSeeAllProducts = () => {
    setCurrentStage('browse');
    const newFilters = Object.entries(context)
      .filter(([_, value]) => value)
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }));
    setFilters(newFilters);
  };

  const handleRemoveFilter = (label: string) => {
    setFilters(prev => prev.filter(f => f.label !== label));
  };

  const handleAddFilter = (filter: {label: string, value: string}) => {
    setFilters(prev => [...prev, filter]);
  };

  const handleChatSend = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I understand you're looking for help with: "${message}". Let me find some solutions for you.`
      }]);
      setIsLoading(false);
    }, 1000);
  };

  // Stub handlers required by ChatInterface
  const handleModeSelect = () => {};
  const handleProblemIdentified = (problem: Problem, solutions: any[]) => {};
  const handleExploreArea = (area: string) => {};

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header with back arrow */}
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
                  <h1 className="text-2xl font-light text-white">Buy a Gift</h1>
                  <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">beta</span>
                </div>
                <p className="text-white/80 text-sm">Find something special for someone</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-[80vh] pb-8 pt-6">
        {/* Stage 3: Browse - Full product grid with filters */}
        {currentStage === 'browse' && (
          <>
            <FilterBar
              filters={filters}
              onRemove={handleRemoveFilter}
              onAdd={handleAddFilter}
            />

            <div className="flex-1 px-4 max-w-7xl mx-auto w-full">
              <ProductGrid products={chatProducts} />
            </div>

            <FloatingChat
              isOpen={isChatOpen}
              onToggle={() => setIsChatOpen(!isChatOpen)}
              messages={messages}
              onSend={handleChatSend}
              context={context}
              input={chatInput}
              onInputChange={setChatInput}
              isLoading={isLoading}
            />
          </>
        )}

        {/* Stage 1 & 2: Discovery/Preview */}
        {(currentStage === 'discovery' || currentStage === 'preview') && (
          <div className="flex-1 px-8 lg:px-16 max-w-6xl mx-auto w-full">
            <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Chat Section - narrower */}
              <div className="lg:col-span-3 min-h-[32rem]">
                <ChatInterface
                  mode="conversational"
                  onModeSelect={handleModeSelect}
                  onProblemIdentified={handleProblemIdentified}
                  onExploreArea={handleExploreArea}
                  onProductsUpdate={handleChatProductsUpdate}
                  onSolutionsUpdate={handleChatSolutionsUpdate}
                  onContextUpdate={(newContext) => setContext(prev => ({ ...prev, ...newContext }))}
                  initialPrompt="I'm looking for a gift"
                />
              </div>

              {/* Context Panel */}
              <div className="lg:col-span-2">
                <ProductPreview
                  products={chatProducts}
                  onSeeAll={handleSeeAllProducts}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
