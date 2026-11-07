import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

// Tiny stale-while-revalidate cache so moving between pages feels instant.
const cache = new Map();
export const invalidate = (prefix) => { for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k); };

/** useApi('/apps?sort=popular') → { data, error, loading, reload, setData }. Pass null to skip. */
export default function useApi(path) {
  const [state, setState] = useState(() => ({ data: path ? cache.get(path) ?? null : null, error: null, loading: !!path && !cache.has(path) }));
  const current = useRef(path);
  current.current = path;

  const load = useCallback(async (signal) => {
    if (!path) { setState({ data: null, error: null, loading: false }); return; }
    setState((s) => ({ data: cache.get(path) ?? (s.data && current.current === path ? s.data : null), error: null, loading: !cache.has(path) }));
    try {
      const data = await api(path, { signal });
      cache.set(path, data);
      if (current.current === path) setState({ data, error: null, loading: false });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      if (current.current === path) setState((s) => ({ data: s.data, error, loading: false }));
    }
  }, [path]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const setData = useCallback((updater) => setState((s) => {
    const data = typeof updater === 'function' ? updater(s.data) : updater;
    if (path) cache.set(path, data);
    return { ...s, data };
  }), [path]);

  return { ...state, reload: () => load(), setData };
}

/** Categories are used all over the UI; they rarely change. */
export const useCategories = () => {
  const { data, loading, error } = useApi('/categories');
  return { categories: data?.categories || [], loading, error };
};

/** AI pick of the day: rotates daily through the featured apps. */
export const useAIPick = () => {
  const { data, loading, error } = useApi('/apps?featured=1&sort=rating');
  const list = data?.apps || [];
  const day = Math.floor(Date.now() / 86400000);
  return { app: list.length ? list[day % list.length] : null, loading, error };
};
