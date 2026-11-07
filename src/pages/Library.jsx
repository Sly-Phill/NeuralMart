import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Rocket, CalendarClock, Heart, History, Clock, Wallet, LibraryBig, Settings2, Table2, BarChart3, CalendarDays, Loader2 } from 'lucide-react';
import { Page, AppIcon, Counter, Reveal, EmptyState, WishButton, Stars, Skeleton, AppGridSkeleton, ErrorState } from '../components/ui';
import AppCard from '../components/AppCard';
import ChartTooltip, { axisProps } from '../components/ChartTooltip';
import useApi from '../hooks/useApi';
import { api } from '../lib/api';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const daysUntil = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));
const monthlyCost = (o) => (o.plan === 'yearly' ? o.app.priceYearly / 12 : o.app.price);

export default function Library() {
  const { user } = useAuth();
  const { wishlist, recent } = useStore();
  const toast = useToast();
  const [view, setView] = useState('chart');
  const [launching, setLaunching] = useState(null);
  const lib = useApi('/library');
  // re-fetch whenever the wishlist changes so hearts on this page stay in sync
  const wish = useApi(`/wishlist?v=${wishlist.join(',')}`);
  const recentApi = useApi(recent.length ? `/apps?slugs=${recent.join(',')}` : null);

  const owned = lib.data?.apps || [];
  const totalMinutes = owned.reduce((s, o) => s + o.usageMinutes, 0);
  const spend = Math.round(owned.reduce((s, o) => s + monthlyCost(o), 0));
  const nextRenewal = owned.length ? Math.min(...owned.map((o) => daysUntil(o.renewsAt))) : 0;
  const usage = owned.map((o) => ({ name: o.app.name, minutes: o.usageMinutes, color: o.app.colors[0] }));
  const wishApps = (wish.data?.apps || []).filter((a) => wishlist.includes(a.id));
  const viewed = recentApi.data?.apps || [];

  const launch = async (o) => {
    setLaunching(o.app.id);
    try {
      const res = await api('/library', { method: 'POST', body: { slug: o.app.id } });
      lib.setData(res);
      toast(`Launching ${o.app.name}…`, { type: 'info', description: `Logged a ${res.added}-minute session to your usage.` });
    } catch (e) {
      toast('Couldn’t launch that app', { type: 'error', description: e.message });
    } finally { setLaunching(null); }
  };

  return (
    <Page>
      <div className="section">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-3">My Library</p>
            <h1 className="text-4xl font-extrabold sm:text-5xl">Welcome back{user ? `, ${user.fullName.split(' ')[0]}` : ''} <motion.span className="inline-block" animate={{ rotate: [0, 18, -8, 18, 0] }} transition={{ duration: 1.2, delay: 0.5 }}>👋</motion.span></h1>
            <p className="mt-2 text-muted">{owned.length ? 'Your AI stack, renewals and usage in one place.' : 'Apps you buy will live here, ready to launch.'}</p>
          </div>
          <button onClick={() => toast('Billing settings coming soon', { type: 'info' })} className="btn-ghost self-start sm:self-auto"><Settings2 className="h-4 w-4" /> Manage billing</button>
        </div>

        {lib.error && !lib.data ? (
          <div className="mt-8"><ErrorState error={lib.error} onRetry={lib.reload} /></div>
        ) : (
          <>
            {/* stat tiles */}
            <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { Icon: LibraryBig, label: 'Active apps', node: <Counter to={owned.length} /> },
                { Icon: Clock, label: 'Minutes of AI work', node: <Counter to={totalMinutes} /> },
                { Icon: Wallet, label: 'Monthly spend', node: <Counter to={spend} prefix="$" /> },
                { Icon: CalendarDays, label: 'Days to next renewal', node: owned.length ? <Counter to={nextRenewal} /> : '—' },
              ].map(({ Icon, label, node }, i) => (
                <Reveal key={label} delay={i * 0.06}>
                  <div className="card p-5">
                    <Icon className="h-5 w-5 text-violet-400" />
                    <p className="mt-3 font-display text-3xl font-bold">{lib.data ? node : <Skeleton className="h-9 w-16" />}</p>
                    <p className="text-xs text-muted">{label}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* usage chart */}
              <Reveal>
                <div className="card h-full p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Usage by app</h2>
                      <p className="text-xs text-muted">Minutes logged · each Launch records a session</p>
                    </div>
                    <div className="flex rounded-xl bg-line/5 p-0.5" role="tablist" aria-label="Chart view">
                      {[['chart', BarChart3], ['table', Table2]].map(([v, I]) => (
                        <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === v ? 'bg-brand text-white' : 'text-muted'}`} aria-label={`${v} view`}><I className="h-4 w-4" /></button>
                      ))}
                    </div>
                  </div>
                  {!lib.data ? <Skeleton className="h-64" /> : owned.length === 0 ? (
                    <div className="grid h-64 place-items-center text-center text-sm text-muted">Buy an app and hit Launch — your usage will chart here.</div>
                  ) : view === 'chart' ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usage} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid vertical={false} stroke="rgba(143,138,175,0.15)" />
                          <XAxis dataKey="name" {...axisProps} interval={0} tickFormatter={(v) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)} />
                          <YAxis {...axisProps} allowDecimals={false} />
                          <Tooltip content={<ChartTooltip unit=" min" />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                          <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={48} animationDuration={1200}>
                            {usage.map((u) => <Cell key={u.name} fill="#8b5cf6" />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-xs text-muted"><th className="py-2">App</th><th className="py-2 text-right">Minutes used</th></tr></thead>
                        <tbody>{usage.map((r) => <tr key={r.name} className="border-t border-line/5"><td className="py-2">{r.name}</td><td className="py-2 text-right tabular-nums">{r.minutes}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Reveal>

              {/* renewals */}
              <Reveal delay={0.1}>
                <div className="card h-full p-6">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><CalendarClock className="h-5 w-5 text-violet-400" /> Upcoming renewals</h2>
                  {!lib.data ? <div className="mt-4 space-y-3">{[0, 1, 2].map((k) => <Skeleton key={k} className="h-10" />)}</div> : owned.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">Nothing renewing yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {[...owned].sort((x, y) => new Date(x.renewsAt) - new Date(y.renewsAt)).slice(0, 6).map((o) => {
                        const days = daysUntil(o.renewsAt);
                        return (
                          <li key={o.app.id} className="flex items-center gap-3">
                            <AppIcon icon={o.app.icon} colors={o.app.colors} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{o.app.name}</p>
                              <p className="text-xs text-muted">{fmtDate(o.renewsAt)} · {o.plan}</p>
                            </div>
                            <span className={`chip ${days <= 7 ? 'bg-amber-400/15 text-amber-500' : 'bg-line/5 text-muted'}`}>{days}d</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </Reveal>
            </div>

            {/* owned apps */}
            <section className="mt-12">
              <h2 className="mb-5 text-2xl font-bold">Your apps</h2>
              {!lib.data ? <AppGridSkeleton count={3} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" /> : owned.length === 0 ? (
                <EmptyState icon={LibraryBig} title="No apps yet" text="Apps you buy show up here with a Launch button, renewal dates and usage.">
                  <Link to="/explore" className="btn-primary">Find your first AI</Link>
                </EmptyState>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {owned.map((o, i) => (
                    <Reveal key={o.app.id} delay={Math.min(i, 6) * 0.05}>
                      <div className="card card-hover group relative overflow-hidden p-5">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-30 blur-3xl" style={{ background: o.app.colors[0] }} />
                        <div className="relative flex items-center gap-4">
                          <AppIcon icon={o.app.icon} colors={o.app.colors} />
                          <div className="min-w-0 flex-1">
                            <Link to={`/app/${o.app.id}`} className="font-display text-lg font-bold hover:text-violet-400">{o.app.name}</Link>
                            <p className="text-xs text-muted">Since {new Date(o.purchasedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {o.app.price ? `${money(o.plan === 'yearly' ? o.app.priceYearly : o.app.price)}/${o.plan === 'yearly' ? 'yr' : 'mo'}` : 'Free'}</p>
                          </div>
                        </div>
                        <div className="relative mt-4 flex items-center justify-between">
                          <span className="chip bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Active · renews {fmtDate(o.renewsAt)}</span>
                          <button onClick={() => launch(o)} disabled={launching === o.app.id} className="btn-primary !py-2">
                            {launching === o.app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Launch
                          </button>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* wishlist */}
        <section id="wishlist" className="mt-16 scroll-mt-28">
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold"><Heart className="h-6 w-6 fill-pink-500 text-pink-500" /> Wishlist</h2>
          {wish.error && !wish.data ? <ErrorState error={wish.error} onRetry={wish.reload} compact />
            : !wish.data ? <AppGridSkeleton count={4} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" />
            : wishApps.length === 0 ? (
              <EmptyState icon={Heart} title="Your wishlist is empty" text="Tap the heart on any app to save it for later.">
                <Link to="/explore" className="btn-primary">Browse apps</Link>
              </EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {wishApps.map((a, i) => <AppCard key={a.id} app={a} index={i} />)}
              </div>
            )}
        </section>

        {/* recently viewed */}
        <section className="mt-16">
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold"><History className="h-6 w-6 text-violet-400" /> Recently viewed</h2>
          {recent.length === 0 ? (
            <p className="card p-6 text-sm text-muted">Apps you look at will show up here. <Link to="/explore" className="font-semibold text-violet-400 hover:underline">Start exploring →</Link></p>
          ) : (
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {viewed.length === 0 && recent.slice(0, 4).map((s) => <Skeleton key={s} className="h-[4.5rem] w-64 shrink-0 !rounded-3xl" />)}
              {viewed.map((a) => (
                <Link key={a.id} to={`/app/${a.id}`} className="card card-hover flex w-64 shrink-0 items-center gap-3 p-4">
                  <AppIcon icon={a.icon} colors={a.colors} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                    <Stars value={a.rating} size="h-3 w-3" />
                  </div>
                  <WishButton id={a.id} name={a.name} className="!h-8 !w-8" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
