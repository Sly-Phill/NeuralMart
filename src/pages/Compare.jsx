import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Check, Minus, Trophy, ShoppingCart, GitCompare } from 'lucide-react';
import { Page, AppIcon, Stars, EmptyState, Skeleton, ErrorState } from '../components/ui';
import useApi from '../hooks/useApi';
import { useStore } from '../context/StoreContext';
import { compact, money } from '../utils/format';

function Picker({ exclude, onPick, apps }) {
  return (
    <div className="card flex h-full min-h-[220px] flex-col items-center justify-center gap-3 border-dashed p-5 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-500/15"><Plus className="h-6 w-6 text-violet-400" /></span>
      <p className="text-sm font-semibold">Add an app</p>
      <select
        value=""
        onChange={(e) => e.target.value && onPick(e.target.value)}
        className="input !py-2.5 text-center"
        aria-label="Choose an app to compare"
        disabled={!apps}
      >
        <option value="" className="bg-surface">{apps ? 'Choose…' : 'Loading apps…'}</option>
        {(apps || []).filter((a) => !exclude.includes(a.id)).map((a) => (
          <option key={a.id} value={a.id} className="bg-surface text-ink">{a.name} — {a.categoryName}</option>
        ))}
      </select>
    </div>
  );
}

const Yes = () => <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15"><Check className="h-3.5 w-3.5 text-emerald-400" /></span>;
const No = () => <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-line/5"><Minus className="h-3.5 w-3.5 text-muted/60" /></span>;

