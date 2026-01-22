// Simple in-memory rate limiter for API routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 20; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

export function checkRateLimit(ip: string): { 
  allowed: boolean; 
  remaining: number; 
  resetIn: number 
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // New window or expired record
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { 
      allowed: true, 
      remaining: RATE_LIMIT - 1, 
      resetIn: RATE_LIMIT_WINDOW 
    };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    };
  }
  
  // Increment count for this IP
  record.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT - record.count, 
    resetIn: record.resetTime - now 
  };
}

// Clean up old entries periodically to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 60000); // Clean up every minute
}

// Helper to extract IP from request headers
export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  // Fallback for development or when headers aren't available
  return 'unknown';
}