import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart, Sparkles, ChevronLeft, ChevronRight, Check, Plug, Clock, Building, GitCompare, BadgeCheck, Frown, ArrowLeft, Star, Loader2, PenLine, MessageSquare } from 'lucide-react';
import { Page, AppIcon, Stars, WishButton, Reveal, EmptyState, Skeleton, ErrorState } from '../components/ui';
import AppCard from '../components/AppCard';
import Screenshot from '../components/Screenshot';
import useApi, { invalidate } from '../hooks/useApi';
import { api } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { compact, money, timeAgo, initials } from '../utils/format';

/** A screenshot from the database, falling back to a generated mock-up if the image can't load. */
function Shot({ app, src, index, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Screenshot app={app} variant={index} />;
  return (
    <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/10 bg-surface ${className}`}>
      <img src={src} alt={`${app.name} screenshot ${index + 1}`} className="h-full w-full object-cover" loading="lazy" draggable="false" onError={() => setFailed(true)} />
    </div>
  );
}

function Gallery({ app }) {
  const shots = app.screenshots?.length ? app.screenshots : [null, null, null];
  const n = shots.length;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (d) => { setDir(d); setI((x) => (x + d + n) % n); };
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={i}
            custom={dir}
            initial={{ x: dir * 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -dir * 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}
          >
            <Shot app={app} src={shots[i]} index={i} />
          </motion.div>
        </AnimatePresence>
        <button onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full glass" aria-label="Previous screenshot"><ChevronLeft className="h-5 w-5" /></button>
        <button onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full glass" aria-label="Next screenshot"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {shots.map((src, k) => (
          <button key={k} onClick={() => { setDir(k > i ? 1 : -1); setI(k); }} className={`overflow-hidden rounded-xl border-2 transition ${k === i ? 'border-violet-500 shadow-glow' : 'border-transparent opacity-60 hover:opacity-100'}`} aria-label={`Screenshot ${k + 1}`}>
            {src ? (
              <img src={src} alt="" className="aspect-[16/10] w-full bg-surface object-cover" loading="lazy" draggable="false" />
            ) : (
              <div className="relative aspect-[16/10] bg-surface p-2">
                <div className="h-full rounded-lg" style={{ background: `linear-gradient(${120 + k * 50}deg, ${app.colors[0]}, ${app.colors[1]})`, opacity: 0.35 + k * 0.15 }} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ app, myReview, onSaved }) {
  const toast = useToast();
  const [rating, setRating] = useState(myReview?.rating || 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(myReview?.text || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Tap a star to rate it.');
    if (text.trim().length < 3) return setError('Add a few words about your experience.');
    setBusy(true); setError('');
    try {
      const res = await api(`/apps/${app.id}`, { method: 'POST', body: { rating, comment: text } });
      toast(res.updated ? 'Your review was updated' : 'Thanks for your review!', { description: `${app.name} is now rated ${res.rating.toFixed(1)}★.` });
      onSaved(res);
    } catch (err) {
      setError(err.message);
      toast('Couldn’t save your review', { type: 'error', description: err.message });
    } finally { setBusy(false); }
  };

  const shown = hover || rating;
  return (
    <form onSubmit={submit} className="card mb-6 p-5">
      <p className="flex items-center gap-2 font-semibold"><PenLine className="h-4 w-4 text-violet-400" /> {myReview ? 'Update your review' : `You own ${app.name} — how is it?`}</p>
      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button type="button" key={n} whileTap={{ scale: 0.8 }} onMouseEnter={() => setHover(n)} onClick={() => { setRating(n); setError(''); }} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            <Star className={`h-7 w-7 transition ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-muted/40'}`} />
          </motion.button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setError(''); }} rows={3} maxLength={1000} className="input mt-3 resize-none" placeholder="What do you use it for? What do you love, or wish were better?" aria-label="Your review" />
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
      <button disabled={busy} className="btn-primary mt-3">{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : myReview ? 'Update review' : 'Post review'}</button>
    </form>
  );
}

function DetailSkeleton() {
  return (
    <div className="section" role="status" aria-label="Loading app">
      <Skeleton className="mb-6 h-4 w-60" />
      <div className="card flex flex-col gap-6 p-8 lg:flex-row lg:items-center">
        <Skeleton className="h-24 w-24 !rounded-[1.75rem]" />
        <div className="flex-1 space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-10 w-72" /><Skeleton className="h-4 w-96 max-w-full" /></div>
        <Skeleton className="h-56 w-full !rounded-3xl lg:w-80" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="aspect-[16/10] !rounded-3xl" />
        <Skeleton className="h-80 !rounded-3xl" />
      </div>
    </div>
  );
}

