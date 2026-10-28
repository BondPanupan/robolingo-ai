"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const POLL_INTERVAL_MS = 3000;

interface PollingState<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  /** Fetch now, outside the interval (e.g. after sending a message). */
  refresh: () => void;
  /** Replace local data without a request (for optimistic updates). */
  mutate: (updater: (prev: T | undefined) => T | undefined) => void;
}

/**
 * Fetches `fetcher` immediately and then every `interval` ms while the tab is visible.
 * Pass `key = null` to pause. Changing `key` resets data and starts over.
 */
export function usePolling<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  interval = POLL_INTERVAL_MS,
): PollingState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(key !== null);
  const [tick, setTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Reset when the key changes (render-time state adjustment, no extra effect pass).
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setData(undefined);
    setError(null);
    setIsLoading(key !== null);
  }

  useEffect(() => {
    if (key === null) return;

    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const run = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const next = await fetcherRef.current(controller.signal);
        if (stopped) return;
        setData(next);
        setError(null);
      } catch (err) {
        if (stopped || (err instanceof DOMException && err.name === "AbortError")) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!stopped) {
          setIsLoading(false);
          schedule();
        }
      }
    };

    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") {
        timer = setTimeout(run, interval);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
      else clearTimeout(timer);
    };

    run();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [key, interval, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const mutate = useCallback(
    (updater: (prev: T | undefined) => T | undefined) => setData(updater),
    [],
  );

  return { data, error, isLoading, refresh, mutate };
}
