import { Fragment } from 'react';
import type { HeatData } from '../../data/selectors';

interface Props { data: HeatData }

const DAYS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const SLOTS = ['09h','11h','13h','16h','18h','20h','22h'];

function heatColor(v: number): string {
  if (v >= 90) return '#FFD400';
  if (v >= 75) return '#e6c200';
  if (v >= 60) return '#a89a3f';
  if (v >= 45) return '#5d6a4e';
  return '#33373a';
}

export default function Heatmap({ data }: Props) {
  return (
    <>
      <div className="heat">
        {/* Header row */}
        <div />
        {DAYS.map(d => <div key={d} className="hd">{d}</div>)}

        {/* Data rows */}
        {SLOTS.map((slot, si) => (
          <Fragment key={si}>
            <div className="rl">{slot}</div>
            {DAYS.map((day, di) => {
              const v = data[si]?.[di] ?? 0;
              return (
                <div
                  key={`${si}-${di}`}
                  className="cell"
                  style={{ background: heatColor(v) }}
                  title={`${day} ${slot}: ${v}%`}
                  aria-label={`${day} ${slot} ${v}%`}
                >
                  {v >= 75 ? v : ''}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="legend" style={{ justifyContent: 'flex-end' }}>
        <span><i style={{ background: '#33373a' }} />bajo</span>
        <span><i style={{ background: '#5d6a4e' }} /></span>
        <span><i style={{ background: '#a89a3f' }} /></span>
        <span><i style={{ background: '#FFD400' }} />lleno</span>
      </div>
    </>
  );
}
