import { useEffect, useState } from 'react';

/**
 * Hook to safely access the Shivi API when it's available
 * Waits for the preload script to inject window.shiviAPI/shiviApi
 */
export function useShiviAPI() {
  const [api, setApi] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // ~5 seconds with 100ms intervals
    const checkInterval = 100;

    const checkAPI = () => {
      // Try both naming conventions
      const shiviAPI = (window as any).shiviAPI || (window as any).shiviApi;
      
      if (shiviAPI) {
        setApi(shiviAPI);
        setIsReady(true);
        return true;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkAPI, checkInterval);
      } else {
        console.warn('Shivi API failed to load after retries');
        setIsReady(true); // Mark as ready anyway to prevent infinite waiting
      }
      return false;
    };

    checkAPI();
  }, []);

  return { api, isReady };
}
