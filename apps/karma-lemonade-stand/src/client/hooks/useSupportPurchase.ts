import { useCallback, useEffect, useState } from 'react';
import { OrderResultStatus, purchase } from '@devvit/web/client';
import type { SupporterResetResponse, SupporterStatusResponse } from '../../shared/types/api';

export const GOLDEN_LEMON_SUPPORTER_SKU = 'golden-lemon-supporter';

type SupportPurchaseState = {
  supporter: boolean;
  loading: boolean;
  purchasing: boolean;
  resetting: boolean;
  canResetTestSupporter: boolean;
  message: string;
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const useSupportPurchase = () => {
  const [state, setState] = useState<SupportPurchaseState>({
    supporter: false,
    loading: true,
    purchasing: false,
    resetting: false,
    canResetTestSupporter: false,
    message: '',
  });

  const fetchStatus = useCallback(async (): Promise<SupporterStatusResponse> => {
    const response = await fetch('/api/supporter-status');
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Supporter status unavailable (HTTP ${response.status})`);
    }
    return (await response.json()) as SupporterStatusResponse;
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    const loadStatus = async () => {
      try {
        const data = await fetchStatus();
        setState((current) => ({
          ...current,
          supporter: data.supporter,
          canResetTestSupporter: data.canResetTestSupporter,
          loading: false,
        }));
      } catch (error) {
        console.warn('Failed to fetch supporter status:', error);
        setState((current) => ({ ...current, loading: false }));
      }
    };

    void loadStatus();
  }, [fetchStatus]);

  const supportApp = useCallback(async () => {
    setState((current) => ({ ...current, purchasing: true, message: '' }));

    try {
      const result = await purchase(GOLDEN_LEMON_SUPPORTER_SKU);

      if (result.status === OrderResultStatus.STATUS_SUCCESS) {
        let confirmedStatus: SupporterStatusResponse | undefined;

        for (let attempt = 0; attempt < 6; attempt += 1) {
          if (attempt > 0) await wait(400 * attempt);
          try {
            confirmedStatus = await fetchStatus();
            if (confirmedStatus.supporter) break;
          } catch (error) {
            console.warn('Support fulfillment confirmation failed:', error);
          }
        }

        if (!confirmedStatus?.supporter) {
          setState((current) => ({
            ...current,
            supporter: false,
            purchasing: false,
            canResetTestSupporter:
              confirmedStatus?.canResetTestSupporter ?? current.canResetTestSupporter,
            message:
              'Reddit accepted checkout, but the server has not confirmed fulfillment yet. Reopen the game shortly to refresh.',
          }));
          return;
        }

        setState((current) => ({
          ...current,
          supporter: confirmedStatus.supporter,
          purchasing: false,
          canResetTestSupporter: confirmedStatus.canResetTestSupporter,
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
  }, [fetchStatus]);

  const resetTestSupporter = useCallback(async () => {
    setState((current) => ({ ...current, resetting: true, message: '' }));

    try {
      const response = await fetch('/api/supporter-status', { method: 'DELETE' });
      const data = (await response.json()) as SupporterResetResponse | { message?: string };
      if (!response.ok || !('type' in data) || data.type !== 'supporter-reset') {
        throw new Error(data.message || `Test reset unavailable (HTTP ${response.status})`);
      }

      setState((current) => ({
        ...current,
        supporter: false,
        resetting: false,
        message: data.message,
      }));
    } catch (error) {
      console.warn('Supporter test reset failed:', error);
      setState((current) => ({
        ...current,
        resetting: false,
        message: error instanceof Error ? error.message : 'Unable to reset the test badge.',
      }));
    }
  }, []);

  return { ...state, supportApp, resetTestSupporter } as const;
};
