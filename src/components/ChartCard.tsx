import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  wide?: boolean;
  interactive?: boolean;
  legend?: { color: string; label: string }[];
  note?: string;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, wide, interactive, legend, note, children }: Props) {
  return (
    <div className={`card${wide ? ' wide' : ''}${interactive ? ' interactive' : ''}`}>
      <div className="ch">
        <div className="ct">{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {interactive && (
            <span className="interactive-badge" aria-label="Gráfico filtrable">
              ◆ clic para filtrar
            </span>
          )}
          {subtitle && <div className="cs">{subtitle}</div>}
        </div>
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
