import { useMemo } from 'react';
import {
  trackProductClick as trackProductClickGA,
  trackAffiliateClick as trackAffiliateClickGA,
  trackProductSave as trackProductSaveGA,
  trackProductUnsave as trackProductUnsaveGA,
  trackProductFeedback as trackProductFeedbackGA,
  trackChatMessage as trackChatMessageGA,
  trackChatStart as trackChatStartGA,
  trackChatComplete as trackChatCompleteGA,
  trackUseCaseClick as trackUseCaseClickGA,
  trackError as trackErrorGA,
  trackSignUp as trackSignUpGA,
  trackLogin as trackLoginGA,
  trackConversationRating as trackConversationRatingGA,
} from '@/lib/analytics';

/**
 * Custom hook that provides memoized analytics tracking functions
 * 
 * This hook ensures that tracking functions are stable across re-renders
 * and provides a convenient API for components to track user interactions.
 * 
 * @returns Object containing all tracking functions
 */
export const useAnalytics = () => {
  const analytics = useMemo(() => ({
    // Product tracking
    trackProductClick: (productId: number, productName: string, source: string) => {
      trackProductClickGA(productId, productName, source);
    },

    trackAffiliateClick: (productId: number, productName: string, affiliatePartner: string) => {
      trackAffiliateClickGA(productId, productName, affiliatePartner);
    },

    trackSave: (productId: number, productName: string) => {
      trackProductSaveGA(productId, productName);
    },

    trackUnsave: (productId: number, productName: string) => {
      trackProductUnsaveGA(productId, productName);
    },

    trackFeedback: (productId: number, feedbackType: string) => {
      trackProductFeedbackGA(productId, feedbackType);
    },

    // Chat tracking
    trackChat: {
      message: (messageType: 'user' | 'assistant', messageLength: number) => {
        trackChatMessageGA(messageType, messageLength);
      },

      start: (entryPoint: 'solve_problem' | 'explore' | 'gift' | 'quick_fix') => {
        trackChatStartGA(entryPoint);
      },

      complete: (messageCount: number, productsShown: number) => {
        trackChatCompleteGA(messageCount, productsShown);
      },

      rating: (rating: number, sessionId: string) => {
        trackConversationRatingGA(rating, sessionId);
      },
    },

    // User actions
    trackUseCase: (useCase: string) => {
      trackUseCaseClickGA(useCase);
    },

    trackAuth: {
      signup: (method: string) => {
        trackSignUpGA(method);
      },

      login: (method: string) => {
        trackLoginGA(method);
      },
    },

    // Error tracking
    trackError: (errorType: string, errorMessage: string) => {
      trackErrorGA(errorType, errorMessage);
    },

    // Convenience functions for common tracking patterns
    trackButtonClick: (buttonName: string, context: string) => {
      trackUseCaseClickGA(`${buttonName}_${context}`);
    },

    trackFormSubmit: (formName: string, success: boolean) => {
      if (success) {
        trackUseCaseClickGA(`${formName}_submit_success`);
      } else {
        trackErrorGA('form_submit_error', `${formName}_submit_failed`);
      }
    },

    trackModalOpen: (modalName: string) => {
      trackUseCaseClickGA(`${modalName}_modal_open`);
    },

    trackModalClose: (modalName: string) => {
      trackUseCaseClickGA(`${modalName}_modal_close`);
    },
  }), []);

  return analytics;
};

export default useAnalytics;