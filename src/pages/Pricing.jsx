import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight, BadgePercent, HelpCircle } from 'lucide-react';
import { Page, AppIcon, Reveal, SectionHeading, Skeleton, ErrorState } from '../components/ui';
import { PLANS } from '../data/site';
import useApi from '../hooks/useApi';
import { getIcon } from '../utils/icons';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';

const FAQ = [
  ['Can I cancel anytime?', 'Yes. Every subscription can be cancelled from My Library in one click, and you keep access until the end of the billing period.'],
  ['Do bundles include free trials?', 'Bundles come with a 14-day money-back guarantee instead of a trial — if it’s not for you, we refund in full.'],
  ['How does unified billing work?', 'You get one invoice from NeuralMart for every app you buy, no matter how many vendors are involved.'],
  ['Is my data safe?', 'Every listed app passes our privacy review. We never sell your data and apps only get the permissions you approve.'],
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  const [open, setOpen] = useState(0);
  const { addToCart } = useStore();
  const { data, error, reload } = useApi('/bundles');
  const bundles = data?.bundles;
  const toast = useToast();

  return (
    <Page>
      <div className="section">
        <div className="text-center">
          <p className="eyebrow mb-3">Pricing & bundles</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold sm:text-6xl">Simple plans. <span className="text-gradient">Smarter savings.</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">Membership unlocks discounts on every app in the marketplace. Bundles stack them for even bigger savings.</p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full glass p-1.5">
            {['Monthly', 'Yearly'].map((l) => {
              const on = (l === 'Yearly') === yearly;
              return (
                <button key={l} onClick={() => setYearly(l === 'Yearly')} className={`relative rounded-full px-5 py-2 text-sm font-semibold transition ${on ? 'text-white' : 'text-muted'}`} aria-pressed={on}>
                  {on && <motion.span layoutId="bill-toggle" className="absolute inset-0 rounded-full bg-brand shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <span className="relative">{l}</span>
                </button>
              );
            })}
            <span className="chip mr-2 bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">Save 20%</span>
          </div>
        </div>

        {/* plans */}
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => {
            const Icon = getIcon(p.icon);
            const price = yearly ? p.yearly : p.monthly;
            return (
              <Reveal key={p.id} delay={i * 0.08}>
                <div className={`relative h-full rounded-[2rem] ${p.popular ? 'p-[1.5px] lg:-my-3 lg:h-[calc(100%+1.5rem)]' : ''}`}>
                  {p.popular && <div className="absolute inset-0 animate-gradient rounded-[2rem] bg-[linear-gradient(120deg,#7c3aed,#3b82f6,#ec4899,#7c3aed)] bg-[length:300%_300%]" />}
                  <div className={`card relative flex h-full flex-col p-7 ${p.popular ? '!rounded-[calc(2rem-1.5px)] !border-transparent !bg-bg/90 lg:py-10' : 'card-hover'}`}>
                    {p.popular && <span className="ai-badge absolute right-6 top-6">Most popular</span>}
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${p.popular ? 'bg-brand text-white shadow-glow' : 'bg-violet-500/15 text-violet-400'}`}><Icon className="h-6 w-6" /></span>
                    <h3 className="mt-5 text-2xl font-bold">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted">{p.blurb}</p>
                    <div className="mt-6 flex items-end gap-1">
                      <AnimatePresence mode="wait">
                        <motion.span key={price} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="font-display text-5xl font-extrabold">
                          ${price}
                        </motion.span>
                      </AnimatePresence>
                      <span className="mb-2 text-sm text-muted">/mo</span>
                    </div>
                    <p className="h-5 text-xs text-muted">{price > 0 && yearly ? `Billed $${price * 12} yearly` : price > 0 ? 'Billed monthly' : 'Free forever'}</p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm"><Check className="h-4 w-4 shrink-0 text-violet-400" />{f}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        if (p.id === 'starter') return toast('You’re on Starter — welcome aboard!', { description: 'Free trials unlocked across the marketplace.' });
                        if (p.id === 'business') return toast('Thanks! Our team will reach out within a day.', { type: 'info' });
                        toast('Pro memberships launch soon', { type: 'info', description: 'You’re on the early-access list — we’ll email you first.' });
                      }}
                      className={`${p.popular ? 'btn-primary' : 'btn-ghost'} mt-8 w-full`}
                    >
                      {p.cta} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* bundles */}
        <section className="mt-24">
          <SectionHeading eyebrow="AI Power Bundles" title={<>Curated stacks. <span className="text-gradient">Massive savings.</span></>} subtitle="Hand-picked apps that work brilliantly together, priced to make the decision easy." />
          <div className="grid gap-5 lg:grid-cols-3">
            {error && <div className="lg:col-span-3"><ErrorState error={error} onRetry={reload} /></div>}
            {!bundles && !error && [0, 1, 2].map((k) => <Skeleton key={k} className="h-[30rem] !rounded-3xl" />)}
            {(bundles || []).map((b, i) => {
              const Icon = getIcon(b.icon);
              const { full, price } = b;
              const shown = yearly ? Math.round(price * 0.8) : price;
              return (
                <Reveal key={b.id} delay={i * 0.08}>
                  <div className="card card-hover group relative flex h-full flex-col overflow-hidden p-6">
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl transition group-hover:opacity-70" style={{ background: b.colors[0] }} />
                    <div className="relative flex items-start justify-between">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg" style={{ backgroundImage: `linear-gradient(135deg, ${b.colors[0]}, ${b.colors[1]})` }}><Icon className="h-7 w-7" /></span>
                      <motion.span initial={{ rotate: -10, scale: 0.8 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 12 }} className="chip bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/30">
                        <BadgePercent className="h-4 w-4" /> Save {b.savings}%
                      </motion.span>
                    </div>
                    <h3 className="relative mt-5 text-2xl font-bold">{b.name}</h3>
                    <p className="relative mt-1 text-sm text-muted">{b.blurb}</p>
                    <div className="relative mt-5 space-y-2">
                      {b.apps.map((a) => {
                        return (
                          <Link key={a.id} to={`/app/${a.id}`} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-line/5">
                            <AppIcon icon={a.icon} colors={a.colors} size="sm" />
                            <span className="flex-1 text-sm font-semibold">{a.name}</span>
                            <span className="text-xs text-muted line-through">${a.price}</span>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="relative mt-auto pt-6">
                      <div className="flex items-end gap-2">
                        <span className="font-display text-4xl font-extrabold">${shown}</span>
                        <span className="mb-1.5 text-sm text-muted">/mo</span>
                        <span className="mb-1.5 ml-auto text-sm text-muted line-through">${full}/mo</span>
                      </div>
                      <button onClick={() => addToCart(null, { bundle: b.id, plan: yearly ? 'yearly' : 'monthly', open: true })} className="btn-primary mt-4 w-full">
                        <Sparkles className="h-4 w-4" /> Get the {b.name}
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-24 max-w-3xl">
          <h2 className="mb-6 text-center text-3xl font-bold">Questions? <span className="text-gradient">Answers.</span></h2>
          <div className="space-y-3">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="card overflow-hidden">
                <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold" aria-expanded={open === i}>
                  <span className="flex items-center gap-3"><HelpCircle className="h-5 w-5 shrink-0 text-violet-400" />{q}</span>
                  <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-2xl leading-none text-muted">+</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <p className="px-5 pb-5 pl-[3.25rem] text-sm text-muted">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
