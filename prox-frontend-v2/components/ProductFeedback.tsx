'use client';
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, DollarSign, Palette, Ruler, ShoppingCart } from 'lucide-react';
import { useUser, useAuthHeaders } from '../contexts/UserContext';
import { trackProductFeedback, trackError } from '@/lib/analytics';

interface ProductFeedbackProps {
  productId: string | number;
  sessionId?: string;
  productData?: any;
  onFeedbackSubmitted?: () => void;
  className?: string;
}

export function ProductFeedback({ 
  productId, 
  sessionId, 
  productData,
  onFeedbackSubmitted,
  className = ''
}: ProductFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const feedbackOptions = [
    { 
      type: 'helpful', 
      icon: ThumbsUp, 
      label: 'Helpful',
      color: 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
    },
    { 
      type: 'not_helpful', 
      icon: ThumbsDown, 
      label: 'Not helpful',
      color: 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
    },
    { 
      type: 'too_expensive', 
      icon: DollarSign, 
      label: 'Too expensive',
      color: 'text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100'
    },
    { 
      type: 'wrong_style', 
      icon: Palette, 
      label: 'Wrong style',
      color: 'text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100'
    },
    { 
      type: 'wrong_size', 
      icon: Ruler, 
      label: 'Wrong size',
      color: 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100'
    },
    { 
      type: 'purchased', 
      icon: ShoppingCart, 
      label: 'Purchased!',
      color: 'text-[#5C7C5C] border-[#5C7C5C]/20 bg-[#5C7C5C]/10 hover:bg-[#5C7C5C]/20'
    }
  ];

  const handleFeedback = async (type: string) => {
    setSelectedType(type);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ 
          productId: productId.toString(),
          sessionId: sessionId || Date.now().toString(),
          userId: user?.id || null,
          feedbackType: type,
          productData: productData || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      onFeedbackSubmitted?.();
      
      // Track feedback submission
      trackProductFeedback(
        typeof productId === 'number' ? productId : parseInt(productId.toString()) || 0,
        type
      );

      // Auto-hide after success
      setTimeout(() => {
        setSubmitted(false);
        setSelectedType(null);
      }, 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      trackError('product_feedback_error', error instanceof Error ? error.message : 'Unknown error');
      setSelectedType(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`text-center py-3 ${className}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5C7C5C]/10 text-[#5C7C5C] rounded-full text-sm font-medium">
          <ThumbsUp size={16} />
          Thanks for your feedback!
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="text-center mb-2">
        <p className="text-xs text-gray-500 font-medium">Was this helpful?</p>
      </div>
      
      <div className="flex flex-wrap gap-1.5 justify-center max-w-xs mx-auto">
        {feedbackOptions.map(({ type, icon: Icon, label, color }) => (
          <button
            key={type}
            onClick={() => handleFeedback(type)}
            disabled={isSubmitting}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-all duration-200 ${
              selectedType === type && isSubmitting
                ? 'opacity-50 cursor-not-allowed'
                : color
            }`}
          >
            <Icon size={12} />
            <span>{label}</span>
            {selectedType === type && isSubmitting && (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
            )}
          </button>
        ))}
      </div>

      <div className="text-center mt-2">
        <p className="text-[10px] text-gray-400">
          {user ? 'Your feedback helps improve recommendations' : 'Sign in for personalized recommendations'}
        </p>
      </div>
    </div>
  );
}