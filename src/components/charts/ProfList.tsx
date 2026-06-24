import type { ProfPerf } from '../../data/selectors';

interface Props { data: ProfPerf[] }

const COLORS = ['var(--yellow)', 'var(--teal)', 'var(--blue)', 'var(--purple)', 'var(--orange)'];

const fmt = (n: number) => n.toLocaleString('es-ES');

export default function ProfList({ data }: Props) {
  const max = Math.max(...data.map(p => p.occ), 1);

  return (
    <div className="blist">
      {data.map((p, i) => (
        <div key={p.nombre} className="brow">
          <div className="bt">
            <span className="nm">{p.nombre}</span>
            <span className="vv">{fmt(p.ingresos)} € · {p.occ}% ocup.</span>
          </div>
          <div className="track">
            <div
              className="fill"
              style={{ width: `${(p.occ / max) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
