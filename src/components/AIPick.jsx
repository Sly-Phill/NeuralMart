import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { AppIcon, Stars, Reveal, Skeleton } from './ui';
import { useAIPick } from '../hooks/useApi';
import { useStore } from '../context/StoreContext';

const hoursToMidnight = () => {
  const now = new Date();
  return 24 - now.getHours();
};

export default function AIPick() {
  const { app, loading } = useAIPick();
  const { addToCart } = useStore();
  if (!app) {
    if (!loading) return null;
    return <Skeleton className="h-40 w-full !rounded-[2rem]" />;
  }
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[2rem] p-[1.5px]">
        <div className="absolute inset-0 animate-gradient bg-[linear-gradient(110deg,#7c3aed,#3b82f6,#ec4899,#7c3aed)] bg-[length:300%_300%]" />
        <div className="relative flex flex-col gap-6 rounded-[calc(2rem-1.5px)] bg-bg/90 p-6 backdrop-blur-xl sm:p-8 md:flex-row md:items-center">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <AppIcon icon={app.icon} colors={app.colors} size="xl" className="animate-float" />
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="ai-badge"><Sparkles className="h-3 w-3" /> AI pick of the day</span>
                <span className="chip glass text-muted"><Clock className="h-3 w-3" /> Refreshes in {hoursToMidnight()}h</span>
              </div>
              <h3 className="text-2xl font-bold sm:text-3xl">{app.name}</h3>
              <p className="mt-1 max-w-lg text-muted">{app.tagline}</p>
              <Stars value={app.rating} showValue className="mt-2" />
            </div>
          </div>
          <div className="relative flex flex-wrap gap-3 md:ml-auto">
            <button onClick={() => addToCart(app.id)} className="btn-ghost">Start free trial</button>
            <Link to={`/app/${app.id}`} className="btn-primary">See why <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
