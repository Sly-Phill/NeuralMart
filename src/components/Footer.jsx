import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Youtube } from 'lucide-react';
import Logo from './Logo';
import { useCategories } from '../hooks/useApi';

export default function Footer() {
  const { categories } = useCategories();
  return (
    <footer className="relative mt-10 border-t border-line/10 pb-28 pt-16 md:pb-10">
      <div className="section grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">NeuralMart is the marketplace to discover, compare, try and buy the AI apps, tools and agents that actually work for you.</p>
          <div className="mt-5 flex gap-2">
            {[Twitter, Github, Linkedin, Youtube].map((I, i) => (
              <a key={i} href="#" onClick={(e) => e.preventDefault()} className="grid h-9 w-9 place-items-center rounded-full glass text-muted transition hover:text-violet-400" aria-label="Social link"><I className="h-4 w-4" /></a>
            ))}
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="mb-3 text-sm font-semibold">Categories</p>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted">
            {categories.map((c) => <li key={c.id}><Link to={`/explore?category=${c.id}`} className="hover:text-ink">{c.name}</Link></li>)}
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="mb-3 text-sm font-semibold">Marketplace</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/explore" className="hover:text-ink">Browse apps</Link></li>
            <li><Link to="/compare" className="hover:text-ink">Compare</Link></li>
            <li><Link to="/pricing" className="hover:text-ink">Pricing & bundles</Link></li>
            <li><Link to="/library" className="hover:text-ink">My Library</Link></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="mb-3 text-sm font-semibold">For builders</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/sell" className="hover:text-ink">Sell your AI app</Link></li>
            <li><Link to="/sell#dashboard" className="hover:text-ink">Seller dashboard</Link></li>
            <li><span>API docs (soon)</span></li>
          </ul>
        </div>
      </div>
      <div className="section mt-12 flex flex-col items-center justify-between gap-3 border-t border-line/10 pt-6 text-xs text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} NeuralMart. All rights reserved.</p>
        <p>Made with <span className="text-gradient font-semibold">neurons</span> & coffee.</p>
      </div>
    </footer>
  );
}
