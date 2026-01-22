/**
 * Google Analytics 4 Integration for Prox
 * 
 * This module provides comprehensive tracking for user interactions,
 * product engagement, chat conversations, and business metrics.
 */

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-MVGMFVE5K8';

/**
 * Check if Google Analytics is enabled and available
 */
export const isGAEnabled = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function' && 
         !!GA_MEASUREMENT_ID &&
         GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
};

/**
 * Track page views
 */
export const trackPageView = (url: string, title?: string): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_location: url,
    page_title: title,
  });
};

/**
 * Track generic events
 */
export const trackEvent = (
  action: string, 
  category: string, 
  label?: string, 
  value?: number
): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

/**
 * Track custom events with parameters
 */
export const trackCustomEvent = (eventName: string, params: Record<string, any> = {}): void => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', eventName, params);
};

// ============================================================================
// PROX-SPECIFIC TRACKING FUNCTIONS
// ============================================================================

/**
 * Track chat messages
 */
export const trackChatMessage = (messageType: 'user' | 'assistant', messageLength: number): void => {
  trackCustomEvent('chat_message', {
    message_type: messageType,
    message_length: messageLength,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track chat session start
 */
export const trackChatStart = (entryPoint: 'solve_problem' | 'explore' | 'gift' | 'quick_fix'): void => {
  trackCustomEvent('chat_start', {
    entry_point: entryPoint,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track chat completion
 */
export const trackChatComplete = (messageCount: number, productsShown: number): void => {
  trackCustomEvent('chat_complete', {
    message_count: messageCount,
    products_shown: productsShown,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track product view
 */
export const trackProductView = (productId: number, productName: string, price: number): void => {
  trackCustomEvent('view_item', {
    currency: 'USD',
    value: price,
    items: [{
      item_id: productId.toString(),
      item_name: productName,
      price: price,
    }]
  });
};

/**
 * Track product click
 */
export const trackProductClick = (productId: number, productName: string, source: string): void => {
  trackCustomEvent('select_content', {
    content_type: 'product',
    content_id: productId.toString(),
    item_name: productName,
    source: source,
  });
};

/**
 * Track affiliate link clicks
 */
export const trackAffiliateClick = (
  productId: number, 
  productName: string, 
  affiliatePartner: string
): void => {
  trackCustomEvent('affiliate_click', {
    product_id: productId,
    product_name: productName,
    affiliate_partner: affiliatePartner,
    timestamp: new Date().toISOString(),
  });
  
  // Also track as a conversion event
  trackCustomEvent('generate_lead', {
    currency: 'USD',
    value: 1, // Assign value for potential affiliate conversion
    items: [{
      item_id: productId.toString(),
      item_name: productName,
    }]
  });
};

/**
 * Track product save action
 */
export const trackProductSave = (productId: number, productName: string): void => {
  trackCustomEvent('add_to_wishlist', {
    currency: 'USD',
    items: [{
      item_id: productId.toString(),
      item_name: productName,
    }]
  });
};

/**
 * Track product unsave action
 */
export const trackProductUnsave = (productId: number, productName: string): void => {
  trackCustomEvent('remove_from_wishlist', {
    currency: 'USD',
    items: [{
      item_id: productId.toString(),
      item_name: productName,
    }]
  });
};

/**
 * Track product feedback
 */
export const trackProductFeedback = (productId: number, feedbackType: string): void => {
  trackCustomEvent('product_feedback', {
    product_id: productId,
    feedback_type: feedbackType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track conversation rating
 */
export const trackConversationRating = (rating: number, sessionId: string): void => {
  trackCustomEvent('conversation_rating', {
    rating: rating,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track user signup
 */
export const trackSignUp = (method: string): void => {
  trackCustomEvent('sign_up', {
    method: method,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: string): void => {
  trackCustomEvent('login', {
    method: method,
  });
};

/**
 * Track use case clicks on landing page
 */
export const trackUseCaseClick = (useCase: string): void => {
  trackCustomEvent('use_case_click', {
    use_case: useCase,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track errors for debugging
 */
export const trackError = (errorType: string, errorMessage: string): void => {
  trackCustomEvent('exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    error_type: errorType,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// ENHANCED E-COMMERCE TRACKING
// ============================================================================

/**
 * Track search actions
 */
export const trackSearch = (searchTerm: string, resultCount: number): void => {
  trackCustomEvent('search', {
    search_term: searchTerm,
    result_count: resultCount,
  });
};

/**
 * Track filter usage
 */
export const trackFilterUsage = (filterType: string, filterValue: string): void => {
  trackCustomEvent('filter_usage', {
    filter_type: filterType,
    filter_value: filterValue,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track category browsing
 */
export const trackCategoryView = (categoryName: string): void => {
  trackCustomEvent('view_item_list', {
    item_list_name: categoryName,
  });
};

/**
 * Track user preferences update
 */
export const trackPreferencesUpdate = (preferences: Record<string, any>): void => {
  trackCustomEvent('preferences_update', {
    ...preferences,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (featureName: string, context?: string): void => {
  trackCustomEvent('feature_usage', {
    feature_name: featureName,
    context: context,
    timestamp: new Date().toISOString(),
  });
};

export { GA_MEASUREMENT_ID };