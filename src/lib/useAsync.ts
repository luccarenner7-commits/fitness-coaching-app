import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  /** When the current data last loaded successfully (ms epoch), or undefined. */
  updatedAt: number | undefined;
  /** Re-run the loader. */
  reload: () => void;
  /** Optimistically replace the current data without a reload. */
  setData: Dispatch<SetStateAction<T | undefined>>;
}

/**
 * Minimal data-loading hook. `deps` control when the loader re-runs.
 * Keeps the last result visible while reloading.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [updatedAt, setUpdatedAt] = useState<number>();
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(undefined);
    loaderRef
      .current()
      .then((result) => {
        if (alive) {
          setData(result);
          setUpdatedAt(Date.now());
        }
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, updatedAt, reload, setData };
}
