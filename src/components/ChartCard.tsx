import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  wide?: boolean;
  legend?: { color: string; label: string }[];
  note?: string;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, wide, legend, note, children }: Props) {
  return (
    <div className={`card${wide ? ' wide' : ''}`}>
      <div className="ch">
        <div className="ct">{title}</div>
        {subtitle && <div className="cs">{subtitle}</div>}
      </div>
      {legend && legend.length > 0 && (
        <div className="legend">
          {legend.map(l => (
            <span key={l.label}>
              <i style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      {children}
      {note && <div className="cs" style={{ marginTop: 8 }}>{note}</div>}
    </div>
  );
}
