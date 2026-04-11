import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => void,
  intervalMs: number,
  immediate = true
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (immediate) savedCallback.current();
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, immediate]);
}
