'use client';
import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useUser, useAuthHeaders } from '../contexts/UserContext';
import { trackConversationRating, trackError } from '@/lib/analytics';

interface ConversationRatingProps {
  sessionId: string;
  conversationData?: any;
  onRatingSubmitted?: (rating: number) => void;
  className?: string;
}

export function ConversationRating({ 
  sessionId, 
  conversationData,
  onRatingSubmitted,
  className = ''
}: ConversationRatingProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
    setShowFeedback(true);
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          sessionId,
          userId: user?.id || null,
          rating,
          feedbackText: feedback.trim() || null,
          conversationData: conversationData || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      setIsSubmitted(true);
      onRatingSubmitted?.(rating);
      
      // Track conversation rating
      trackConversationRating(rating, sessionId);

    } catch (error) {
      console.error('Failed to submit conversation rating:', error);
      trackError('conversation_rating_error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (starRating: number) => {
    switch (starRating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  if (isSubmitted) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5C7C5C]/10 text-[#5C7C5C] rounded-full text-sm font-medium">
          <Star size={16} fill="currentColor" />
          Thanks for rating your experience!
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageSquare size={20} className="text-[#5C7C5C]" />
          <h3 className="text-lg font-semibold text-gray-900">
            How was your chat experience?
          </h3>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={`transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-[#5C7C5C] fill-current'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Rating Text */}
        {(hoveredRating > 0 || rating > 0) && (
          <p className="text-sm text-gray-600 mb-4">
            {getRatingText(hoveredRating || rating)}
          </p>
        )}

        {/* Feedback Text Area */}
        {showFeedback && (
          <div className="mb-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What went well? What could be improved? (optional)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-[#5C7C5C] transition-colors"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {feedback.length}/500
            </div>
          </div>
        )}

        {/* Submit Button */}
        {rating > 0 && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#5C7C5C] text-white rounded-lg hover:bg-[#4a6a4a] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              'Submit Rating'
            )}
          </button>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Your feedback helps us improve the AI recommendations
        </p>
      </div>
    </div>
  );
}