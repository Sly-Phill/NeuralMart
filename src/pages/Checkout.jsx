import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Lock, ShoppingCart, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Page, EmptyState } from '../components/ui';
import { CartLine, PromoField, Summary, CartSkeleton } from '../components/CartDrawer';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

export default function Checkout() {
  const { cart, cartLoading, totals, checkout } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', card: '', exp: '', cvc: '', country: 'United States' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const up = (k, fmt) => (e) => { setF({ ...f, [k]: fmt ? fmt(e.target.value) : e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Please enter the name on your card.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'That email doesn’t look quite right.';
    if (f.card.replace(/\s/g, '').length !== 16) e.card = 'Card numbers have 16 digits. Try 4242 4242 4242 4242.';
    const [m, y] = f.exp.split('/').map(Number);
    if (!m || m > 12 || !y || y < 26) e.exp = 'Use a future date like 12/28.';
    if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = '3–4 digits on the back.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { toast('A few details need a look', { type: 'error', description: 'Check the highlighted fields.' }); return; }
    setLoading(true);
    // Mock payment: card details stay in this form and are never sent to the server.
    try {
      const [order] = await Promise.all([checkout(), new Promise((r) => setTimeout(r, 1200))]);
      navigate('/success', { state: { order, email: f.email } });
    } catch (err) {
      setLoading(false);
      toast('Payment didn’t go through', { type: 'error', description: err.message });
    }
  };

  if (cartLoading && cart.items.length === 0) {
    return <Page><div className="section max-w-xl"><CartSkeleton /></div></Page>;
  }

  if (cart.items.length === 0 && !loading) {
    return (
      <Page>
        <div className="section py-10">
          <EmptyState icon={ShoppingCart} title="Your cart is empty" text="Explore AI apps! Add an app or a bundle and come right back.">
            <Link to="/explore" className="btn-primary">Explore AI apps</Link>
            <Link to="/pricing" className="btn-ghost">See bundles</Link>
          </EmptyState>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="section">
        <Link to="/explore" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Keep shopping</Link>
        <h1 className="text-4xl font-extrabold sm:text-5xl">Checkout</h1>
        <p className="mt-2 text-sm text-muted">This is a demo — no real payment is taken.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <form onSubmit={submit} noValidate className="card space-y-5 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Payment details</h2>
              <span className="flex items-center gap-1.5 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> 256-bit encrypted</span>
            </div>

            {/* card preview */}
            <div className="relative aspect-[1.8] max-w-sm overflow-hidden rounded-2xl bg-brand p-5 text-white shadow-glow-lg">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between"><span className="font-display font-bold">NeuralMart</span><CreditCard className="h-6 w-6" /></div>
                <p className="font-mono text-lg tracking-widest sm:text-xl">{f.card || '•••• •••• •••• ••••'}</p>
                <div className="flex justify-between text-xs uppercase"><span className="truncate">{f.name || 'Your name'}</span><span>{f.exp || 'MM/YY'}</span></div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name on card" error={errors.name}><input className="input" value={f.name} onChange={up('name')} placeholder="Ada Lovelace" autoComplete="cc-name" /></Field>
              <Field label="Email for receipts" error={errors.email}><input className="input" type="email" value={f.email} onChange={up('email')} placeholder="you@company.com" autoComplete="email" /></Field>
            </div>
            <Field label="Card number" error={errors.card}><input className="input font-mono" inputMode="numeric" value={f.card} onChange={up('card', fmtCard)} placeholder="4242 4242 4242 4242" autoComplete="cc-number" /></Field>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Expiry" error={errors.exp}><input className="input" inputMode="numeric" value={f.exp} onChange={up('exp', fmtExp)} placeholder="MM/YY" autoComplete="cc-exp" /></Field>
              <Field label="CVC" error={errors.cvc}><input className="input" inputMode="numeric" value={f.cvc} onChange={up('cvc', (v) => v.replace(/\D/g, '').slice(0, 4))} placeholder="123" autoComplete="cc-csc" /></Field>
              <Field label="Country" className="col-span-2 sm:col-span-1">
                <select className="input" value={f.country} onChange={up('country')}>
                  {['United States', 'United Kingdom', 'Germany', 'Kenya', 'India', 'Canada', 'Australia', 'Brazil'].map((c) => <option key={c} className="bg-surface">{c}</option>)}
                </select>
              </Field>
            </div>

            <button disabled={loading} className="btn-primary w-full !py-4 text-base">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Activating your AI…</> : <><Lock className="h-4 w-4" /> Pay ${totals.total.toFixed(2)}</>}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 14-day money-back guarantee on every purchase</p>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
            <div className="card p-6">
              <h2 className="mb-4 text-xl font-bold">Order summary</h2>
              <ul className="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>{cart.items.map((l) => <CartLine key={l.id} line={l} />)}</AnimatePresence>
              </ul>
              <div className="mt-5 space-y-4 border-t border-line/10 pt-5">
                <PromoField />
                <Summary />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Page>
  );
}
