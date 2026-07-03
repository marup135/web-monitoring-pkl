const rateLimitCache = new Map<string, number>();

export function rateLimit(key: string, limitMs: number = 2000): boolean {
  const now = Date.now();
  const lastTime = rateLimitCache.get(key) || 0;
  
  if (now - lastTime < limitMs) {
    return false;
  }
  
  rateLimitCache.set(key, now);
  
  // Basic cleanup to prevent memory leaks in long-running processes
  if (rateLimitCache.size > 2000) {
    rateLimitCache.clear();
  }
  
  return true;
}
