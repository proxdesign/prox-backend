'use client';

import { useState, useRef, useEffect } from 'react';
import { findProblemsForQuery, problems, Problem } from '../lib/mockData';
import TypingIndicator from './TypingIndicator';
import LandingView from './LandingView';
import QuickFixView from './QuickFixView';
import { trackChatMessage, trackChatStart, trackChatComplete, trackError } from '@/lib/analytics';

interface Solution {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  problemId?: string;
  problemName?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showModeButtons?: boolean;
  showAreaCards?: boolean;
  areas?: string[];
  products?: any[];
  showProductGrid?: boolean;
  solutions?: Solution[];
}

interface ChatInterfaceProps {
  onModeSelect: (mode: 'problem' | 'explore') => void;
  onProblemIdentified: (problem: Problem, solutions: any[]) => void;
  onExploreArea: (area: string) => void;
  onDirectProductSearch?: (products: any[]) => void;
  onProductsUpdate?: (products: any[]) => void;
  onSolutionsUpdate?: (solutions: Solution[]) => void;
  onContextUpdate?: (context: Partial<{space: string, challenge: string, size: string, budget: string}>) => void;
  onConversationStart?: () => void;
  mode: 'problem' | 'explore' | 'conversational' | null;
  resetTrigger?: number; // Add a reset trigger prop
  initialPrompt?: string; // Auto-start conversation with this prompt (skips LandingView)
}

