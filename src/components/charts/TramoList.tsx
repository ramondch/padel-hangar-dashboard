import type { TramoPerf } from '../../data/selectors';

interface Props { data: TramoPerf[] }

const fmt = (n: number) => n.toLocaleString('es-ES');

export default function TramoList({ data }: Props) {
  const max = Math.max(...data.map(t => t.ingresos), 1);

  return (
    <div className="blist">
      {data.map(t => (
        <div key={t.nombre} className="brow">
          <div className="bt">
            <span className="nm">{t.nombre}</span>
            <span className="vv">{fmt(t.ingresos)} € · {t.pct}%</span>
          </div>
          <div className="track">
            <div
              className="fill"
              style={{ width: `${(t.ingresos / max) * 100}%`, background: t.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