export default function Compare() {
  const { compare, setCompare, addToCart } = useStore();
  const ids = compare.slice(0, 3);
  const { data, error, reload } = useApi(ids.length ? `/apps/compare?ids=${ids.join(',')}` : null);
  const { data: all } = useApi('/apps?sort=popular');
  // keep the user's chosen order and drop anything that no longer exists
  const apps = ids.map((id) => data?.apps.find((a) => a.id === id)).filter(Boolean);
  const loadingSlots = data ? 0 : ids.length;
  const slots = Math.max(2, Math.min(3, ids.length + 1));

  const pick = (id) => setCompare((c) => (c.length < 3 && !c.includes(id) ? [...c, id] : c));
  const remove = (id) => setCompare((c) => c.filter((x) => x !== id));

  const minPrice = Math.min(...apps.map((a) => a.price));
  const maxRating = Math.max(...apps.map((a) => a.rating));
  const maxHours = Math.max(...apps.map((a) => a.hoursSaved));
  const allFeatures = [...new Set(apps.flatMap((a) => a.features))].slice(0, 12);
  const allIntegrations = [...new Set(apps.flatMap((a) => a.integrations))];

  const best = (cond) => (cond && apps.length > 1 ? 'text-emerald-500 dark:text-emerald-400 font-bold' : '');
  const gridStyle = { gridTemplateColumns: `140px repeat(${apps.length}, minmax(180px, 1fr))` };

  const rows = [
    { label: 'Price', render: (a) => <span className={best(a.price === minPrice)}>{money(a.price)}{a.price > 0 && '/mo'}</span> },
    { label: 'Yearly price', render: (a) => (a.priceYearly ? `${money(a.priceYearly)}/yr` : 'Free') },
    { label: 'Rating', render: (a) => <div className="flex flex-col items-center gap-1"><Stars value={a.rating} size="h-3.5 w-3.5" /><span className={best(a.rating === maxRating)}>{a.rating.toFixed(1)}</span></div> },
    { label: 'Ratings', render: (a) => compact(a.reviews) },
    { label: 'Free trial', render: (a) => (a.freeTrial ? <span className="text-sm">{a.trialDays} days</span> : <No />) },
    { label: 'Category', render: (a) => a.categoryName },
    { label: 'Hours saved / mo', render: (a) => <span className={best(a.hoursSaved === maxHours)}>~{a.hoursSaved}h</span> },
    { label: 'Developer', render: (a) => a.developer },
  ];

  return (
    <Page>
      <div className="section">
        <p className="eyebrow mb-3">Compare</p>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Side by side, <span className="text-gradient">no guesswork.</span></h1>
        <p className="mt-3 max-w-xl text-muted">Pick 2–3 apps to compare price, features, ratings and integrations. Winners are highlighted in green.</p>

        {error && <div className="mt-10"><ErrorState error={error} onRetry={reload} compact /></div>}

        {/* selectors */}
        <div className={`mt-10 grid gap-4 ${slots === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {Array.from({ length: loadingSlots }).map((_, i) => <Skeleton key={`s${i}`} className="h-[260px] !rounded-3xl" />)}
          <AnimatePresence mode="popLayout">
            {apps.map((a) => (
              <motion.div key={a.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card relative flex flex-col items-center p-5 text-center">
                <button onClick={() => remove(a.id)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full glass text-muted hover:text-rose-400" aria-label={`Remove ${a.name}`}><X className="h-4 w-4" /></button>
                {a.rating === maxRating && apps.length > 1 && <span className="absolute left-3 top-3 chip bg-amber-400/15 text-amber-500"><Trophy className="h-3 w-3" /> Top rated</span>}
                <AppIcon icon={a.icon} colors={a.colors} size="lg" className="mt-4" />
                <Link to={`/app/${a.id}`} className="mt-3 font-display text-lg font-bold hover:text-violet-400">{a.name}</Link>
                <p className="line-clamp-2 text-xs text-muted">{a.tagline}</p>
                <button onClick={() => addToCart(a.id)} className="btn-primary mt-4 w-full !py-2.5"><ShoppingCart className="h-4 w-4" /> Add to cart</button>
              </motion.div>
            ))}
            {ids.length < 3 && (
              <motion.div key="picker" layout>
                <Picker exclude={ids} onPick={pick} apps={all?.apps} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {data && apps.length < 2 ? (
          <div className="mt-12">
            <EmptyState icon={GitCompare} title={apps.length ? 'Add one more app' : 'Pick apps to compare'} text="Comparisons need at least two contenders. Pick apps above or tap the compare icon on any app card.">
              <Link to="/explore" className="btn-primary">Browse apps</Link>
            </EmptyState>
          </div>
        ) : !data && ids.length < 2 ? (
          <div className="mt-12">
            <EmptyState icon={GitCompare} title="Pick apps to compare" text="Choose two or three apps above, or tap the compare icon on any app card.">
              <Link to="/explore" className="btn-primary">Browse apps</Link>
            </EmptyState>
          </div>
        ) : apps.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mt-10 overflow-x-auto">
            <div className="min-w-max">
              <div style={gridStyle} className="grid border-b border-line/10 bg-line/5 text-sm font-semibold">
                <div className="p-4 text-muted">Overview</div>
                {apps.map((a) => <div key={a.id} className="p-4 text-center">{a.name}</div>)}
              </div>
              {rows.map((r) => (
                <div key={r.label} style={gridStyle} className="grid border-b border-line/5 text-sm transition hover:bg-violet-500/5">
                  <div className="p-4 text-muted">{r.label}</div>
                  {apps.map((a) => <div key={a.id} className="flex items-center justify-center p-4 text-center">{r.render(a)}</div>)}
                </div>
              ))}

              <div style={gridStyle} className="grid border-b border-line/10 bg-line/5 text-sm font-semibold">
                <div className="p-4 text-muted">Features</div>
                {apps.map((a) => <div key={a.id} className="p-4 text-center text-xs text-muted">{a.features.length} total</div>)}
              </div>
              {allFeatures.map((f) => (
                <div key={f} style={gridStyle} className="grid border-b border-line/5 text-sm transition hover:bg-violet-500/5">
                  <div className="p-4">{f}</div>
                  {apps.map((a) => <div key={a.id} className="flex items-center p-4">{a.features.includes(f) ? <Yes /> : <No />}</div>)}
                </div>
              ))}

              <div style={gridStyle} className="grid border-b border-line/10 bg-line/5 text-sm font-semibold">
                <div className="p-4 text-muted">Integrations</div>
                {apps.map((a) => <div key={a.id} className="p-4 text-center text-xs text-muted">{a.integrations.length} total</div>)}
              </div>
              {allIntegrations.map((f) => (
                <div key={f} style={gridStyle} className="grid border-b border-line/5 text-sm transition hover:bg-violet-500/5">
                  <div className="p-4">{f}</div>
                  {apps.map((a) => <div key={a.id} className="flex items-center p-4">{a.integrations.includes(f) ? <Yes /> : <No />}</div>)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Page>
  );
}
