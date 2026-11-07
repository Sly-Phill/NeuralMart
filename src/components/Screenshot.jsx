// Stylised, generated "screenshot" mockups so the gallery looks real without image assets.
import { AppIcon } from './ui';

const bars = [62, 80, 45, 92, 70, 55, 85];

export default function Screenshot({ app, variant = 0 }) {
  const [c1, c2] = app.colors;
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/10 bg-surface">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-line/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 h-4 w-40 rounded-full bg-line/10" />
      </div>
      <div className="absolute inset-x-0 bottom-0 top-9 flex">
        <div className="hidden w-1/5 flex-col gap-2 border-r border-line/10 p-3 sm:flex">
          <AppIcon icon={app.icon} colors={app.colors} size="sm" />
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-2.5 rounded-full" style={{ width: `${70 - i * 8}%`, background: i === variant % 5 ? c1 : 'rgb(var(--line) / .1)' }} />
          ))}
        </div>
        <div className="relative flex-1 p-4">
          {variant % 3 === 0 && (
            <div className="flex h-full flex-col gap-3">
              <div className="h-3 w-1/2 rounded-full bg-line/15" />
              <div className="h-2 w-3/4 rounded-full bg-line/10" />
              <div className="mt-2 grid flex-1 grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl" style={{ background: `linear-gradient(${120 + i * 40}deg, ${c1}, ${c2})`, opacity: 0.85 - i * 0.15 }} />
                ))}
              </div>
              <div className="flex gap-2">
                <span className="h-7 w-24 rounded-lg" style={{ background: c1 }} />
                <span className="h-7 w-20 rounded-lg bg-line/10" />
              </div>
            </div>
          )}
          {variant % 3 === 1 && (
            <div className="flex h-full flex-col gap-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`flex ${i % 2 ? 'justify-end' : ''}`}>
                  <div className="max-w-[70%] rounded-2xl px-3 py-2.5" style={{ background: i % 2 ? `linear-gradient(135deg, ${c1}, ${c2})` : 'rgb(var(--line) / .08)' }}>
                    <span className="block h-2 w-40 max-w-full rounded-full bg-white/50" />
                    <span className="mt-1.5 block h-2 w-24 rounded-full bg-white/30" />
                  </div>
                </div>
              ))}
              <div className="mt-auto flex items-center gap-2 rounded-xl border border-line/10 p-2">
                <span className="h-2 flex-1 rounded-full bg-line/10" />
                <span className="h-6 w-6 rounded-lg" style={{ background: c1 }} />
              </div>
            </div>
          )}
          {variant % 3 === 2 && (
            <div className="flex h-full flex-col">
              <div className="grid grid-cols-3 gap-2">
                {['Usage', 'Saved', 'Score'].map((t, i) => (
                  <div key={t} className="rounded-xl border border-line/10 p-2">
                    <span className="block text-[9px] text-muted">{t}</span>
                    <span className="font-display text-sm font-bold" style={{ color: i === 1 ? c2 : c1 }}>{[128, '42h', '96%'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-1 items-end gap-2">
                {bars.map((b, i) => (
                  <div key={i} className="flex-1 rounded-t-md" style={{ height: `${b}%`, background: `linear-gradient(to top, ${c1}, ${c2})`, opacity: 0.5 + i * 0.07 }} />
                ))}
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl" style={{ background: c2, opacity: 0.35 }} />
        </div>
      </div>
    </div>
  );
}