export default function AppDetail() {
  const { id } = useParams();
  const { data, error, loading, reload, setData } = useApi(`/apps/${encodeURIComponent(id)}`);
  const { addToCart, trackView, toggleCompare, compare } = useStore();
  const { user, requireLogin } = useAuth();
  const toast = useToast();
  const [billing, setBilling] = useState('monthly');
  const app = data?.app;

  useEffect(() => {
    if (app) { trackView(app.id); document.title = `${app.name} · NeuralMart`; }
  }, [app?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ownership/review state depends on who is logged in.
  useEffect(() => { if (data) reload(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error?.status === 404) {
    return (
      <Page>
        <div className="section py-10">
          <EmptyState icon={Frown} title="This app wandered off" text="We couldn't find that AI app. It may have been renamed or removed from the marketplace.">
            <Link to="/explore" className="btn-primary"><ArrowLeft className="h-4 w-4" /> Back to marketplace</Link>
          </EmptyState>
        </div>
      </Page>
    );
  }
  if (error && !data) return <Page><div className="section py-10"><ErrorState error={error} onRetry={reload} /></div></Page>;
  if (loading || !app) return <Page><DetailSkeleton /></Page>;

  const { reviews, similar, owned, myReview } = data;
  const onReviewSaved = (res) => {
    setData((d) => ({ ...d, app: { ...d.app, rating: res.rating, reviews: res.ratingCount }, reviews: res.reviews, myReview: res.myReview }));
    invalidate('/apps?');
  };
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => (reviews.length ? Math.round((reviews.filter((r) => r.rating === n).length / reviews.length) * 100) : 0));

  return (
    <Page>
      <div className="section">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
          <Link to="/explore" className="hover:text-ink">Marketplace</Link><span>/</span>
          <Link to={`/explore?category=${app.category}`} className="hover:text-ink">{app.categoryName}</Link><span>/</span>
          <span className="text-ink">{app.name}</span>
        </nav>

        {/* HERO */}
        <div className="card relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: app.colors[0] }} />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: app.colors[1] }} />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <motion.div initial={{ scale: 0.6, rotate: -15, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                <AppIcon icon={app.icon} colors={app.colors} size="xl" />
              </motion.div>
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="chip glass">{app.categoryName}</span>
                  {app.freeTrial && <span className="chip bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">{app.trialDays}-day free trial</span>}
                  {owned && <span className="chip bg-violet-500/15 text-violet-400"><Check className="h-3 w-3" /> In your library</span>}
                  <span className="ai-badge"><Sparkles className="h-3 w-3" /> AI verified</span>
                </div>
                <h1 className="text-4xl font-extrabold sm:text-5xl">{app.name}</h1>
                <p className="mt-2 max-w-xl text-lg text-muted">{app.tagline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <Stars value={app.rating} showValue />
                  <span className="text-muted">{compact(app.reviews)} ratings</span>
                  <span className="flex items-center gap-1 text-muted"><Building className="h-3.5 w-3.5" /> {app.developer} <BadgeCheck className="h-3.5 w-3.5 text-electric-400" /></span>
                </div>
              </div>
            </div>

            <div className="glass w-full rounded-3xl p-5 lg:w-80">
              {app.price > 0 && (
                <div className="mb-4 flex rounded-xl bg-line/5 p-1 text-sm">
                  {['monthly', 'yearly'].map((b) => (
                    <button key={b} onClick={() => setBilling(b)} className={`relative flex-1 rounded-lg py-1.5 font-medium capitalize transition ${billing === b ? 'text-white' : 'text-muted'}`}>
                      {billing === b && <motion.span layoutId="detail-billing" className="absolute inset-0 rounded-lg bg-brand" />}
                      <span className="relative">{b}{b === 'yearly' && <span className="ml-1 text-[10px]">−20%</span>}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="font-display text-4xl font-bold">
                {app.price === 0 ? 'Free' : money(billing === 'yearly' ? app.priceYearly : app.price)}
                {app.price > 0 && <span className="text-base font-normal text-muted">{billing === 'yearly' ? '/yr' : '/mo'}</span>}
              </p>
              <div className="mt-4 grid gap-2">
                <button onClick={() => addToCart(app.id, { plan: billing, open: true })} className="btn-primary w-full shimmer-overlay">
                  <ShoppingCart className="h-4 w-4" /> {owned ? 'Add more seats' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => {
                    if (!user) return requireLogin(`Log in to start your ${app.name} trial`);
                    toast(app.freeTrial ? `Your ${app.trialDays}-day ${app.name} trial has started!` : `${app.name} is free — enjoy!`, { description: 'Check your inbox for the launch link.' });
                  }}
                  className="btn-ghost w-full"
                >
                  <Sparkles className="h-4 w-4 text-violet-400" /> {app.freeTrial ? 'Try Free' : 'Get it free'}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <WishButton id={app.id} name={app.name} />
                <button onClick={() => toggleCompare(app.id, app.name)} className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm glass ${compare.includes(app.id) ? 'border-violet-500/60 text-violet-400' : 'text-muted'}`}>
                  <GitCompare className="h-4 w-4" /> {compare.includes(app.id) ? 'In compare' : 'Compare'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <Reveal><Gallery app={app} /></Reveal>
            <Reveal>
              <div className="card p-6">
                <h2 className="text-2xl font-bold">About {app.name}</h2>
                <p className="mt-3 leading-relaxed text-muted">{app.description}</p>
                <h3 className="mt-6 text-lg font-bold">Features</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {app.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-500/15"><Check className="h-3.5 w-3.5 text-violet-400" /></span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <div className="space-y-8">
            <Reveal>
              <div className="card p-6">
                <h3 className="text-lg font-bold">Use cases</h3>
                <div className="mt-3 space-y-2">
                  {app.useCases.map((u, i) => (
                    <div key={u} className="flex items-center gap-3 rounded-2xl bg-line/5 p-3">
                      <span className="font-display text-sm font-bold text-violet-400">0{i + 1}</span><span className="text-sm">{u}</span>
                    </div>
                  ))}
                </div>
                <h3 className="mt-6 flex items-center gap-2 text-lg font-bold"><Plug className="h-4 w-4" /> Integrations</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {app.integrations.map((x) => <span key={x} className="chip glass">{x}</span>)}
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${app.colors[0]}22, ${app.colors[1]}22)` }}>
                  <Clock className="h-8 w-8 text-violet-400" />
                  <div><p className="font-display text-2xl font-bold">~{app.hoursSaved}h</p><p className="text-xs text-muted">saved per user every month</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* REVIEWS */}
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">Reviews</h2>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="card h-fit p-6 text-center">
              <p className="font-display text-6xl font-extrabold text-gradient">{app.rating.toFixed(1)}</p>
              <Stars value={app.rating} className="mt-2 justify-center" size="h-5 w-5" />
              <p className="mt-1 text-sm text-muted">{app.reviews.toLocaleString()} ratings</p>
              {reviews.length > 0 && (
                <div className="mt-5 space-y-1.5">
                  {dist.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-muted">{5 - i}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/10">
                        <motion.div className="h-full rounded-full bg-amber-400" initial={{ width: 0 }} whileInView={{ width: `${p}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }} />
                      </div>
                      <span className="w-8 text-right text-muted">{p}%</span>
                    </div>
                  ))}
                  <p className="pt-2 text-[11px] text-muted">Breakdown of {reviews.length} written reviews · avg {avg.toFixed(1)}</p>
                </div>
              )}
            </div>
            <div>
              {owned && <ReviewForm key={myReview?.id || 'new'} app={app} myReview={myReview} onSaved={onReviewSaved} />}
              {!owned && user && <p className="mb-4 text-sm text-muted">Buy {app.name} to leave a review — only verified owners can post.</p>}
              {reviews.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No written reviews yet" text={`Be the first to share how ${app.name} works for you.`} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews.map((r, i) => (
                    <Reveal key={r.id} delay={Math.min(i, 4) * 0.05}>
                      <div className={`card h-full p-5 ${myReview?.id === r.id ? '!border-violet-500/50' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand font-display text-sm font-bold text-white">{initials(r.name)}</span>
                          <div className="flex-1"><p className="text-sm font-semibold">{r.name}{myReview?.id === r.id && <span className="ml-2 text-xs text-violet-400">(you)</span>}</p><p className="text-xs text-muted">Verified owner</p></div>
                          <span className="text-xs text-muted">{timeAgo(r.date)}</span>
                        </div>
                        <Stars value={r.rating} size="h-3.5 w-3.5" className="mt-3" />
                        <p className="mt-2 text-sm text-muted">“{r.text}”</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SIMILAR */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Similar apps</h2>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {similar.map((a, i) => (
              <div key={a.id} className="w-72 shrink-0 snap-start lg:w-auto"><AppCard app={a} index={i} /></div>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
