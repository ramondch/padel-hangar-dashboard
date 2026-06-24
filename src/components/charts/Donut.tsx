interface Slice { nombre: string; pct: number; color: string }
interface Props {
  data: Slice[];
  selected?: string | null;
  onSelect?: (name: string | null) => void;
}

export default function Donut({ data, selected, onSelect }: Props) {
  const r = 40, c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  let offset = 0;

  const segments = data.map(d => {
    const len = (d.pct / total) * c;
    const isSelected = selected === d.nombre;
    const isDimmed = selected !== null && selected !== undefined && !isSelected;
    const seg = (
      <circle
        key={d.nombre}
        cx="60" cy="60" r={r}
        fill="none"
        stroke={d.color}
        strokeWidth={isSelected ? 22 : 16}
        strokeDasharray={`${len} ${c - len}`}
        strokeDashoffset={-offset}
        opacity={isDimmed ? 0.2 : 1}
        style={{ cursor: 'pointer', transition: 'opacity .2s, stroke-width .2s' }}
        role="button"
        aria-label={`${d.nombre} ${d.pct}%`}
        onClick={() => onSelect?.(isSelected ? null : d.nombre)}
      />
    );
    offset += len;
    return seg;
  });

  return (
    <div className="split">
      <svg
        viewBox="0 0 120 120"
        width={150}
        height={150}
        style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
        aria-hidden="true"
      >
        {segments}
      </svg>
      <div className="donutlab">
        {data.map(d => {
          const isSelected = selected === d.nombre;
          const isDimmed = selected !== null && selected !== undefined && !isSelected;
          return (
            <div
              key={d.nombre}
              className="dl"
              style={{ opacity: isDimmed ? 0.3 : 1 }}
              onClick={() => onSelect?.(isSelected ? null : d.nombre)}
              role="button"
              aria-pressed={isSelected}
            >
              <span className="nm">
                <i style={{ background: d.color }} />
                <span style={{ fontWeight: isSelected ? 700 : undefined, color: isSelected ? 'var(--off)' : undefined }}>
                  {d.nombre}
                </span>
              </span>
              <span className="vv" style={{ color: isSelected ? d.color : undefined }}>{d.pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
