import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, SearchX, SlidersHorizontal, X, GitCompare, ArrowRight, LayoutGrid, Loader2 } from 'lucide-react';
import { Page, EmptyState, AppGridSkeleton, ErrorState } from '../components/ui';
import AppCard from '../components/AppCard';
import AIPick from '../components/AIPick';
import useApi, { useCategories } from '../hooks/useApi';
import { getIcon } from '../utils/icons';
import { useStore } from '../context/StoreContext';

const SORTS = [
  { id: 'popular', label: 'Most popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'rating', label: 'Top rated' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
];
const PRICE = [
  { id: 'all', label: 'Any price' },
  { id: 'free', label: 'Free' },
  { id: 'trial', label: 'Free trial' },
  { id: 'under20', label: 'Under $20' },
];

export default function Marketplace() {
  const [params, setParams] = useSearchParams();
  const { compare } = useStore();
  const { categories } = useCategories();
  const q = params.get('q') || '';
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'popular';
  const price = params.get('price') || 'all';

  // Debounce typing so we don't query the database on every keystroke.
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const set = (k, v, def) => {
    const next = new URLSearchParams(params);
    if (!v || v === def) next.delete(k); else next.set(k, v);
    setParams(next, { replace: true });
  };

  // Filtering, search and sorting all happen in the database.
  const qs = new URLSearchParams({ sort });
  if (category !== 'all') qs.set('category', category);
  if (price !== 'all') qs.set('price', price);
  if (debouncedQ.trim()) qs.set('q', debouncedQ.trim());
  const { data, error, loading, reload } = useApi(`/apps?${qs}`);
  const results = data?.apps || [];
  const searching = loading || q !== debouncedQ;

  const activeFilters = (q ? 1 : 0) + (category !== 'all' ? 1 : 0) + (price !== 'all' ? 1 : 0);
  const cat = categories.find((c) => c.id === category);

  return (
    <Page>
      <div className="section">
        <div className="mb-8">
          <p className="eyebrow mb-3">Marketplace</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            {cat ? <>{cat.name} <span className="text-gradient">AI apps</span></> : <>Explore <span className="text-gradient">AI apps</span></>}
          </h1>
          <p className="mt-3 max-w-xl text-muted">{cat ? cat.blurb + ' — hand-picked and tested.' : 'Every tool is vetted for quality, privacy and real-world usefulness.'}</p>
        </div>

        {/* search + sort */}
        <div className="sticky top-[4.75rem] z-30 -mx-4 mb-6 px-4 py-2 md:top-[5.25rem]">
          <div className="glass flex flex-col gap-2 rounded-2xl p-2 sm:flex-row">
            <div className="relative flex-1">
              {searching && q ? <Loader2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-400" /> : <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />}
              <input
                value={q}
                onChange={(e) => set('q', e.target.value, '')}
                placeholder="Search apps, features, integrations…"
                className="w-full rounded-xl bg-transparent py-3 pl-11 pr-10 text-sm outline-none"
                aria-label="Search apps"
              />
              {q && <button onClick={() => set('q', '', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Clear search"><X className="h-4 w-4" /></button>}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-none">
                <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <select value={sort} onChange={(e) => set('sort', e.target.value, 'popular')} className="w-full appearance-none rounded-xl bg-line/5 py-3 pl-10 pr-8 text-sm font-medium outline-none sm:w-52" aria-label="Sort by">
                  {SORTS.map((s) => <option key={s.id} value={s.id} className="bg-surface text-ink">{s.label}</option>)}
                </select>
              </div>
              <select value={price} onChange={(e) => set('price', e.target.value, 'all')} className="appearance-none rounded-xl bg-line/5 px-4 py-3 text-sm font-medium outline-none" aria-label="Price filter">
                {PRICE.map((s) => <option key={s.id} value={s.id} className="bg-surface text-ink">{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* categories */}
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ id: 'all', name: 'All', icon: 'LayoutGrid' }, ...categories].map((c) => {
            const Icon = c.id === 'all' ? LayoutGrid : getIcon(c.icon);
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => set('category', c.id, 'all')}
                className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${active ? 'text-white' : 'glass text-muted hover:text-ink'}`}
                aria-pressed={active}
              >
                {active && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-brand shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{c.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex items-center justify-between text-sm">
          <p className="text-muted">{data ? <><span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? 'app' : 'apps'} found</> : 'Loading apps…'}</p>
          {activeFilters > 0 && (
            <button onClick={() => setParams({}, { replace: true })} className="font-medium text-violet-500 hover:underline dark:text-violet-400">Clear filters ({activeFilters})</button>
          )}
        </div>

        {error ? (
          <div className="py-10"><ErrorState error={error} onRetry={reload} /></div>
        ) : !data ? (
          <AppGridSkeleton count={8} />
        ) : results.length === 0 ? (
          <div className="py-10">
            <EmptyState icon={SearchX} title="No apps match your search" text={`We couldn't find apps matching “${debouncedQ || cat?.name || 'your filters'}”. Try a broader term like “video” or “email”.`}>
              <button onClick={() => setParams({}, { replace: true })} className="btn-primary">Reset filters</button>
              <Link to="/sell" className="btn-ghost">Build it & sell it</Link>
            </EmptyState>
          </div>
        ) : (
          <motion.div layout className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${searching ? 'opacity-60' : ''}`}>
            <AnimatePresence mode="popLayout">
              {results.map((a, i) => <AppCard key={a.id} app={a} index={i} />)}
            </AnimatePresence>
          </motion.div>
        )}

        {category === 'all' && !q && <div className="mt-16"><AIPick /></div>}
      </div>

      {/* floating compare bar */}
      <AnimatePresence>
        {compare.length >= 2 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md md:bottom-6">
            <Link to="/compare" className="glass flex items-center justify-between gap-3 rounded-2xl p-3 pl-5 shadow-glow-lg">
              <span className="flex items-center gap-2 text-sm font-semibold"><GitCompare className="h-4 w-4 text-violet-400" /> {compare.length} apps ready to compare</span>
              <span className="btn-primary !py-2">Compare <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
}
