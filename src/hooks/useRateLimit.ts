
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RateLimitConfig {
  operationType: string;
  maxAttempts: number;
  windowMinutes: number;
}

export const useRateLimit = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { user } = useAuth();

  const checkRateLimit = useCallback(async (config: RateLimitConfig): Promise<boolean> => {
    if (!user) return false;

    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

    try {
      // Check current rate limit
      const { data: rateLimits, error } = await supabase
        .from('rate_limits')
        .select('operation_count')
        .eq('user_id', user.id)
        .eq('operation_type', config.operationType)
        .gte('window_start', windowStart.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Rate limit check error:', error);
        return false;
      }

      const currentCount = rateLimits?.operation_count || 0;
      
      if (currentCount >= config.maxAttempts) {
        setIsRateLimited(true);
        return true;
      }

      // Update or insert rate limit record
      if (rateLimits) {
        await supabase
          .from('rate_limits')
          .update({ operation_count: currentCount + 1 })
          .eq('user_id', user.id)
          .eq('operation_type', config.operationType)
          .gte('window_start', windowStart.toISOString());
      } else {
        await supabase
          .from('rate_limits')
          .insert({
            user_id: user.id,
            operation_type: config.operationType,
            operation_count: 1
          });
      }

      return false;
    } catch (error) {
      console.error('Rate limit error:', error);
      return false;
    }
  }, [user]);

  return { checkRateLimit, isRateLimited };
};
