export const money = (n) =>
  n === 0 ? 'Free' : `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export const compact = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

export const timeAgo = (iso) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, sec] of units) if (s >= sec) { const n = Math.floor(s / sec); return `${n} ${u}${n > 1 ? 's' : ''} ago`; }
  return 'just now';
};

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
