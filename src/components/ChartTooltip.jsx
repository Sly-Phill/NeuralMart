export default function ChartTooltip({ active, payload, label, unit = '', prefix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-glow">
      <p className="text-muted">{label}</p>
      <p className="mt-0.5 font-display text-sm font-bold text-ink">{prefix}{Number(payload[0].value).toLocaleString()}{unit}</p>
    </div>
  );
}

export const axisProps = {
  tick: { fill: '#8f8aaf', fontSize: 11 },
  axisLine: false,
  tickLine: false,
};
