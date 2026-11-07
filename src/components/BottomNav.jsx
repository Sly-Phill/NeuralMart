import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, GitCompare, LibraryBig, Store } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/explore', label: 'Explore', Icon: Compass },
  { to: '/compare', label: 'Compare', Icon: GitCompare },
  { to: '/library', label: 'Library', Icon: LibraryBig },
  { to: '/sell', label: 'Sell', Icon: Store },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Primary">
      <div className="glass flex items-center justify-around rounded-2xl px-2 py-1.5 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        {ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5">
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="bottom-pill" className="absolute inset-0 rounded-xl bg-violet-500/15" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <Icon className={`relative h-5 w-5 transition ${isActive ? 'text-violet-400' : 'text-muted'}`} />
                <span className={`relative text-[10px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
