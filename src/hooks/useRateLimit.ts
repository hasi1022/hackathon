import { useState, useCallback } from 'react';

interface UseRateLimitConfig {
  maxAttempts?: number;
  delayMs?: number;
  maxDelayMs?: number;
}

export function useRateLimit({
  maxAttempts = 3,
  delayMs = 1000,
  maxDelayMs = 8000,
}: UseRateLimitConfig = {}) {
  const [attempts, setAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);

  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime;

    if (attempts >= maxAttempts) {
      // Calculate delay with exponential backoff
      const delay = Math.min(delayMs * Math.pow(2, attempts - 1), maxDelayMs);
      
      if (timeSinceLastAttempt < delay) {
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil((delay - timeSinceLastAttempt) / 1000)} seconds.`);
      }
      
      // Reset attempts if enough time has passed
      setAttempts(0);
    }

    try {
      setLastAttemptTime(now);
      setAttempts(prev => prev + 1);
      const result = await fn();
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        // If we hit the API rate limit, increment attempts
        setAttempts(prev => prev + 1);
      }
      throw error;
    }
  }, [attempts, lastAttemptTime, maxAttempts, delayMs, maxDelayMs]);

  const resetRateLimit = useCallback(() => {
    setAttempts(0);
    setLastAttemptTime(0);
  }, []);

  return { execute, resetRateLimit, attempts };
}