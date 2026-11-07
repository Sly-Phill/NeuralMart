import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles, Bot, Cpu, Zap, ShieldCheck, Layers, Users, Clock, LayoutGrid } from 'lucide-react';
import { Page, Counter, Reveal, SectionHeading, AppIcon, Skeleton, AppGridSkeleton, ErrorState } from '../components/ui';
import AppCard from '../components/AppCard';
import AIPick from '../components/AIPick';
import { TRUSTED } from '../data/site';
import useApi, { useCategories } from '../hooks/useApi';
import { getIcon } from '../utils/icons';

const PROMPTS = ['Write blog posts...', 'Edit photos...', 'Automate emails...', 'Summarise meetings...', 'Generate code...', 'Dub videos...'];

function useTypewriter(words) {
  const [text, setText] = useState('');
  const [i, setI] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[i % words.length];
    const t = setTimeout(() => {
      if (!del && text === word) return setDel(true);
      if (del && text === '') { setDel(false); setI((n) => n + 1); return; }
      setText(word.slice(0, text.length + (del ? -1 : 1)));
    }, !del && text === word ? 1600 : del ? 35 : 70);
    return () => clearTimeout(t);
  }, [text, del, i, words]);
  return text;
}

function HeroSearch() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const typed = useTypewriter(PROMPTS);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); navigate(`/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}
      className="group relative mx-auto mt-10 max-w-2xl"
    >
      <div className="absolute -inset-1 rounded-[1.6rem] bg-brand opacity-40 blur-xl transition group-focus-within:opacity-70" />
      <div className="glass relative flex items-center gap-2 rounded-3xl p-2 pl-5">
        <Search className="h-5 w-5 shrink-0 text-violet-400" />
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-transparent py-3 text-base text-ink outline-none"
            aria-label="Search AI apps"
          />
          {!q && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-base text-muted">
              I want AI to&nbsp;<span className="text-ink/80">{typed}</span><span className="ml-0.5 inline-block h-5 w-0.5 animate-blink bg-violet-400" />
            </span>
          )}
        </div>
        <button className="btn-primary shrink-0 !rounded-2xl !px-4 sm:!px-6"><Sparkles className="h-4 w-4" /><span className="hidden sm:inline">Find AI</span></button>
      </div>
    </form>
  );
}

const TRUST_ICONS = [Sparkles, Bot, Cpu, Zap];

const STATS = [
  { key: 'apps', label: 'AI apps listed', Icon: LayoutGrid },
  { key: 'customers', label: 'Happy customers', Icon: Users },
  { key: 'purchases', label: 'Apps purchased', Icon: Zap },
];

export default function Home() {
  const { data: stats } = useApi('/stats');
  const { data: trendingData, error: trendingError, reload: reloadTrending } = useApi('/apps?sort=popular&limit=8');
  const { categories, loading: catLoading } = useCategories();
  const trending = trendingData?.apps || [];
  const floating = [trending[1], trending[0], trending[5], trending[3]].filter(Boolean);

  return (
    <Page className="!pt-0">
      {/* HERO */}
      <section className="relative overflow-hidden pb-16 pt-32 md:pt-40">
        {/* floating app icons */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {floating.map((a, i) => (
            <motion.div
              key={a.id}
              className="absolute"
              style={{ left: ['8%', '84%', '12%', '80%'][i], top: ['30%', '26%', '68%', '66%'][i] }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.9, scale: 1, y: [0, -14, 0] }}
              transition={{ opacity: { delay: 0.6 + i * 0.15 }, scale: { delay: 0.6 + i * 0.15 }, y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <AppIcon icon={a.icon} colors={a.colors} size="lg" className="rotate-[-8deg]" />
            </motion.div>
          ))}
        </div>

        <div className="section relative text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 rounded-full glass py-1.5 pl-1.5 pr-4 text-sm">
            <span className="ai-badge">New</span>
            <span className="text-muted">AI agents just landed on</span>
            <span className="font-semibold">NeuralMart</span>
            <ArrowRight className="h-3.5 w-3.5 text-violet-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-6 max-w-4xl text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl md:text-7xl"
          >
            Find the AI that <br className="hidden sm:block" />
            <span className="text-gradient">works for you.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg">
            <span className="font-semibold text-ink">NeuralMart</span> is the marketplace to discover, compare, try and buy the best AI apps, tools and agents — all in one place, with one bill.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <HeroSearch />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/explore" className="btn-primary !px-7 !py-3.5 text-base shimmer-overlay">
                Explore AI Apps <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="btn-ghost !px-7 !py-3.5 text-base">See bundles</Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Vetted for privacy</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Free trials on 90% of apps</span>
              <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-electric-400" /> One unified bill</span>
            </div>
          </motion.div>

          {/* stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3 sm:gap-6">
            {STATS.map(({ key, label, Icon }, i) => (
              <Reveal key={label} delay={i * 0.1}>
                <div className="card p-4 sm:p-6">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-violet-400" />
                  <p className="font-display text-2xl font-bold sm:text-4xl">
                    {stats ? <span className="text-gradient"><Counter to={stats[key]} /></span> : <Skeleton className="mx-auto h-9 w-20 sm:h-10" />}
                  </p>
                  <p className="mt-1 text-[11px] text-muted sm:text-sm">{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="relative py-6">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted">Trusted by teams across</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-4">
            {[...TRUSTED, ...TRUSTED].map((t, i) => {
              const I = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <span key={i} className="glass flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-muted">
                  <I className="h-4 w-4 text-violet-400" />
                  {t}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI PICK */}
      <section className="section py-16">
        <AIPick />
      </section>

      {/* CATEGORIES */}
      <section className="section py-10">
        <SectionHeading eyebrow="Categories" title="What do you want AI to do?" subtitle="Eight categories, hundreds of hand-tested tools." />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {catLoading && categories.length === 0 && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 !rounded-3xl" />)}
          {categories.map((c, i) => {
            const Icon = getIcon(c.icon);
            const count = c.count;
            return (
              <Reveal key={c.id} delay={i * 0.05}>
                <Link to={`/explore?category=${c.id}`} className="card card-hover group relative block overflow-hidden p-5">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-70" style={{ background: c.hue[0] }} />
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl text-white transition group-hover:scale-110" style={{ backgroundImage: `linear-gradient(135deg, ${c.hue[0]}, ${c.hue[1]})` }}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="relative mt-4 font-display text-lg font-bold">{c.name}</p>
                  <p className="relative text-xs text-muted">{c.blurb}</p>
                  <p className="relative mt-3 text-xs font-semibold text-violet-500 dark:text-violet-400">{count} apps →</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* TRENDING */}
      <section className="section py-16">
        <SectionHeading
          eyebrow="Trending this week"
          title="Loved by the community"
          action={<Link to="/explore?sort=popular" className="btn-ghost">View all <ArrowRight className="h-4 w-4" /></Link>}
        />
        {trendingError ? <ErrorState error={trendingError} onRetry={reloadTrending} />
          : trending.length === 0 ? <AppGridSkeleton count={8} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" />
          : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((a, i) => <AppCard key={a.id} app={a} index={i} />)}
            </div>
          )}
      </section>

      {/* HOW IT WORKS */}
      <section className="section py-16">
        <SectionHeading align="center" eyebrow="How it works" title={<>From curious to <span className="text-gradient">AI-powered</span> in minutes</>} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { Icon: Search, t: 'Discover', d: 'Search by what you want done, not by buzzwords. Filter by category, price and rating.' },
            { Icon: Layers, t: 'Compare & try', d: 'Put up to 3 apps side by side, then start a free trial with one click.' },
            { Icon: Zap, t: 'Launch & save', d: 'Buy once, manage everything in My Library and watch the hours-saved counter climb.' },
          ].map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 0.1}>
              <div className="card card-hover h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-glow"><Icon className="h-6 w-6" /></span>
                  <span className="font-display text-5xl font-extrabold text-line/10">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand p-8 text-center text-white sm:p-14">
            <div className="grid-bg absolute inset-0 opacity-40" />
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-electric-400/40 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-5xl">Build something? Sell it to people who need AI.</h2>
              <p className="mx-auto mt-4 max-w-lg text-white/80">List your AI app on NeuralMart and keep 85% of every sale. Payouts weekly.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/sell" className="btn bg-white text-violet-700 hover:bg-white/90">Start selling <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/explore" className="btn border border-white/30 text-white hover:bg-white/10">Browse apps</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </Page>
  );
}
