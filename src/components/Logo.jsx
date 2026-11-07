import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#nm-g)" />
      <g stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round">
        <line x1="32" y1="32" x2="16" y2="18" /><line x1="32" y1="32" x2="48" y2="18" />
        <line x1="32" y1="32" x2="18" y2="47" /><line x1="32" y1="32" x2="46" y2="47" />
      </g>
      <g fill="#fff" fillOpacity=".85">
        <circle cx="16" cy="18" r="4" /><circle cx="48" cy="18" r="4" />
        <circle cx="18" cy="47" r="4" /><circle cx="46" cy="47" r="4" />
      </g>
      <path d="M32 20 L35.2 28.8 L44 32 L35.2 35.2 L32 44 L28.8 35.2 L20 32 L28.8 28.8 Z" fill="#fff" />
    </svg>
  );
}

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`group flex items-center gap-2.5 ${className}`} aria-label="NeuralMart home">
      <span className="relative">
        <span className="absolute inset-0 rounded-2xl bg-violet-500/60 blur-lg transition group-hover:bg-electric-500/70" />
        <LogoMark className="relative h-9 w-9 transition-transform duration-500 group-hover:rotate-[20deg]" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        <span className="text-gradient">Neural</span>
        <span className="text-ink">Mart</span>
      </span>
    </Link>
  );
}
