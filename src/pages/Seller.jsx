import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import confetti from 'canvas-confetti';
import { Rocket, Globe2, Wallet, BarChart3, ShieldCheck, Megaphone, Upload, Loader2, CheckCircle2, AlertCircle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Page, Reveal, SectionHeading, Counter, AppIcon, Skeleton } from '../components/ui';
import ChartTooltip, { axisProps } from '../components/ChartTooltip';
import useApi, { useCategories } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

const BENEFITS = [
  { Icon: Globe2, t: '186k+ active buyers', d: 'Reach teams actively looking for AI, in 140 countries.' },
  { Icon: Wallet, t: 'Keep 85% of revenue', d: 'Industry-leading split with weekly payouts.' },
  { Icon: BarChart3, t: 'Real-time analytics', d: 'See trials, conversions and churn as they happen.' },
  { Icon: ShieldCheck, t: 'Trust badge', d: 'Our privacy review boosts conversions by 32% on average.' },
  { Icon: Megaphone, t: 'Featured placement', d: 'Top apps get AI pick of the day and newsletter slots.' },
  { Icon: Rocket, t: 'Launch in a day', d: 'Plug in your billing with our SDK — no rebuild needed.' },
];

const SALES = [
  { m: 'May', v: 4200 }, { m: 'Jun', v: 5800 }, { m: 'Jul', v: 7100 }, { m: 'Aug', v: 6900 },
  { m: 'Sep', v: 9400 }, { m: 'Oct', v: 12600 }, { m: 'Nov', v: 15800 },
];
const TOP = [
  { id: 'reelgen', sales: 1240 }, { id: 'vocalis', sales: 890 }, { id: 'cutmaster', sales: 610 }, { id: 'dubwise', sales: 340 },
];

