'use client';

import { useState, useEffect, useRef } from 'react';
import { Heart, User, Settings } from 'lucide-react';
import Link from 'next/link';
import ChatInterface from '../components/ChatInterface';
import ProductGrid from '../components/ProductGrid';
import SolutionGrid from '../components/SolutionGrid';
import SolutionTypesPanel from '../components/SolutionTypesPanel';
import ProductPreview from '../components/ProductPreview';
import FloatingChat from '../components/FloatingChat';
import FilterBar from '../components/FilterBar';
import StepIndicator from '../components/StepIndicator';
import CardShelf from '../components/CardShelf';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import HowItWorksModal from '../components/HowItWorksModal';
import WhyProxModal from '../components/WhyProxModal';
// import { LoginModal } from '../components/LoginModal';
import { ProductFeedback } from '../components/ProductFeedback';
import { ConversationRating } from '../components/ConversationRating';
import { UserPreferences } from '../components/UserPreferences';
import { useUser } from '../contexts/UserContext';
import { Problem, problems, FilterOption, getDefaultFiltersForCategory } from '../lib/mockData';
import { getRepresentativeProductPerStyle, styleCategories } from '../lib/styleDetection';
import { createSession, saveJourney, UserJourney } from '../lib/userJourney';

interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
  preferences?: any;
}

interface Product {
  asin?: string;
  title: string;
  price?: string;
  image?: string;
  rating?: number;
  ratings_total?: number;
  link?: string;
}

