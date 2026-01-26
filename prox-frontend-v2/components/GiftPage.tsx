'use client';

import { useState } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import ChatInterface from './ChatInterface';
import ProductPreview from './ProductPreview';
import ProductDiscoveryDrawer from './ProductDiscoveryDrawer';
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

  // Mobile drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showProductPill, setShowProductPill] = useState(false);

  // Floating chat state (for browse stage)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Handlers
  const handleChatProductsUpdate = (newProducts: any[]) => {
    console.log('📦 handleChatProductsUpdate:', { count: newProducts.length, currentStage });
    setChatProducts(newProducts);
    if (newProducts.length > 0) {
      // Always show pill when products are found (regardless of stage)
      setShowProductPill(true);
      if (currentStage === 'discovery') {
        setCurrentStage('preview');
      }
      console.log('✅ Product pill should show now');
    }
  };

  const handleChatSolutionsUpdate = async (newSolutions: any[]) => {
    console.log('💡 handleChatSolutionsUpdate:', { count: newSolutions.length });
    setChatSolutions(newSolutions);
    if (newSolutions.length > 0) {
      try {
        const firstSolution = newSolutions[0];
        const searchTerm = firstSolution.keywords?.[0] || firstSolution.name;
        console.log('🔍 Fetching products for solution:', searchTerm);
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=6`);
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Products from solutions:', data.products?.length || 0);
          if (data.products && data.products.length > 0) {
            setChatProducts(data.products);
            setShowProductPill(true);
            if (currentStage === 'discovery') {
              setCurrentStage('preview');
            }
            console.log('✅ Product pill should show now (via solutions)');
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
    <div className="min-h-screen lg:min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#F0F2F1', height: '100dvh' }}>
      {/* Header with back arrow */}
      <header className="px-4 py-4 lg:py-6 flex-shrink-0" style={{ backgroundColor: '#718479' }}>
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
      <main className="flex-1 flex flex-col overflow-hidden pb-2 lg:pb-8 pt-2 lg:pt-6">
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
          <div className="flex-1 flex flex-col px-2 lg:px-16 max-w-6xl mx-auto w-full overflow-hidden">
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-5 gap-2 lg:gap-6 overflow-hidden">
              {/* Chat Section - full height on mobile, grid on desktop */}
              <div className="flex-1 lg:flex-none lg:col-span-3 flex flex-col overflow-hidden">
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

              {/* Context Panel - hidden on mobile, visible on desktop */}
              <div className="hidden lg:block lg:col-span-2">
                <ProductPreview
                  products={chatProducts}
                  onSeeAll={handleSeeAllProducts}
                />
              </div>
            </div>

            {/* Mobile: Floating Product Pill */}
            {showProductPill && chatProducts.length > 0 && (
              <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 animate-float-up">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="relative flex items-center gap-2 bg-[#8B7355] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#7A6449] transition-colors product-pill-pulse"
                >
                  <ShoppingBag size={18} />
                  <span className="font-medium">{chatProducts.length} products found</span>
                </button>
              </div>
            )}

            {/* Mobile: Product Discovery Drawer */}
            <div className="lg:hidden">
              <ProductDiscoveryDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                products={chatProducts}
                onSeeAll={handleSeeAllProducts}
                onNarrowDown={() => setShowProductPill(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer - hidden on mobile during chat */}
      <div className="hidden lg:block mt-auto flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
}
