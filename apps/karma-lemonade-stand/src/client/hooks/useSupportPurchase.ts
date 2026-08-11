import { useCallback, useEffect, useState } from 'react';
import { OrderResultStatus, purchase } from '@devvit/web/client';
import type { SupporterStatusResponse } from '../../shared/types/api';

export const GOLDEN_LEMON_SUPPORTER_SKU = 'golden-lemon-supporter';

type SupportPurchaseState = {
  supporter: boolean;
  loading: boolean;
  purchasing: boolean;
  message: string;
};

export const useSupportPurchase = () => {
  const [state, setState] = useState<SupportPurchaseState>({
    supporter: false,
    loading: true,
    purchasing: false,
    message: '',
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/supporter-status');
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          throw new Error(`Supporter status unavailable (HTTP ${response.status})`);
        }
        const data: SupporterStatusResponse = await response.json();
        setState((current) => ({
          ...current,
          supporter: data.supporter,
          loading: false,
        }));
      } catch (error) {
        console.warn('Failed to fetch supporter status:', error);
        setState((current) => ({ ...current, loading: false }));
      }
    };

    void fetchStatus();
  }, []);

  const supportApp = useCallback(async () => {
    setState((current) => ({ ...current, purchasing: true, message: '' }));

    try {
      const result = await purchase(GOLDEN_LEMON_SUPPORTER_SKU);

      if (result.status === OrderResultStatus.STATUS_SUCCESS) {
        setState((current) => ({
          ...current,
          supporter: true,
          purchasing: false,
          message: 'Thank you! Your Golden Lemon Supporter badge is now active.',
        }));
        return;
      }

      if (result.status === OrderResultStatus.STATUS_CANCELLED) {
        setState((current) => ({ ...current, purchasing: false }));
        return;
      }

      setState((current) => ({
        ...current,
        purchasing: false,
        message: result.errorMessage || 'Reddit could not complete the purchase. Please try again.',
      }));
    } catch (error) {
      console.warn('Support purchase failed:', error);
      setState((current) => ({
        ...current,
        purchasing: false,
        message: 'Reddit Gold purchases are unavailable in this preview.',
      }));
    }
  }, []);

  return { ...state, supportApp } as const;
};