// Helper function to extract context from conversation
function extractContextFromConversation(userMessage: string, aiResponse: string): Partial<{space: string, challenge: string, size: string, budget: string}> {
  const context: Partial<{space: string, challenge: string, size: string, budget: string}> = {};
  const combined = `${userMessage} ${aiResponse}`.toLowerCase();

  // Extract space/room
  const spacePatterns = [
    { pattern: /\b(kitchen|kitchens?)\b/, value: 'Kitchen' },
    { pattern: /\b(pantry|pantries)\b/, value: 'Pantry' },
    { pattern: /\b(bedroom|bedrooms?)\b/, value: 'Bedroom' },
    { pattern: /\b(bathroom|bathrooms?)\b/, value: 'Bathroom' },
    { pattern: /\b(living room|livingroom|family room)\b/, value: 'Living Room' },
    { pattern: /\b(office|home office|study|den)\b/, value: 'Office' },
    { pattern: /\b(closet|closets?|wardrobe)\b/, value: 'Closet' },
    { pattern: /\b(garage|garages?)\b/, value: 'Garage' },
    { pattern: /\b(basement|basements?|cellar)\b/, value: 'Basement' },
    { pattern: /\b(dining room|diningroom)\b/, value: 'Dining Room' },
    { pattern: /\b(entryway|entry way|mudroom|foyer)\b/, value: 'Entryway' },
    { pattern: /\b(laundry room|laundry|utility room)\b/, value: 'Laundry Room' },
    { pattern: /\b(attic|loft)\b/, value: 'Attic' },
    { pattern: /\b(playroom|kids room|nursery)\b/, value: 'Kids Room' },
    { pattern: /\b(craft room|hobby room)\b/, value: 'Craft Room' },
  ];

  for (const { pattern, value } of spacePatterns) {
    if (pattern.test(combined)) {
      context.space = value;
      break;
    }
  }

  // Extract challenge/problem
  const challengePatterns = [
    { pattern: /\b(clutter|cluttered|messy|disorganized?|chaos|chaotic)\b/, value: 'Clutter & organization' },
    { pattern: /\b(storage|storing|store|lack of storage|need storage|no storage)\b/, value: 'Storage solutions' },
    { pattern: /\b(small space|tiny|cramped|limited space|no space|maximize space)\b/, value: 'Space optimization' },
    { pattern: /\b(cable|cables|cord|cords|wire|wires|cable management)\b/, value: 'Cable management' },
    { pattern: /\b(counter|countertop|surface).*\b(clutter|mess|disorganized|chaos)\b/, value: 'Counter clutter' },
    { pattern: /\b(organizing|organization|organize|tidy|clean up)\b/, value: 'Organization systems' },
    { pattern: /\b(pet hair|dog hair|cat hair|fur|shedding)\b/, value: 'Pet hair control' },
    { pattern: /\b(light|lighting|dark|bright|glare|shadow)\b/, value: 'Lighting issues' },
    { pattern: /\b(overflowing|overflow|too much stuff|too many things)\b/, value: 'Space overflow' },
    { pattern: /\b(can't find|lose things|lost items|misplace)\b/, value: 'Item accessibility' },
    { pattern: /\b(dirty|dust|dusty|clean|cleaning)\b/, value: 'Cleaning & maintenance' },
  ];

  for (const { pattern, value } of challengePatterns) {
    if (pattern.test(combined)) {
      context.challenge = value;
      break;
    }
  }

  // Extract size
  const sizePatterns = [
    { pattern: /\b(small|tiny|compact|mini)\b/, value: 'Small' },
    { pattern: /\b(large|big|spacious|huge)\b/, value: 'Large' },
    { pattern: /\b(medium|mid.?size|average)\b/, value: 'Medium' },
  ];

  for (const { pattern, value } of sizePatterns) {
    if (pattern.test(combined)) {
      context.size = value;
      break;
    }
  }

  // Extract budget
  const budgetPatterns = [
    { pattern: /\$(\d+)\s*(?:or\s*)?(?:under|below|less)|\bunder\s*\$(\d+)/, value: 'budget' },
    { pattern: /\b(cheap|budget|affordable|inexpensive)\b/, value: 'Budget-friendly' },
    { pattern: /\b(expensive|premium|high.?end|luxury)\b/, value: 'Premium' },
    { pattern: /quick fix|under.*30/, value: 'Under $30' },
  ];

  for (const { pattern, value } of budgetPatterns) {
    const match = pattern.exec(combined);
    if (match) {
      if (value === 'budget' && (match[1] || match[2])) {
        const amount = match[1] || match[2];
        context.budget = `Under $${amount}`;
      } else {
        context.budget = value;
      }
      break;
    }
  }

  return context;
}

export default function ChatInterface({
  onModeSelect,
  onProblemIdentified,
  onExploreArea,
  onDirectProductSearch,
  onProductsUpdate,
  onSolutionsUpdate,
  onContextUpdate,
  onConversationStart,
  mode,
  resetTrigger,
  initialPrompt
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickFix, setShowQuickFix] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotating placeholder examples
  const placeholderExamples = [
    "e.g., my kitchen counter is always cluttered...",
    "e.g., I need better cable management for my desk...",
    "e.g., my closet is overflowing with clothes...",
    "e.g., pet hair is everywhere in my house...",
    "e.g., I can't sleep because of light coming in...",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const scrollToBottom = () => {
    // Scroll only within the messages container, not the entire page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Only auto-scroll if there are at least 2 messages (user + assistant interaction)
    if (messages.length >= 2) {
      scrollToBottom();
    }
  }, [messages]);

  // Autofocus input when conversation starts and loading completes
  useEffect(() => {
    if (conversationStarted && !isLoading && inputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [conversationStarted, isLoading]);

  // Only rotate if no user messages have been sent
  const hasUserMessages = messages.some(m => m.role === 'user');

  // Rotate placeholder examples
  useEffect(() => {
    // Don't rotate if user has sent a message
    if (hasUserMessages) return;
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 3000); // Rotate every 3 seconds
    return () => clearInterval(interval);
  }, [hasUserMessages, placeholderExamples.length]);

  const handleStartConversation = async (prompt: string) => {
    // Prevent any automatic scrolling during conversation start
    const currentScrollY = window.scrollY;

    // Temporarily disable smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';

    // Push new history state to prevent accidental back navigation to homepage
    window.history.pushState({ isProxApp: true, stage: 'chatting' }, '', window.location.pathname);

    setConversationStarted(true);

    // Notify parent that conversation has started
    if (onConversationStart) {
      onConversationStart();
    }

    // Track chat start based on prompt type
    if (prompt.includes('explore')) {
      trackChatStart('explore');
    } else if (prompt.includes('gift')) {
      trackChatStart('gift');
    } else if (prompt.includes('quick')) {
      trackChatStart('quick_fix');
    } else {
      trackChatStart('solve_problem');
    }

    // Aggressively maintain scroll position
    const maintainPosition = () => {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    };

    // Run multiple times to catch any layout shifts
    requestAnimationFrame(maintainPosition);
    setTimeout(maintainPosition, 0);
    setTimeout(maintainPosition, 16);
    setTimeout(maintainPosition, 50);
    setTimeout(maintainPosition, 100);

    // Re-enable smooth scrolling after transition is complete
    setTimeout(() => {
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
    }, 200);

    // For tile clicks, fetch AI response without showing user message
    setIsLoading(true);
    console.log('🚀 Starting conversation with prompt:', prompt);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history: [] }),
      });

      console.log('📡 API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 API response data:', {
          response: data.response?.substring(0, 50),
          productsCount: data.products?.length || 0,
          solutionsCount: data.solutions?.length || 0,
          showProductGrid: data.showProductGrid
        });

        // Add only the AI's response (no user message)
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          solutions: data.solutions || [],
          products: data.products || [],
          showProductGrid: data.showProductGrid || false,
        };
        setMessages([assistantMessage]);

        // Handle products if returned (e.g., Quick Fix, Trending)
        if (data.products && data.products.length > 0 && onProductsUpdate) {
          console.log('🛍️ Calling onProductsUpdate with', data.products.length, 'products');
          onProductsUpdate(data.products);
        }

        // Handle solutions if returned
        if (data.solutions && data.solutions.length > 0 && onSolutionsUpdate) {
          console.log('💡 Calling onSolutionsUpdate with', data.solutions.length, 'solutions');
          onSolutionsUpdate(data.solutions);
        }
      } else {
        console.error('❌ API response not ok:', response.status);
      }
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      // Fallback opening messages
      const lowerPrompt = prompt.toLowerCase();
      let fallbackMessage = "What can I help you with today?";
      if (lowerPrompt.includes('problem')) {
        fallbackMessage = "I'd love to help! What room or space is giving you trouble?";
      } else if (lowerPrompt.includes('gift')) {
        fallbackMessage = "Great! Who's the gift for and what's your budget?";
      } else if (lowerPrompt.includes('quick fix')) {
        fallbackMessage = "Looking for quick solutions under $30! What area needs help?";
      }
      setMessages([{ role: 'assistant', content: fallbackMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect to watch for mode changes and reset
  useEffect(() => {
    if (mode === null) {
      // Reset chat when mode is reset
      setMessages([]);
      setInput('');
      setConversationStarted(false);
    }
  }, [mode]);

  // Reset conversation when explicitly triggered (e.g., logo click)
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setMessages([]);
      setInput('');
      setConversationStarted(false);
      setShowQuickFix(false);
    }
  }, [resetTrigger]);

  // Auto-start conversation with initial prompt (for dedicated route pages)
  useEffect(() => {
    if (initialPrompt && !conversationStarted && messages.length === 0) {
      handleStartConversation(initialPrompt);
    }
  }, [initialPrompt]);

  const handleModeSelect = (selectedMode: 'problem' | 'explore') => {
    onModeSelect(selectedMode);
    
    if (selectedMode === 'explore') {
      // Get unique categories from problems
      const areas = [...new Set(problems.map(p => p.category))];
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'I want to explore' },
        { 
          role: 'assistant', 
          content: 'Great! What area would you like to explore?',
          showAreaCards: true,
          areas,
        },
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'I have a problem to solve' },
        { 
          role: 'assistant', 
          content: 'What problem can I help you solve?',
        },
      ]);
    }
  };

  const handleAreaSelect = (area: string) => {
    onExploreArea(area);
    setMessages(prev => prev.map(m => ({ ...m, showAreaCards: false })));
    setMessages(prev => [
      ...prev,
      { role: 'user', content: `I want to explore ${area}` },
      { role: 'assistant', content: `Here are some popular product types for ${area}. Click one to see products!` },
    ]);
  };

  // Product keywords that should trigger direct product search in Explore Mode
  const productKeywords = [
    'spice rack', 'spice organizer', 'spice racks',
    'utensil holder', 'utensil crock', 'utensils',
    'lazy susan', 'turntable', 'rotating organizer',
    'cabinet organizer', 'pull out organizer', 'sliding basket',
    'food storage', 'storage containers', 'canisters',
    'knife block', 'knife set', 'knife holder',
    'under cabinet hooks', 'paper towel holder', 'banana hook',
    'appliance cover', 'appliance garage',
    'counter organizer', 'shelf organizer', 'counter shelf',
    'tiered shelf', 'shelf riser', 'risers'
  ];

  const handleSendWithMessage = async (message: string) => {
    if (!message.trim() || isLoading) {
      return;
    }
    
    const userMessage = message.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    await sendMessageToAPI(userMessage);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    await sendMessageToAPI(userMessage);
  };


  const sendMessageToAPI = async (userMessage: string) => {
    // Track user message
    trackChatMessage('user', userMessage.length);

    // EXPLORE MODE: Check for direct product searches first
    if (mode === 'explore') {
      const lowerMessage = userMessage.toLowerCase();
      const matchedKeyword = productKeywords.find(keyword => 
        lowerMessage.includes(keyword)
      );
      
      if (matchedKeyword) {
        console.log(`🎯 Explore Mode: Direct product search detected for "${matchedKeyword}"`);
        
        try {
          // Go directly to product search
          const searchResponse = await fetch(`/api/products?search=${encodeURIComponent(userMessage)}`);
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.products && searchData.products.length > 0) {
              // Create a temporary problem for the search results
              const searchProblem: Problem = {
                id: `search_${Date.now()}`,
                name: `${matchedKeyword} products`,
                category: 'Product Search',
                description: `Products matching "${userMessage}"`,
                keywords: [matchedKeyword],
                solutions: []
              };
              
              // Go straight to products view
              onProblemIdentified(searchProblem, []);
              
              // Pass products to parent for display
              if (onDirectProductSearch) {
                onDirectProductSearch(searchData.products);
              }
              
              setMessages(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: `Found ${searchData.products.length} ${matchedKeyword} products! Showing them below.`,
                },
              ]);
              setIsLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Direct product search failed:', error);
          trackError('direct_product_search_error', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    try {
      // Try API-based chat first, fall back to local matching
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-4) // Send last 4 messages for context
        }),
      });

      if (response.status === 429) {
        // Rate limit exceeded
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `You've reached the query limit (${data.resetIn} minutes remaining). Please try again later, or browse the categories below.`,
          },
        ]);
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Track assistant message
        trackChatMessage('assistant', data.response.length);

        // Send products to parent component
        if (data.products && data.products.length > 0 && onProductsUpdate) {
          onProductsUpdate(data.products);
          trackChatComplete(messages.length + 1, data.products.length);
        }

        // Check if Claude is asking a clarifying question
        const isAskingQuestion = data.response.includes('?') && (
          data.response.includes('what type') ||
          data.response.includes('what kind') ||
          data.response.includes('can you tell me') ||
          data.response.includes('would you') ||
          data.response.includes('could you') ||
          data.response.includes('more about') ||
          data.response.includes('which') ||
          data.response.includes('where') ||
          data.response.includes('how')
        );

        // Include solutions in the message
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          solutions: data.solutions || []
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Pass solutions to parent for display below chat
        if (data.solutions && data.solutions.length > 0 && onSolutionsUpdate) {
          onSolutionsUpdate(data.solutions);
        }

        // Extract and update context from both user message and AI response
        if (onContextUpdate) {
          const extractedContext = extractContextFromConversation(userMessage, data.response);
          console.log('🔍 Context extraction:', { userMessage, aiResponse: data.response, extractedContext });
          if (Object.keys(extractedContext).length > 0) {
            console.log('✅ Calling onContextUpdate with:', extractedContext);
            onContextUpdate(extractedContext);
          } else {
            console.log('❌ No context extracted');
          }
        } else {
          console.log('❌ onContextUpdate not provided');
        }

        // If solutions were recommended AND not asking questions, handle them
        console.log('API Response:', data);
        if (data.solutions && data.solutions.length > 0 && !isAskingQuestion) {
          console.log('Found solutions:', data.solutions);
          // Find the first problem to use for onProblemIdentified
          const firstSolution = data.solutions[0];
          if (firstSolution.problemId) {
            const problem = findProblemsForQuery(userMessage)[0] || {
              id: firstSolution.problemId,
              name: firstSolution.problemName || 'AI Recommendation',
              category: 'AI Suggested',
              description: 'AI-suggested problem match',
              keywords: [],
              solutions: data.solutions
            };
            
            onProblemIdentified(problem, data.solutions);
            if (mode === null) onModeSelect('problem');
          }
        }
        
        setIsLoading(false);
        return;
      }
      
      // If API fails, fall back to local matching
      throw new Error('API unavailable');
      
    } catch (error) {
      console.warn('Chat API unavailable, using local matching:', error);
      trackError('chat_api_error', error instanceof Error ? error.message : 'API unavailable');
      
      // Fallback to local problem matching
      if (mode === 'problem' || mode === null) {
        const localMatches = findProblemsForQuery(userMessage);
        
        if (localMatches.length > 0) {
          const problem = localMatches[0];
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `Here are some product types for "${problem.name}".`,
            },
          ]);
          
          // Notify parent about identified problem
          onProblemIdentified(problem, problem.solutions);
          if (mode === null) onModeSelect('problem');
        } else {
          // No match - try direct product search
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `Let me search for products that can help with "${userMessage}". Here are some options:`,
            },
          ]);
          
          // Trigger direct product search
          try {
            const searchResponse = await fetch(`/api/products?search=${encodeURIComponent(userMessage)}`);
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.products && searchData.products.length > 0) {
                // Create a temporary problem for the search results
                const searchProblem: Problem = {
                  id: 'search-results',
                  name: `Search Results for "${userMessage}"`,
                  category: 'Search Results',
                  description: `Products matching your search: ${userMessage}`,
                  keywords: [userMessage],
                  solutions: [{
                    id: 'search-solution',
                    name: 'Product Search Results',
                    keywords: [userMessage]
                  }]
                };
                
                // Go straight to products view
                onProblemIdentified(searchProblem, []);
                if (mode === null) onModeSelect('problem');
                
                // Pass products to parent for display
                if (onDirectProductSearch) {
                  onDirectProductSearch(searchData.products);
                }
                
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: `Found ${searchData.products.length} products! Showing them below.`,
                  },
                ]);
              } else {
                // No products found either
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: 'I couldn\'t find specific products for that. Could you try describing your problem differently? For example: "My closet is overflowing" or "I have cables everywhere under my desk."',
                  },
                ]);
              }
            }
          } catch (error) {
            console.error('Product search failed:', error);
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: 'I\'m not sure I understood. Could you describe your problem in more detail? For example: "My closet is overflowing" or "I have cables everywhere under my desk."',
              },
            ]);
          }
        }
      }
    }
    
    setIsLoading(false);
  };

  // Handle Quick Fix back button
  const handleQuickFixBack = () => {
    setShowQuickFix(false);
  };

  // Show Quick Fix view
  if (showQuickFix) {
    return (
      <QuickFixView onBack={handleQuickFixBack} />
    );
  }

  // Show landing view if conversation hasn't started and no messages
  // Skip if initialPrompt is provided (for dedicated route pages)
  if (!conversationStarted && messages.length === 0 && !initialPrompt) {
    return (
      <LandingView
        onStartConversation={handleStartConversation}
        onQuickFix={() => setShowQuickFix(true)}
      />
    );
  }

  return (
    <div data-testid="chat-interface" className="min-h-[32rem] flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm h-full">
      {/* Messages Area - Scrollable */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end animate-slideInFromRight' : 'justify-start items-end animate-slideInFromLeft'} gap-2`}>
            {/* Prox Avatar for assistant messages */}
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-medium text-sm flex-shrink-0 mb-1">
                P
              </div>
            )}
            
            <div className={`${
              message.role === 'user'
                ? 'max-w-[75%] text-gray-900 shadow-md'
                : 'max-w-[75%] text-gray-900 shadow-md'
            } ${
              message.role === 'user'
                ? 'bg-[#8B7355] text-white rounded-[18px] rounded-br-[4px] px-4 py-3 shadow-[0_4px_12px_rgba(139,115,85,0.3)]'
                : 'bg-white rounded-[18px] rounded-bl-[4px] px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100'
            }`}>
              <p className="text-base">{message.content}</p>
              
              {/* Mode selection buttons */}
              {message.showModeButtons && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleModeSelect('problem')}
                    className="px-4 py-2 bg-oak-600 text-white rounded-lg text-sm font-medium hover:bg-oak-700 transition-colors"
                  >
                    Solve a Problem
                  </button>
                  <button
                    onClick={() => handleModeSelect('explore')}
                    className="px-4 py-2 bg-white text-oak-600 border border-oak-600 rounded-lg text-sm font-medium hover:bg-oak-50 transition-colors"
                  >
                    Explore
                  </button>
                </div>
              )}
              
              {/* Area cards for explore mode */}
              {message.showAreaCards && message.areas && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.areas.map((area) => (
                    <button
                      key={area}
                      onClick={() => handleAreaSelect(area)}
                      className="px-3 py-1.5 bg-white text-neutral-700 rounded-full text-xs font-medium hover:bg-neutral-50 border border-neutral-200 transition-colors"
                    >
                      {area}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start items-end gap-2 animate-slideInFromLeft">
            <div className="w-8 h-8 rounded-full bg-[#8B7355] flex items-center justify-center text-white font-medium text-sm flex-shrink-0 mb-1">
              P
            </div>
            <div className="bg-white rounded-[18px] rounded-bl-[4px] px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 max-w-[75%]">
              <div className="flex items-center gap-1">
                <div className="ai-loading-dot"></div>
                <div className="ai-loading-dot"></div>
                <div className="ai-loading-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll target */}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-gray-100 p-4 bg-gray-50/50">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading || messages[0]?.showModeButtons}
              className="w-full text-base resize-none bg-white border border-gray-200 rounded-[20px] px-4 py-3 pr-12 outline-none focus:border-[#8B7355] focus:ring-2 focus:ring-[#8B7355]/20 shadow-sm"
              placeholder="Type a message..."
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              data-testid="send-button"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#8B7355] text-white rounded-full hover:bg-[#7A6449] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}