export default function Home() {
  // Mode and step state
  const [mode, setMode] = useState<'problem' | 'explore' | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [showVisualExplore, setShowVisualExplore] = useState(false);
  const [conversationalInput, setConversationalInput] = useState('');
  
  // Selection state
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [availableSolutions, setAvailableSolutions] = useState<any[]>([]);
  const [solutionPage, setSolutionPage] = useState(0);
  const [selectedSolution, setSelectedSolution] = useState<any>(null);
  const [availableStyles, setAvailableStyles] = useState<Array<{ style: any; product: any }>>([]);
  const [stylePage, setStylePage] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [chatProducts, setChatProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Solutions state
  const [chatSolutions, setChatSolutions] = useState<any[]>([]);
  
  // Three-stage layout state
  type Stage = 'discovery' | 'preview' | 'browse';
  const [currentStage, setCurrentStage] = useState<Stage>('discovery');
  const [context, setContext] = useState({
    space: '',
    challenge: '',
    size: '',
    budget: ''
  });
  const [filters, setFilters] = useState<Array<{label: string, value: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Journey tracking
  const [journey, setJourney] = useState<UserJourney>(() => createSession());
  
  // Filter and step label state
  const [currentFilters, setCurrentFilters] = useState<FilterOption[]>([]);
  const [stepLabels, setStepLabels] = useState<{ step2: string; step3: string }>({ 
    step2: 'Product Type', 
    step3: 'Refine' 
  });
  
  // Modal state
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showWhyProx, setShowWhyProx] = useState(false);
  // const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // User state
  const { user, login, logout } = useUser();
  
  // Show Products button state
  const [showProductsButton, setShowProductsButton] = useState(false);
  
  // Screen transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Reference for card shelf
  const shelfRef = useRef<HTMLDivElement>(null);

  // Save journey on changes
  useEffect(() => {
    saveJourney(journey);
  }, [journey]);

  // Debug stage and context changes
  useEffect(() => {
    console.log('🎭 Current stage:', currentStage);
  }, [currentStage]);

  useEffect(() => {
    console.log('📊 Context state:', context);
  }, [context]);

  // Scroll to top on component mount and flow resets
  useEffect(() => {
    // Force scroll to top on page load
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    
    scrollToTop();
    // Also run after a short delay to ensure all content has loaded
    const timeoutId = setTimeout(scrollToTop, 50);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Only scroll when explicitly starting over (not during normal navigation)
  const [isStartingOver, setIsStartingOver] = useState(false);
  const [chatResetTrigger, setChatResetTrigger] = useState<number>(0);
  
  useEffect(() => {
    if (isStartingOver && currentStep === 1 && mode === null) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsStartingOver(false);
    }
  }, [isStartingOver, currentStep, mode]);

  // Handle browser back button to prevent leaving the site
  useEffect(() => {
    // Add a dummy state to the history when the page loads
    // This ensures we can always go "back" to the home state
    const currentState = { isProxApp: true, stage: 'home' };
    window.history.replaceState(currentState, '', window.location.pathname);
    
    // Listen for browser back/forward button clicks
    const handlePopState = (event: PopStateEvent) => {
      // If there's no state or it's not our app state, prevent navigation away
      if (!event.state || !event.state.isProxApp) {
        // Push a new state to prevent going back to external sites
        window.history.pushState(currentState, '', window.location.pathname);
        // Reset to home state
        handleStartOver();
        return;
      }
      
      // Handle navigation between app stages
      switch (event.state.stage) {
        case 'home':
          handleStartOver();
          break;
        case 'chatting':
          // User pressed back while in chat - stay in chat, push state back
          // This prevents accidental navigation from resetting the conversation
          window.history.pushState({ isProxApp: true, stage: 'chatting' }, '', window.location.pathname);
          break;
        case 'preview':
          // Going back from preview to chatting - stay in discovery with chat
          setCurrentStage('discovery');
          setFilters([]);
          break;
        case 'browse':
          // Going back from browse - go to preview
          setCurrentStage('preview');
          break;
        default:
          // Unknown stage, go to home
          handleStartOver();
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle magic link authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const authError = urlParams.get('auth_error');

    if (token) {
      // Store token and verify it
      localStorage.setItem('prox_token', token);
      
      // Verify token with backend to get user data
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      fetch(`${apiUrl}/auth/verify-token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          localStorage.setItem('prox_user', JSON.stringify(data.user));
          login(data.user);
        } else {
          localStorage.removeItem('prox_token');
          localStorage.removeItem('prox_user');
        }
      })
      .catch(err => {
        console.error('Token verification failed:', err);
        localStorage.removeItem('prox_token');
        localStorage.removeItem('prox_user');
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (authError) {
      console.error('Auth error:', authError);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);


  const handleModeSelect = (selectedMode: 'problem' | 'explore') => {
    setMode(selectedMode);
    if (selectedMode === 'explore') {
      setShowVisualExplore(true);
    } else {
      setShowVisualExplore(false);
    }
    setJourney(prev => ({ ...prev, mode: selectedMode }));
  };

  const handleProblemIdentified = (problem: Problem, solutions: any[]) => {
    setSelectedProblem(problem);
    setCurrentStep(2);
    setAvailableSolutions(solutions);
    setSolutionPage(0);
    
    // Set dynamic filters and step labels from the problem
    if (problem.filters && problem.filters.length > 0) {
      setCurrentFilters(problem.filters);
    } else {
      // Fall back to category defaults
      setCurrentFilters(getDefaultFiltersForCategory(problem.category));
    }
    
    if (problem.stepLabels) {
      setStepLabels(problem.stepLabels);
    } else {
      setStepLabels({ step2: 'Product Type', step3: 'Refine' });
    }
    
    setJourney(prev => ({
      ...prev,
      problemText: problem.name,
      problemCategory: problem.category,
      solutionsShown: solutions.slice(0, 4).map(s => s.id),
    }));
  };

  const handleExploreArea = (area: string) => {
    const areaProblems = problems.filter(p => p.category === area);
    const allSolutions = areaProblems.flatMap(p => p.solutions);
    setAvailableSolutions(allSolutions);
    setSolutionPage(0);
    setCurrentStep(2);
    
    // Set default filters and step labels for the category
    setCurrentFilters(getDefaultFiltersForCategory(area));
    setStepLabels({ step2: 'Solution Type', step3: 'Refine' });
    
    setJourney(prev => ({
      ...prev,
      problemCategory: area,
      solutionsShown: allSolutions.slice(0, 4).map(s => s.id),
    }));
  };

  const handleVisualCategorySelect = (category: string) => {
    setShowVisualExplore(false);
    handleExploreArea(category);
  };

  const handlePopularSearch = async (searchTerm: string) => {
    setShowVisualExplore(false);
    setLoading(true);
    setCurrentStep(4);
    
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        
        // Create a temporary problem for the search results
        const searchProblem: Problem = {
          id: `search_${Date.now()}`,
          name: searchTerm,
          category: 'Product Search',
          description: `Products matching "${searchTerm}"`,
          keywords: [searchTerm],
          solutions: []
        };
        setSelectedProblem(searchProblem);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationalInput.trim()) return;
    
    await handlePopularSearch(conversationalInput);
    setConversationalInput('');
  };

  const handleSolutionSelect = async (solutionId: string) => {
    const solution = availableSolutions.find(s => s.id === solutionId);
    if (!solution) return;
    
    setSelectedSolution(solution);
    setJourney(prev => ({ ...prev, solutionSelected: solutionId }));
    
    // Check if this problem should skip the refine step
    if (selectedProblem?.skipRefineStep) {
      // Show the products button instead of auto-transitioning
      setShowProductsButton(true);
    } else {
      // Show refine/style step (step 3)
      setLoading(true);
      try {
        const searchTerm = solution.keywords?.[0] || solution.name;
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
        
        if (response.status === 429) {
          const data = await response.json();
          alert(`Rate limit exceeded. Please try again in ${data.resetIn} minutes.`);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          const styleReps = getRepresentativeProductPerStyle(data.products || []);
          setAvailableStyles(styleReps);
          setStylePage(0);
          setCurrentStep(3);
          setJourney(prev => ({
            ...prev,
            stylesShown: styleReps.map(s => s.style.id),
          }));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStyleSelect = async (styleId: string) => {
    const style = availableStyles.find(s => s.style.id === styleId);
    if (!style) return;
    
    setSelectedStyle(style);
    setJourney(prev => ({ ...prev, styleSelected: styleId }));
    // Show the products button instead of auto-transitioning
    setShowProductsButton(true);
  };

  const handleShowProducts = () => {
    setShowProductsButton(false);
    setIsTransitioning(true);
    
    // Fade out current screen, then fetch products
    setTimeout(() => {
      setCurrentStep(4);
      setLoading(true);
      
      // Helper function for async operations
      const fetchProducts = async () => {
        try {
          let searchTerm = '';
          if (selectedSolution && selectedStyle) {
            // Both solution and style selected
            searchTerm = `${selectedSolution.keywords?.[0] || selectedSolution.name} ${selectedStyle.style.name}`.trim();
          } else if (selectedSolution) {
            // Only solution selected
            searchTerm = selectedSolution.keywords?.[0] || selectedSolution.name;
          }
          
          const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
          
          if (response.status === 429) {
            const data = await response.json();
            alert(`Rate limit exceeded. Please try again in ${data.resetIn} minutes.`);
            return;
          }
          
          if (response.ok) {
            const data = await response.json();
            setProducts(data.products || []);
          }
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          setLoading(false);
          // Fade in new screen after products are loaded
          setTimeout(() => {
            setIsTransitioning(false);
          }, 200);
        }
      };
      
      fetchProducts();
    }, 300); // 300ms delay for fade out
  };

  const handleSolutionPrevious = () => {
    if (solutionPage > 0) {
      setSolutionPage(solutionPage - 1);
    }
  };

  const handleSolutionNext = () => {
    const maxPage = Math.ceil(availableSolutions.length / 4) - 1;
    if (solutionPage < maxPage) {
      setSolutionPage(solutionPage + 1);
      setJourney(prev => ({
        ...prev,
        solutionsTryAgainCount: prev.solutionsTryAgainCount + 1,
        solutionsShown: [...prev.solutionsShown, ...availableSolutions.slice((solutionPage + 1) * 4, (solutionPage + 2) * 4).map(s => s.id)],
      }));
    }
  };

  const handleStylePrevious = () => {
    if (stylePage > 0) {
      setStylePage(stylePage - 1);
    }
  };

  const handleStyleNext = () => {
    const maxPage = Math.ceil(availableStyles.length / 4) - 1;
    if (stylePage < maxPage) {
      setStylePage(stylePage + 1);
      setJourney(prev => ({
        ...prev,
        stylesTryAgainCount: prev.stylesTryAgainCount + 1,
      }));
    }
  };

  const handleBack = () => {
    if (currentStep === 4) {
      // Back from product results
      if (selectedProblem?.skipRefineStep) {
        // Go back to step 2 if we skipped style selection
        setCurrentStep(2);
        setProducts([]);
      } else {
        // Go back to style selection
        setCurrentStep(3);
        setProducts([]);
      }
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setSelectedSolution(null);
      setAvailableStyles([]);
      setSelectedStyle(null);
    } else if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedProblem(null);
      setAvailableSolutions([]);
    }
  };

  const handleDirectProductSearch = (searchProducts: Product[]) => {
    setProducts(searchProducts);
    setCurrentStep(4);
    // Skip normal flow and go straight to products
    // No auto-scroll - let user scroll naturally
  };

  const handleChatProductsUpdate = (newProducts: any[]) => {
    console.log('🛍️ Products updated:', newProducts.length, 'products, current stage:', currentStage);
    setChatProducts(newProducts);
    // Stage 1 → 2: When products first appear (if no solutions yet)
    if (newProducts.length > 0 && currentStage === 'discovery') {
      console.log('🔄 Stage transition: discovery → preview (products)');
      setCurrentStage('preview');
      // Push new state for back button navigation
      window.history.pushState({ isProxApp: true, stage: 'preview' }, '', window.location.pathname);
    }
  };

  const handleChatSolutionsUpdate = (newSolutions: any[]) => {
    console.log('💡 Solutions updated:', newSolutions.length, 'solutions, current stage:', currentStage);
    setChatSolutions(newSolutions);
    // Stay in discovery stage when solutions arrive - SolutionTypesPanel will display them
    // Only transition to preview when products arrive (handled by handleChatProductsUpdate)
  };

  // Stage transition handlers
  const handleSeeAllProducts = () => {
    // Stage 2 → 3: When user clicks "See all"
    setCurrentStage('browse');
    // Convert context to filters
    const newFilters = Object.entries(context)
      .filter(([_, value]) => value)
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }));
    setFilters(newFilters);
    
    // Push new state for back button navigation
    window.history.pushState({ isProxApp: true, stage: 'browse' }, '', window.location.pathname);
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
    
    // Mock AI response - replace with actual API call
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I understand you're looking for help with: "${message}". Let me find some solutions for you.` 
      }]);
      setIsLoading(false);
      
      // Mock context update based on message
      if (message.toLowerCase().includes('kitchen')) {
        setContext(prev => ({ ...prev, space: 'Kitchen' }));
      }
      if (message.toLowerCase().includes('small')) {
        setContext(prev => ({ ...prev, size: 'Small' }));
      }
    }, 1000);
  };

  // Helper function to build context summary
  const buildContextSummary = (ctx: typeof context): string => {
    const parts = [];
    if (ctx.space) parts.push(ctx.space);
    if (ctx.challenge) parts.push(ctx.challenge);
    if (ctx.size) parts.push(ctx.size);
    if (ctx.budget) parts.push(ctx.budget);
    return parts.length > 0 ? `Based on: ${parts.join(', ')}` : '';
  };

  // Handle solution card clicks
  const handleSolutionClick = async (solution: any) => {
    try {
      // Fetch products for this solution
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://prox-autonomous-discovery.fly.dev';
      
      // Try to get products by solution keywords or category
      const searchTerms = solution.keywords?.join(' ') || solution.name;
      const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(searchTerms)}&limit=12`);
      
      if (response.ok) {
        const data = await response.json();
        const products = data.products || data || [];
        
        // Clear solutions and show products
        setChatSolutions([]);
        setChatProducts(products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleStartOver = () => {
    setIsStartingOver(true); // Flag that we're starting over
    setMode(null);
    setCurrentStep(1);
    setSelectedProblem(null);
    setAvailableSolutions([]);
    setSelectedSolution(null);
    setShowVisualExplore(false);
    setAvailableStyles([]);
    setSelectedStyle(null);
    setProducts([]);
    setChatProducts([]);
    setChatSolutions([]);
    setCurrentFilters([]);
    setStepLabels({ step2: 'Product Type', step3: 'Refine' });
    setJourney(createSession());
    
    // Reset new three-stage state
    setCurrentStage('discovery');
    setContext({ space: '', challenge: '', size: '', budget: '' });
    setFilters([]);
    setChatInput('');
    setIsChatOpen(false);
    setMessages([]);
    setIsLoading(false);
    
    // Trigger chat reset
    setChatResetTrigger(prev => prev + 1);
    // Scroll will be handled by useEffect when isStartingOver is true
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step as 1 | 2 | 3 | 4);
      if (step <= 3) {
        setProducts([]);
      }
      if (step <= 2) {
        setSelectedSolution(null);
        setSelectedStyle(null);
        setAvailableStyles([]);
      }
      if (step <= 1) {
        setSelectedProblem(null);
        setAvailableSolutions([]);
      }
    }
  };

  // const handleLoginRequired = () => {
  //   setShowLoginModal(true);
  // };

  // const handleLogin = (user: User) => {
  //   // Handle login with user data from the modal
  //   setShowLoginModal(false);
  // };

  const handleLogout = () => {
    logout();
  };

  // Get current solutions to display (paginated)
  const displayedSolutions = availableSolutions.slice(solutionPage * 4, (solutionPage + 1) * 4);
  const hasMoreSolutions = availableSolutions.length > 4;

  // Get current styles to display (paginated)
  const displayedStyles = availableStyles.slice(stylePage * 4, (stylePage + 1) * 4);
  const hasMoreStyles = availableStyles.length > 4;

  return (
    <div className={`min-h-screen flex flex-col transition-opacity duration-300 ${isTransitioning ? 'fade-exit-active' : 'fade-enter-active'}`} style={{ backgroundColor: '#F0F2F1' }}>
      {/* Header - Sage theme, compact on results screen */}
      <header className={`px-4 ${currentStep === 4 ? 'py-3' : 'py-6'}`} style={{ backgroundColor: '#718479' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo and Title - Bigger and left-aligned, clickable */}
            <button 
              onClick={handleStartOver}
              className={`flex items-center gap-4 ${currentStep === 4 ? 'mb-0' : 'mb-0'} hover:opacity-90 transition-opacity cursor-pointer`}
              title="Return to homepage"
            >
              <img 
                src="/logo-white.png" 
                alt="Prox" 
                className={`w-auto ${currentStep === 4 ? 'h-14' : 'h-20'}`}
              />
              <div className={`w-px bg-white/30 ${currentStep === 4 ? 'h-10' : 'h-16'}`}></div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`font-light text-white ${currentStep === 4 ? 'text-2xl' : 'text-3xl'}`}>Prox Discovery</h1>
                  <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">beta</span>
                </div>
                {/* Tagline - Only show on discovery screen */}
                {currentStep !== 4 && (
                  <p className="text-white/90 text-sm mt-1">
                    AI-powered recommendations to solve your home problems
                  </p>
                )}
              </div>
            </button>
            
            {/* Header Right Side */}
            <div className="flex items-center gap-4">
              {/* How it Works & Why Prox links - Only show on discovery screen */}
              {currentStep !== 4 && (
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    How it Works
                  </button>
                  <span className="text-white/40">•</span>
                  <button
                    onClick={() => setShowWhyProx(true)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Why Prox?
                  </button>
                </div>
              )}

              {/* Saved Products Link - Only show when logged in */}
              {user && (
                <Link 
                  href="/saved" 
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                  <Heart size={18} />
                  <span className="hidden sm:inline">Saved</span>
                </Link>
              )}
              
              {/* User Menu */}
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Preferences Button */}
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                  >
                    <Settings size={18} />
                    <span className="hidden sm:inline">Preferences</span>
                  </button>
                  
                  <span className="text-white/80 text-sm hidden sm:inline">
                    {user.name}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="text-white/60 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Chat Summary for Results Screen */}
      {currentStep === 4 && (
        <div className="sticky top-0 z-50 py-4 shadow-sm border-b border-gray-100" style={{ backgroundColor: '#F0F2F1' }}>
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 mb-2">Your search:</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  {selectedProblem?.name?.split('–')[0]?.trim() || 'Problem'}
                </span>
                {selectedSolution && (
                  <>
                    <span>→</span>
                    <span className="px-2 py-1 bg-blue-100 rounded-full">
                      {selectedSolution.name}
                    </span>
                  </>
                )}
                {selectedStyle && (
                  <>
                    <span>→</span>
                    <span className="px-2 py-1 bg-green-100 rounded-full">
                      {selectedStyle.style.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area - Three-stage layout */}
      <main className="flex-1 flex flex-col min-h-[80vh] pb-8 pt-6">
        {/* Stage 3: Browse - Full product grid with filters */}
        {currentStage === 'browse' && (
          <>
            {/* Filter Bar */}
            <FilterBar 
              filters={filters} 
              onRemove={handleRemoveFilter} 
              onAdd={handleAddFilter}
            />
            
            <div className="flex-1 px-4 max-w-7xl mx-auto w-full">
              <div className="h-full">
                {/* Product Grid Section - Full width */}
                <ProductGrid products={chatProducts} />
              </div>
            </div>
            
            {/* Floating Chat Button */}
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

        {/* Stage 1: Discovery - Chat + Context Panel */}
        {currentStage === 'discovery' && (
          <div className="flex-1 px-4 max-w-7xl mx-auto w-full">
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Section - Full width when no conversation started, 2/3 width when conversation active */}
              <div className={messages.length > 0 || chatSolutions.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
                <ChatInterface
                  mode="conversational" 
                  onModeSelect={handleModeSelect}
                  onProblemIdentified={handleProblemIdentified}
                  onExploreArea={handleExploreArea}
                  onDirectProductSearch={handleDirectProductSearch}
                  onProductsUpdate={handleChatProductsUpdate}
                  onSolutionsUpdate={handleChatSolutionsUpdate}
                  onContextUpdate={(newContext) => {
                    console.log('📝 Page.tsx received context update:', newContext);
                    setContext(prev => {
                      const updated = { ...prev, ...newContext };
                      console.log('📝 Updated context state:', updated);
                      return updated;
                    });
                  }}
                  resetTrigger={chatResetTrigger}
                />
              </div>

              {/* Solution Types Panel - Only show after conversation begins */}
              {(messages.length > 0 || chatSolutions.length > 0) && (
                <div className="lg:col-span-1">
                  <SolutionTypesPanel 
                    solutions={chatSolutions}
                    onSolutionClick={handleSolutionClick}
                    contextSummary={buildContextSummary(context)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stage 2: Preview - Chat + Product Preview */}
        {currentStage === 'preview' && (
          <div className="flex-1 px-4 max-w-7xl mx-auto w-full">
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Section - 2/3 width on desktop */}
              <div className="lg:col-span-2">
                <ChatInterface
                  mode="conversational" 
                  onModeSelect={handleModeSelect}
                  onProblemIdentified={handleProblemIdentified}
                  onExploreArea={handleExploreArea}
                  onDirectProductSearch={handleDirectProductSearch}
                  onProductsUpdate={handleChatProductsUpdate}
                  onSolutionsUpdate={handleChatSolutionsUpdate}
                  onContextUpdate={(newContext) => {
                    console.log('📝 Page.tsx received context update:', newContext);
                    setContext(prev => {
                      const updated = { ...prev, ...newContext };
                      console.log('📝 Updated context state:', updated);
                      return updated;
                    });
                  }}
                  resetTrigger={chatResetTrigger}
                />
              </div>

              {/* Product Preview - 1/3 width on desktop */}
              <div className="lg:col-span-1">
                <ProductPreview 
                  products={chatProducts} 
                  onSeeAll={handleSeeAllProducts} 
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer - will stay at bottom, pushed down by content */}
      <div className="mt-auto">
        <Footer />
      </div>
      
      {/* Modals */}
      <HowItWorksModal 
        isOpen={showHowItWorks} 
        onClose={() => setShowHowItWorks(false)} 
      />
      <WhyProxModal 
        isOpen={showWhyProx} 
        onClose={() => setShowWhyProx(false)} 
      />
      {/* <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      /> */}
      <UserPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  );
}