function SubmitForm() {
  const toast = useToast();
  const { categories } = useCategories();
  const [f, setF] = useState({ name: '', url: '', category: '', price: '', desc: '' });
  const [err, setErr] = useState({});
  const [state, setState] = useState('idle');

  const up = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined }); };
  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = 'Give your app a name.';
    if (!/^https?:\/\/\S+\.\S+/.test(f.url)) x.url = 'Use a full URL, like https://myapp.ai';
    if (!f.category) x.category = 'Pick the closest category.';
    if (f.price === '' || Number(f.price) < 0) x.price = 'Enter 0 for free.';
    if (f.desc.trim().length < 20) x.desc = 'A sentence or two (20+ characters) helps buyers.';
    setErr(x);
    if (Object.keys(x).length) return toast('Almost there!', { type: 'error', description: 'A few fields need attention.' });
    setState('loading');
    setTimeout(() => {
      setState('done');
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ['#8b5cf6', '#3b82f6', '#a78bfa'] });
      toast(`${f.name} submitted for review!`, { description: 'We usually reply within 48 hours.' });
    }, 1400);
  };

  const E = ({ k }) => err[k] ? <span className="mt-1 flex items-center gap-1 text-xs text-rose-400"><AlertCircle className="h-3.5 w-3.5" />{err[k]}</span> : null;

  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <AnimatePresence mode="wait">
        {state === 'done' ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-400" />
            <h3 className="mt-4 text-2xl font-bold">You’re in the queue! 🎉</h3>
            <p className="mt-2 max-w-sm text-sm text-muted">Our review team will test <span className="font-semibold text-ink">{f.name}</span> and email you within 48 hours.</p>
            <button onClick={() => { setState('idle'); setF({ name: '', url: '', category: '', price: '', desc: '' }); }} className="btn-ghost mt-6">Submit another app</button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate exit={{ opacity: 0 }} className="space-y-4">
            <h3 className="text-xl font-bold">Submit your AI app</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">App name</span><input className="input" value={f.name} onChange={up('name')} placeholder="e.g. PromptPal" /><E k="name" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">Website</span><input className="input" value={f.url} onChange={up('url')} placeholder="https://" /><E k="url" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">Category</span>
                <select className="input" value={f.category} onChange={up('category')}>
                  <option value="" className="bg-surface">Choose…</option>
                  {categories.map((c) => <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>)}
                </select><E k="category" />
              </label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">Price (USD / month)</span><input className="input" type="number" min="0" value={f.price} onChange={up('price')} placeholder="19" /><E k="price" /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">Short description</span><textarea rows={3} className="input resize-none" value={f.desc} onChange={up('desc')} placeholder="What does it do, and who is it for?" /><E k="desc" /></label>
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-violet-500/30 p-4 text-sm text-muted">
              <Upload className="h-5 w-5 text-violet-400" /> Drag your logo & screenshots here (optional)
            </div>
            <button disabled={state === 'loading'} className="btn-primary w-full !py-3.5">
              {state === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Rocket className="h-4 w-4" /> Submit for review</>}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Seller() {
  const { data: topData } = useApi(`/apps?slugs=${TOP.map((t) => t.id).join(',')}`);
  const getApp = (id) => topData?.apps.find((a) => a.id === id);
  const top = TOP.filter((t) => getApp(t.id));
  return (
    <Page>
      <div className="section">
        {/* hero */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">For AI builders</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">Sell your AI app to the <span className="text-gradient">people who need it.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-muted">List on NeuralMart and get instant distribution, unified billing and buyers who are ready to pay — while you focus on building.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#submit" className="btn-primary !px-7 !py-3.5">Start selling <ArrowUpRight className="h-4 w-4" /></a>
              <a href="#dashboard" className="btn-ghost !px-7 !py-3.5">Preview dashboard</a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[['$4.2M', 'paid to sellers'], ['85%', 'revenue share'], ['48h', 'review time']].map(([v, l]) => (
                <div key={l}><p className="font-display text-2xl font-bold text-gradient">{v}</p><p className="text-xs text-muted">{l}</p></div>
              ))}
            </div>
          </div>
          <div id="submit" className="scroll-mt-28"><SubmitForm /></div>
        </div>

        {/* benefits */}
        <section className="mt-24">
          <SectionHeading align="center" eyebrow="Why NeuralMart" title={<>Everything you need to <span className="text-gradient">grow</span></>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 0.05}>
                <div className="card card-hover h-full p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-400"><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-4 text-lg font-bold">{t}</h3>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* dashboard preview */}
        <section id="dashboard" className="mt-24 scroll-mt-28">
          <SectionHeading eyebrow="Seller dashboard" title="Your business, at a glance" subtitle="A preview of what sellers see, with sample numbers for “Clipwise Studio”." />
          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal>
              <div className="relative h-full overflow-hidden rounded-3xl bg-brand p-6 text-white shadow-glow-lg">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
                <p className="text-sm text-white/80">Total earnings</p>
                <p className="mt-2 font-display text-5xl font-extrabold"><Counter to={61800} prefix="$" duration={2.5} /></p>
                <p className="mt-2 flex items-center gap-1 text-sm"><TrendingUp className="h-4 w-4" /> +25.3% vs last month</p>
                <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/15 p-3"><p className="text-white/70">Next payout</p><p className="font-display text-lg font-bold">$3,940</p></div>
                  <div className="rounded-2xl bg-white/15 p-3"><p className="text-white/70">Trial → paid</p><p className="font-display text-lg font-bold">38%</p></div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="lg:col-span-2">
              <div className="card h-full p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div><h3 className="font-bold">Monthly sales</h3><p className="text-xs text-muted">Revenue, USD · May – Nov 2026</p></div>
                  <span className="chip bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"><TrendingUp className="h-3 w-3" /> Growing</span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SALES} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(143,138,175,0.15)" />
                      <XAxis dataKey="m" {...axisProps} />
                      <YAxis {...axisProps} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ stroke: '#6366f1', strokeOpacity: 0.4 }} />
                      <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#salesFill)" animationDuration={1800} activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12} className="lg:col-span-3">
              <div className="card p-6">
                <h3 className="font-bold">Top apps this month</h3>
                <p className="text-xs text-muted">Units sold</p>
                <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
                  <ul className="space-y-3">
                    {top.length === 0 && [0, 1, 2, 3].map((k) => <li key={k}><Skeleton className="h-10" /></li>)}
                    {top.map((t, i) => {
                      const a = getApp(t.id);
                      return (
                        <li key={t.id} className="flex items-center gap-3">
                          <span className="w-5 font-display text-sm font-bold text-muted">{i + 1}</span>
                          <AppIcon icon={a.icon} colors={a.colors} size="sm" />
                          <span className="flex-1 text-sm font-semibold">{a.name}</span>
                          <span className="text-sm tabular-nums text-muted">{t.sales.toLocaleString()}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={top.map((t) => ({ name: getApp(t.id).name, sales: t.sales }))} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="rgba(143,138,175,0.15)" />
                        <XAxis dataKey="name" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip content={<ChartTooltip unit=" units" />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                        <Bar dataKey="sales" radius={[4, 4, 0, 0]} maxBarSize={48} animationDuration={1400}>
                          {top.map((t, i) => <Cell key={t.id} fill="#8b5cf6" fillOpacity={1 - i * 0.18} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </Page>
  );
}
