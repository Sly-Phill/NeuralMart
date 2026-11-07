import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { invalidate } from '../hooks/useApi';
import { api } from '../lib/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const StoreCtx = createContext(null);
const EMPTY_CART = { items: [], count: 0, subtotal: 0 };
const TAX_RATE = 0.08;
const round2 = (n) => Math.round(n * 100) / 100;

// Keys from the old browser-only version. The database is the source of truth now.
const LEGACY_KEYS = ['nm-cart', 'nm-wishlist', 'nm-library', 'nm-promo'];

export function StoreProvider({ children }) {
  const toast = useToast();
  const { user, requireLogin } = useAuth();

  const [cart, setCart] = useState(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlist, setWishlist] = useState([]); // slugs
  const [promo, setPromo] = useState(null); // { code, percentOff }
  const [cartOpen, setCartOpen] = useState(false);
  const [recent, setRecent] = useLocalStorage('nm-recent', []);
  const [compare, setCompare] = useLocalStorage('nm-compare', []);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const fail = useCallback((err, fallback) => toast(err?.message || fallback, { type: 'error' }), [toast]);

  /* ---------- load the user's data from the database on login ---------- */
  useEffect(() => {
    if (!user) { setCart(EMPTY_CART); setWishlist([]); setPromo(null); return; }
    try { LEGACY_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    let live = true;
    setCartLoading(true);
    Promise.all([api('/cart'), api('/wishlist')])
      .then(([c, w]) => { if (!live) return; setCart(c); setWishlist(w.apps.map((a) => a.id)); })
      .catch((e) => live && fail(e, 'Couldn’t load your cart.'))
      .finally(() => live && setCartLoading(false));
    return () => { live = false; };
  }, [user, fail]);

  /* ---------- cart ---------- */
  const addToCart = useCallback(async (slug, opts = {}) => {
    if (!user) return requireLogin('Log in to add apps to your cart');
    const body = opts.bundle ? { bundle: opts.bundle, plan: opts.plan } : { slug, plan: opts.plan };
    try {
      const existed = !opts.bundle && cartRef.current.items.some((i) => i.app.id === slug);
      const next = await api('/cart', { method: 'POST', body });
      setCart(next);
      if (opts.open) setCartOpen(true);
      else {
        const name = next.items.find((i) => i.app.id === slug)?.app.name || 'Item';
        toast(`${name} added to cart`, {
          description: existed ? 'Added another seat.' : 'Ready when you are.',
          action: { label: 'View cart →', onClick: () => setCartOpen(true) },
        });
      }
    } catch (e) { fail(e, 'Couldn’t add that to your cart.'); }
  }, [user, requireLogin, toast, fail]);

  // Optimistic: update the UI now, then sync with the server's priced cart.
  const updateLine = useCallback(async (id, patch) => {
    const prev = cartRef.current;
    const quantity = patch.quantity != null ? Math.max(1, Math.min(50, patch.quantity)) : undefined;
    setCart((c) => ({
      ...c,
      items: c.items.map((i) => (i.id === id ? { ...i, ...(patch.plan && { plan: patch.plan }), ...(quantity && { quantity, lineTotal: round2(i.unitPrice * quantity) }) } : i)),
    }));
    try {
      setCart(await api('/cart', { method: 'PATCH', body: { id, ...patch, ...(quantity && { quantity }) } }));
    } catch (e) { setCart(prev); fail(e, 'Couldn’t update your cart.'); }
  }, [fail]);

  const removeLine = useCallback(async (id) => {
    const prev = cartRef.current;
    setCart((c) => ({ ...c, items: c.items.filter((i) => i.id !== id) }));
    try {
      setCart(await api(`/cart?id=${id}`, { method: 'DELETE' }));
    } catch (e) { setCart(prev); fail(e, 'Couldn’t remove that item.'); }
  }, [fail]);

  const applyPromo = useCallback(async (code) => {
    if (!code.trim()) return { ok: false, msg: 'Enter a promo code first.' };
    try {
      const p = await api(`/checkout?promo=${encodeURIComponent(code.trim())}`);
      setPromo(p);
      toast(`${p.code} applied — ${p.percentOff}% off!`);
      return { ok: true, msg: `${p.percentOff}% off applied!` };
    } catch (e) {
      toast('Invalid promo code', { type: 'error', description: e.message });
      return { ok: false, msg: e.message };
    }
  }, [toast]);

  const totals = useMemo(() => {
    const subtotal = round2(cart.items.reduce((s, i) => s + i.lineTotal, 0));
    const pct = promo?.percentOff || 0;
    const discount = round2((subtotal * pct) / 100);
    const tax = round2((subtotal - discount) * TAX_RATE);
    return { subtotal, discount, pct, tax, total: round2(subtotal - discount + tax), count: cart.items.reduce((s, i) => s + i.quantity, 0) };
  }, [cart, promo]);

  const checkout = useCallback(async () => {
    const { order } = await api('/checkout', { method: 'POST', body: { promoCode: promo?.code || '' } });
    setCart(EMPTY_CART);
    setPromo(null);
    invalidate('/library');
    invalidate('/stats');
    return order;
  }, [promo]);

  /* ---------- wishlist (optimistic) ---------- */
  const toggleWish = useCallback(async (slug, name) => {
    if (!user) return requireLogin('Log in to save apps to your wishlist');
    const has = wishlist.includes(slug);
    setWishlist((w) => (has ? w.filter((x) => x !== slug) : [...w, slug]));
    toast(has ? `Removed ${name} from wishlist` : `Saved ${name} to wishlist`, { type: has ? 'info' : 'love' });
    try {
      const res = has
        ? await api(`/wishlist?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
        : await api('/wishlist', { method: 'POST', body: { slug } });
      setWishlist(res.apps.map((a) => a.id));
      invalidate('/wishlist');
    } catch (e) {
      setWishlist((w) => (has ? [...w, slug] : w.filter((x) => x !== slug)));
      fail(e, 'Couldn’t update your wishlist.');
    }
  }, [user, wishlist, requireLogin, toast, fail]);

  /* ---------- recently viewed & compare (per-browser, not account data) ---------- */
  const trackView = useCallback((slug) => setRecent((r) => [slug, ...r.filter((x) => x !== slug)].slice(0, 8)), [setRecent]);

  const toggleCompare = useCallback((slug, name) => {
    if (compare.includes(slug)) { setCompare((c) => c.filter((x) => x !== slug)); return; }
    if (compare.length >= 3) { toast('You can compare up to 3 apps', { type: 'error', description: 'Remove one to add another.' }); return; }
    setCompare((c) => (c.includes(slug) ? c : [...c, slug]));
    toast(`${name} added to compare`, { type: 'info' });
  }, [compare, setCompare, toast]);

  const value = {
    cart, cartLoading, addToCart, updateLine, removeLine, totals, promo, applyPromo, setPromo,
    cartOpen, setCartOpen, checkout,
    wishlist, toggleWish,
    recent, trackView,
    compare, setCompare, toggleCompare,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
