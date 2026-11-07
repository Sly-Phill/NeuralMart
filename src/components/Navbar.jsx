import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ShoppingCart, Sun, Moon, Heart, ArrowRight, Sparkles, LogOut, LogIn, LibraryBig } from 'lucide-react';
import Logo from './Logo';
import { AppIcon, Skeleton } from './ui';
import useApi, { useCategories, useAIPick } from '../hooks/useApi';
import { getIcon } from '../utils/icons';
import { initials } from '../utils/format';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function UserMenu() {
  const { user, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  if (!ready) return <Skeleton className="h-10 w-10 !rounded-full" />;
  if (!user) {
    return (
      <Link to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} className="btn-ghost !px-3.5 !py-2.5" aria-label="Log in">
        <LogIn className="h-4 w-4" /><span className="hidden sm:inline">Log in</span>
      </Link>
    );
  }
  const first = user.fullName.split(' ')[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full glass py-1 pl-1 pr-1 transition hover:border-violet-500/50 sm:pr-3" aria-expanded={open} aria-haspopup="menu">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand font-display text-xs font-bold text-white">{initials(user.fullName)}</span>
        <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:inline">{first}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute right-0 top-12 w-60 rounded-2xl border border-violet-500/20 bg-surface p-2 shadow-glow-lg" role="menu"
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{user.fullName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <Link to="/library" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-violet-500/10" role="menuitem"><LibraryBig className="h-4 w-4" /> My Library</Link>
            <Link to="/library#wishlist" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-violet-500/10" role="menuitem"><Heart className="h-4 w-4" /> Wishlist</Link>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10" role="menuitem"><LogOut className="h-4 w-4" /> Log out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LINKS = [
  { to: '/compare', label: 'Compare' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/library', label: 'My Library' },
  { to: '/sell', label: 'Sell' },
];

export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full glass transition hover:border-violet-500/50 ${className}`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ y: -20, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 20, opacity: 0, rotate: 90 }} transition={{ duration: 0.25 }}>
          {theme === 'dark' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px] text-amber-500" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function CartButton({ className = '' }) {
  const { totals, setCartOpen } = useStore();
  return (
    <button onClick={() => setCartOpen(true)} className={`relative grid h-10 w-10 place-items-center rounded-full glass transition hover:border-violet-500/50 ${className}`} aria-label={`Open cart (${totals.count} items)`}>
      <ShoppingCart className="h-[18px] w-[18px]" />
      <AnimatePresence>
        {totals.count > 0 && (
          <motion.span key={totals.count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-glow">
            {totals.count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const { wishlist } = useStore();
  const loc = useLocation();
  const { app: pick } = useAIPick();
  const { categories } = useCategories();
  const { data: trendingData } = useApi('/apps?sort=popular&limit=3');
  const { data: countData } = useApi('/stats');
  const trending = trendingData?.apps || [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMega(false), [loc.pathname, loc.search]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6">
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-300 ${scrolled || mega ? 'glass shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]' : 'border border-transparent'}`}
        onMouseLeave={() => setMega(false)}
      >
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          <button
            onMouseEnter={() => setMega(true)}
            onClick={() => setMega((m) => !m)}
            aria-expanded={mega}
            className={`flex items-center gap-1 rounded-xl px-3.5 py-2 text-sm font-medium transition hover:text-ink ${mega || loc.pathname.startsWith('/explore') ? 'text-ink' : 'text-muted'}`}
          >
            Explore <ChevronDown className={`h-4 w-4 transition ${mega ? 'rotate-180' : ''}`} />
          </button>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onMouseEnter={() => setMega(false)}
              className={({ isActive }) => `relative rounded-xl px-3.5 py-2 text-sm font-medium transition hover:text-ink ${isActive ? 'text-ink' : 'text-muted'}`}
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand" />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/library#wishlist" className="relative hidden h-10 w-10 place-items-center rounded-full glass transition hover:border-pink-400/50 sm:grid" aria-label="Wishlist">
            <Heart className="h-[18px] w-[18px]" />
            {wishlist.length > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-bg" />}
          </Link>
          <ThemeToggle />
          <CartButton />
          <UserMenu />
          <Link to="/explore" className="btn-primary hidden !py-2.5 xl:inline-flex">
            <Sparkles className="h-4 w-4" /> Explore AI
          </Link>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-3 top-[4.6rem] mx-auto hidden max-w-7xl md:block md:inset-x-6"
            >
              <div className="grid grid-cols-12 gap-6 rounded-3xl border border-violet-500/20 bg-surface p-6 shadow-glow-lg backdrop-blur-2xl">
                <div className="col-span-7">
                  <p className="eyebrow mb-4">Browse by category</p>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.length === 0 && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
                    {categories.map((c) => {
                      const Icon = getIcon(c.icon);
                      return (
                        <Link key={c.id} to={`/explore?category=${c.id}`} className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-violet-500/10">
                          <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundImage: `linear-gradient(135deg, ${c.hue[0]}, ${c.hue[1]})` }}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold group-hover:text-violet-400">{c.name}</span>
                            <span className="block text-xs text-muted">{c.blurb}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <div className="col-span-5 flex flex-col gap-4">
                  {pick ? (
                    <Link to={`/app/${pick.id}`} className="relative overflow-hidden rounded-2xl bg-brand p-5 text-white">
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
                      <span className="chip bg-white/20 text-white"><Sparkles className="h-3 w-3" /> AI pick of the day</span>
                      <p className="mt-3 font-display text-xl font-bold">{pick.name}</p>
                      <p className="text-sm text-white/80">{pick.tagline}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">Try it free <ArrowRight className="h-4 w-4" /></span>
                    </Link>
                  ) : <Skeleton className="h-36 !rounded-2xl" />}
                  <div>
                    <p className="eyebrow mb-2">Trending now</p>
                    {trending.map((a) => (
                      <Link key={a.id} to={`/app/${a.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-violet-500/10">
                        <AppIcon icon={a.icon} colors={a.colors} size="sm" />
                        <span className="flex-1 text-sm font-semibold">{a.name}</span>
                        <span className="text-xs text-muted">★ {a.rating}</span>
                      </Link>
                    ))}
                  </div>
                  <Link to="/explore" className="text-sm font-semibold text-violet-500 hover:underline dark:text-violet-400">View all {countData?.apps ?? ''} apps →</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
