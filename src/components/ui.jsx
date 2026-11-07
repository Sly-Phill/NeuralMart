// Small reusable building blocks.
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { Star, Heart, DatabaseZap, RefreshCw, AlertTriangle } from 'lucide-react';
import { isDbDown } from '../lib/api';
import { getIcon } from '../utils/icons';
import { useStore } from '../context/StoreContext';

export function AppIcon({ icon, colors = ['#8b5cf6', '#3b82f6'], size = 'md', className = '' }) {
  const Icon = getIcon(icon);
  const s = { sm: 'h-10 w-10 rounded-xl', md: 'h-14 w-14 rounded-2xl', lg: 'h-20 w-20 rounded-3xl', xl: 'h-24 w-24 rounded-[1.75rem]' }[size];
  const i = { sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-10 w-10', xl: 'h-12 w-12' }[size];
  return (
    <div
      className={`relative grid shrink-0 place-items-center text-white shadow-lg ${s} ${className}`}
      style={{ backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, boxShadow: `0 10px 30px -10px ${colors[0]}` }}
    >
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/25 to-transparent" />
      <Icon className={`relative ${i}`} strokeWidth={2} />
    </div>
  );
}

export function Stars({ value, size = 'h-4 w-4', showValue = false, className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`${value} out of 5 stars`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.max(0, Math.min(1, value - n + 1));
          return (
            <span key={n} className={`relative ${size}`}>
              <Star className={`absolute inset-0 ${size} text-muted/40`} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} fill-amber-400 text-amber-400`} />
              </span>
            </span>
          );
        })}
      </div>
      {showValue && <span className="text-sm font-semibold">{value.toFixed(1)}</span>}
    </div>
  );
}

export function WishButton({ id, name, className = '' }) {
  const { wishlist, toggleWish } = useStore();
  const on = wishlist.includes(id);
  const [burst, setBurst] = useState(0);
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!on) setBurst((b) => b + 1); toggleWish(id, name); }}
      className={`relative grid h-10 w-10 place-items-center rounded-full glass transition hover:border-pink-400/50 ${className}`}
      aria-label={on ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      aria-pressed={on}
    >
      <motion.span key={`h${burst}`} animate={on ? { scale: [1, 1.45, 1] } : {}} transition={{ duration: 0.4 }}>
        <Heart className={`h-[18px] w-[18px] transition-colors ${on ? 'fill-pink-500 text-pink-500' : 'text-muted'}`} />
      </motion.span>
      {burst > 0 && on && (
        <span key={burst} className="pointer-events-none absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-pink-400"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 22, y: Math.sin((i / 8) * Math.PI * 2) * 22, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </span>
      )}
    </motion.button>
  );
}

export function Counter({ to, suffix = '', prefix = '', decimals = 0, duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setVal });
    return () => c.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

export function Reveal({ children, delay = 0, className = '', y = 24 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'left', action }) {
  return (
    <div className={`mb-8 flex flex-col gap-4 md:flex-row md:items-end ${align === 'center' ? 'items-center text-center md:flex-col md:items-center' : 'md:justify-between'}`}>
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-violet-500/40 blur-2xl" />
        <div className="relative grid h-20 w-20 place-items-center rounded-full glass animate-float">
          <Icon className="h-9 w-9 text-violet-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{text}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </motion.div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`shimmer-overlay rounded-xl bg-line/[0.07] ${className}`} aria-hidden="true" />;
}

export function AppCardSkeleton() {
  return (
    <div className="card flex h-full flex-col p-5" aria-hidden="true">
      <div className="flex items-start justify-between">
        <Skeleton className="h-14 w-14 !rounded-2xl" />
        <Skeleton className="h-5 w-16 !rounded-full" />
      </div>
      <Skeleton className="mt-5 h-3 w-16" />
      <Skeleton className="mt-2 h-5 w-32" />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-4 h-3 w-28" />
      <div className="mt-4 flex items-center justify-between border-t border-line/10 pt-4">
        <Skeleton className="h-6 w-16" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-10 !rounded-full" />)}
        </div>
      </div>
    </div>
  );
}

export function AppGridSkeleton({ count = 8, className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }) {
  return (
    <div className={className} role="status" aria-label="Loading apps">
      {Array.from({ length: count }).map((_, i) => <AppCardSkeleton key={i} />)}
    </div>
  );
}

/** Friendly error with a retry button; says so clearly when the database can't be reached. */
export function ErrorState({ error, onRetry, compact = false }) {
  const db = isDbDown(error);
  const Icon = db ? DatabaseZap : AlertTriangle;
  return (
    <div className={`card mx-auto flex max-w-md flex-col items-center text-center ${compact ? 'px-5 py-6' : 'px-6 py-12'}`} role="alert">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-rose-500/30 blur-2xl" />
        <div className="relative grid h-16 w-16 place-items-center rounded-full glass"><Icon className="h-8 w-8 text-rose-400" /></div>
      </div>
      <h3 className="text-lg font-bold">{db ? 'We can’t reach the database' : 'Something went sideways'}</h3>
      <p className="mt-2 text-sm text-muted">{error?.message || 'Please try again in a moment.'}</p>
      {onRetry && <button onClick={onRetry} className="btn-ghost mt-5"><RefreshCw className="h-4 w-4" /> Try again</button>}
    </div>
  );
}

export function Page({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`pb-28 pt-24 md:pb-16 md:pt-28 ${className}`}
    >
      {children}
    </motion.main>
  );
}
