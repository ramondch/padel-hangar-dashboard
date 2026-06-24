interface Props {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  change: number;
  changeUnit: 'pct' | 'pp';
}

export default function KpiCard({ icon, label, value, unit, change, changeUnit }: Props) {
  const up   = change >= 0;
  const sign = up ? '+' : '';
  const suffix = changeUnit === 'pp' ? ' pp' : '%';

  return (
    <div className="kpi">
      <div className="lab">
        <span>{icon}</span>
        {label}
      </div>
      <div className="val">
        {value}
        {unit && <small> {unit}</small>}
      </div>
      <div className={`chg ${up ? 'up' : 'down'}`}>
        {up ? '▲' : '▼'} {sign}{change}{suffix} vs anterior
      </div>
    </div>
  );
}
