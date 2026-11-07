import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Rocket, LibraryBig, Check, Mail } from 'lucide-react';
import { Page, AppIcon } from '../components/ui';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function Success() {
  const { state } = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (!state) return;
    const colors = ['#8b5cf6', '#3b82f6', '#a78bfa', '#38bdf8', '#ec4899'];
    const end = Date.now() + 1800;
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 }, colors });
    let raf;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [state]);

  if (!state?.order) return <Navigate to="/library" replace />;
  const { order, email } = state;
  const apps = order.apps;

  return (
    <Page>
      <div className="section max-w-3xl text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }} className="relative mx-auto mb-8 h-24 w-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/30" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-brand shadow-glow-lg">
            <Check className="h-12 w-12 text-white" strokeWidth={3} />
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-4xl font-extrabold sm:text-6xl">
          Your apps are <span className="text-gradient">ready.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mx-auto mt-4 max-w-md text-muted">
          Order <span className="font-mono font-semibold text-ink">{order.id}</span> is confirmed · ${order.total.toFixed(2)} paid{order.promoCode ? ` with ${order.promoCode}` : ''}. A receipt is on its way{email ? <> to <span className="text-ink">{email}</span></> : ''}.
        </motion.p>

        {apps.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-left">
            {apps.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="card flex w-full items-center gap-4 p-4 sm:w-[calc(50%-0.375rem)]">
                <AppIcon icon={a.icon} colors={a.colors} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400">Activated · ready to launch</p>
                </div>
                <button onClick={() => api('/library', { method: 'POST', body: { slug: a.id } }).then(() => toast(`Launching ${a.name}…`, { type: 'info', description: 'Opening in a new workspace.' })).catch((e) => toast(e.message, { type: 'error' }))} className="btn-primary !px-3 !py-2"><Rocket className="h-4 w-4" /></button>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/library" className="btn-primary"><LibraryBig className="h-4 w-4" /> Go to My Library</Link>
          <Link to="/explore" className="btn-ghost">Keep exploring</Link>
        </motion.div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted"><Mail className="h-3.5 w-3.5" /> Need help? support@neuralmart.ai</p>
      </div>
    </Page>
  );
}
