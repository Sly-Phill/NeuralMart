import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, GitCompare, Check } from 'lucide-react';
import { AppIcon, Stars, WishButton } from './ui';
import { useStore } from '../context/StoreContext';
import { compact, money } from '../utils/format';

const AppCard = forwardRef(function AppCard({ app, index = 0 }, ref) {
  const { addToCart, compare, toggleCompare } = useStore();
  const comparing = compare.includes(app.id);
  const isNew = new Date(app.released) > new Date('2026-09-01');

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Link
        to={`/app/${app.id}`}
        className="card card-hover relative flex h-full flex-col overflow-hidden p-5"
      >
        {/* glow on hover */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: app.colors[0] }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <AppIcon icon={app.icon} colors={app.colors} />
          <div className="flex flex-col items-end gap-1.5">
            {app.freeTrial && <span className="chip bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">Free trial</span>}
            {isNew && <span className="ai-badge">New AI</span>}
          </div>
        </div>
        <div className="relative mt-4 flex-1">
          <p className="text-xs font-medium text-muted">{app.categoryName}</p>
          <h3 className="mt-0.5 text-lg font-bold">{app.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{app.tagline}</p>
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-sm">
          <Stars value={app.rating} size="h-3.5 w-3.5" />
          <span className="font-semibold">{app.rating}</span>
          <span className="text-muted">({compact(app.reviews)})</span>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-line/10 pt-4">
          <div>
            <span className="font-display text-xl font-bold">{money(app.price)}</span>
            {app.price > 0 && <span className="text-xs text-muted">/mo</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); toggleCompare(app.id, app.name); }}
              className={`grid h-10 w-10 place-items-center rounded-full glass transition hover:border-violet-500/50 ${comparing ? 'border-violet-500/60 text-violet-400' : 'text-muted'}`}
              aria-label={comparing ? `Remove ${app.name} from compare` : `Compare ${app.name}`}
              title="Compare"
            >
              {comparing ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
            </button>
            <WishButton id={app.id} name={app.name} />
            <button
              onClick={(e) => { e.preventDefault(); addToCart(app.id); }}
              className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white shadow-glow transition hover:scale-110"
              aria-label={`Add ${app.name} to cart`}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

export default AppCard;
