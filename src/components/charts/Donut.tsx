interface Slice { nombre: string; pct: number; color: string }
interface Props { data: Slice[] }

export default function Donut({ data }: Props) {
  const r = 40, c = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  let offset = 0;

  const segments = data.map(d => {
    const len = (d.pct / total) * c;
    const seg = (
      <circle
        key={d.nombre}
        cx="60" cy="60" r={r}
        fill="none"
        stroke={d.color}
        strokeWidth="16"
        strokeDasharray={`${len} ${c - len}`}
        strokeDashoffset={-offset}
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
        {data.map(d => (
          <div key={d.nombre} className="dl">
            <span className="nm">
              <i style={{ background: d.color }} />
              {d.nombre}
            </span>
            <span className="vv">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
