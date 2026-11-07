import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, Tag, ShoppingCart, ArrowRight, ShieldCheck, Loader2, LogIn } from 'lucide-react';
import { AppIcon, EmptyState, Skeleton } from './ui';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';

export function PromoField() {
  const { applyPromo, promo, setPromo } = useStore();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  if (promo) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-semibold text-emerald-500 dark:text-emerald-400"><Tag className="h-4 w-4" /> {promo.code} applied · {promo.percentOff}% off</span>
        <button onClick={() => setPromo(null)} className="text-xs text-muted hover:text-ink">Remove</button>
      </div>
    );
  }
  return (
    <div>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setMsg(await applyPromo(code)); setBusy(false); }} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={code} onChange={(e) => { setCode(e.target.value); setMsg(null); }} placeholder="Promo code" className="input !py-2.5 pl-10 uppercase" aria-label="Promo code" />
        </div>
        <button className="btn-ghost !py-2.5" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}</button>
      </form>
      {msg && <p className={`mt-1.5 text-xs ${msg.ok ? 'text-emerald-500' : 'text-rose-400'}`}>{msg.msg}</p>}
    </div>
  );
}

export function Summary({ compact = false }) {
  const { totals } = useStore();
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>${totals.subtotal.toFixed(2)}</dd></div>
      {totals.discount > 0 && <div className="flex justify-between text-emerald-500"><dt>Discount ({totals.pct}%)</dt><dd>−${totals.discount.toFixed(2)}</dd></div>}
      {!compact && <div className="flex justify-between"><dt className="text-muted">Tax (8%)</dt><dd>${totals.tax.toFixed(2)}</dd></div>}
      <div className="flex justify-between border-t border-line/10 pt-3 font-display text-lg font-bold">
        <dt>Total</dt><dd>${(compact ? totals.subtotal - totals.discount : totals.total).toFixed(2)}</dd>
      </div>
    </dl>
  );
}

export function CartLine({ line }) {
  const { updateLine, removeLine } = useStore();
  const { app } = line;
  return (
    <motion.li layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }} className="card overflow-hidden p-4">
      <div className="flex gap-3">
        <AppIcon icon={app.icon} colors={app.colors} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{app.name}</p>
            <button onClick={() => removeLine(line.id)} className="text-muted transition hover:text-rose-400" aria-label={`Remove ${app.name}`}><Trash2 className="h-4 w-4" /></button>
          </div>
          <p className="truncate text-xs text-muted">{line.bundle ? `${line.bundle.name} · save ${line.bundle.savings}%` : app.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-xl bg-line/5 p-0.5 text-xs" role="radiogroup" aria-label="Billing period">
              {['monthly', 'yearly'].map((b) => (
                <button key={b} role="radio" aria-checked={line.plan === b} onClick={() => line.plan !== b && updateLine(line.id, { plan: b })} className={`rounded-lg px-2.5 py-1 font-medium capitalize transition ${line.plan === b ? 'bg-brand text-white' : 'text-muted'}`}>{b}</button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => updateLine(line.id, { quantity: line.quantity - 1 })} disabled={line.quantity <= 1} className="grid h-7 w-7 place-items-center rounded-lg glass disabled:opacity-40" aria-label="Decrease seats"><Minus className="h-3 w-3" /></button>
              <span className="w-7 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
              <button onClick={() => updateLine(line.id, { quantity: line.quantity + 1 })} className="grid h-7 w-7 place-items-center rounded-lg glass" aria-label="Increase seats"><Plus className="h-3 w-3" /></button>
            </div>
          </div>
          <p className="mt-2 text-right text-sm font-bold">
            {money(line.lineTotal)}<span className="text-xs font-normal text-muted">{line.lineTotal === 0 ? '' : line.plan === 'yearly' ? '/yr' : '/mo'}</span>
          </p>
        </div>
      </div>
    </motion.li>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading cart">
      {[0, 1].map((i) => (
        <div key={i} className="card flex gap-3 p-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /><Skeleton className="h-7 w-full" /></div>
        </div>
      ))}
    </div>
  );
}

export default function CartDrawer() {
  const { cart, cartLoading, cartOpen, setCartOpen, totals } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e) => e.key === 'Escape' && setCartOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [cartOpen, setCartOpen]);

  const go = (path) => { setCartOpen(false); navigate(path); };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label="Shopping cart"
            className="fixed bottom-0 right-0 top-0 z-[70] flex w-full max-w-md flex-col border-l border-line/10 bg-bg/95 backdrop-blur-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-line/10 p-5">
              <div>
                <h2 className="text-xl font-bold">Your cart</h2>
                <p className="text-xs text-muted">{totals.count} {totals.count === 1 ? 'item' : 'items'}</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full glass" aria-label="Close cart"><X className="h-5 w-5" /></button>
            </div>

            {!user ? (
              <div className="flex flex-1 items-center p-5">
                <EmptyState icon={LogIn} title="Log in to see your cart" text="Your cart is saved to your account, so it follows you on every device.">
                  <button onClick={() => go('/login')} className="btn-primary">Log in</button>
                  <button onClick={() => go('/signup')} className="btn-ghost">Create account</button>
                </EmptyState>
              </div>
            ) : cartLoading && cart.items.length === 0 ? (
              <div className="flex-1 p-5"><CartSkeleton /></div>
            ) : cart.items.length === 0 ? (
              <div className="flex flex-1 items-center p-5">
                <EmptyState icon={ShoppingCart} title="Your cart is empty" text="Explore AI apps! Most come with a free trial, and they save hours every week.">
                  <button onClick={() => go('/explore')} className="btn-primary">Explore AI apps</button>
                </EmptyState>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto p-5">
                  <AnimatePresence initial={false}>
                    {cart.items.map((l) => <CartLine key={l.id} line={l} />)}
                  </AnimatePresence>
                </ul>
                <div className="space-y-4 border-t border-line/10 p-5">
                  <PromoField />
                  <Summary compact />
                  <button onClick={() => go('/checkout')} className="btn-primary w-full !py-3.5 text-base">
                    Checkout <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5" /> Cancel anytime · 14-day money-back guarantee</p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
