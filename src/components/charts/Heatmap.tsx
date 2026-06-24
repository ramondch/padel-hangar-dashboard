import { Fragment } from 'react';
import type { HeatData } from '../../data/selectors';

interface Props {
  data: HeatData;
  selectedSlot?: number | null;
  onSelectSlot?: (slot: number | null) => void;
  courtNote?: string | null;
}

const DAYS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const SLOTS = ['09h','11h','13h','16h','18h','20h','22h'];

function heatColor(v: number): string {
  if (v >= 90) return '#FFD400';
  if (v >= 75) return '#c9990a';
  if (v >= 60) return '#1566C4';
  if (v >= 45) return '#0D4F9E';
  return '#0D2D56';
}

function textColor(v: number): string {
  return v >= 75 ? '#040E1C' : 'transparent';
}

export default function Heatmap({ data, selectedSlot, onSelectSlot, courtNote }: Props) {
  return (
    <>
      {courtNote && (
        <div style={{
          fontSize: 11, color: 'var(--yellow)', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>◆</span> Mostrando ocupación global · pista seleccionada: <strong>{courtNote}</strong>
        </div>
      )}

      <div className="heat">
        {/* Header row */}
        <div />
        {DAYS.map(d => <div key={d} className="hd">{d}</div>)}

        {/* Data rows */}
        {SLOTS.map((slot, si) => {
          const isSelected = selectedSlot === si;
          const isDimmed = selectedSlot !== null && selectedSlot !== undefined && !isSelected;
          return (
            <Fragment key={si}>
              <div
                className={`rl${isSelected ? ' active' : ''}`}
                onClick={() => onSelectSlot?.(isSelected ? null : si)}
                title={`Filtrar por franja ${slot}`}
              >
                {slot}
              </div>
              {DAYS.map((day, di) => {
                const v = data[si]?.[di] ?? 0;
                return (
                  <div
                    key={`${si}-${di}`}
                    className={`cell${isDimmed ? ' dimmed' : ''}${isSelected ? ' highlighted' : ''}`}
                    style={{ background: heatColor(v), color: textColor(v) }}
                    title={`${day} ${slot}: ${v}%`}
                    aria-label={`${day} ${slot} ${v}%`}
                  >
                    {v >= 75 ? v : ''}
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>

      <div className="legend" style={{ justifyContent: 'flex-end' }}>
        <span><i style={{ background: '#0D2D56' }} />bajo</span>
        <span><i style={{ background: '#0D4F9E' }} /></span>
        <span><i style={{ background: '#1566C4' }} /></span>
        <span><i style={{ background: '#c9990a' }} /></span>
        <span><i style={{ background: '#FFD400' }} />lleno</span>
        {selectedSlot !== null && selectedSlot !== undefined && (
          <span
            style={{ marginLeft: 'auto', color: 'var(--yellow)', cursor: 'pointer', fontSize: 11 }}
            onClick={() => onSelectSlot?.(null)}
          >
            ✕ quitar filtro franja
          </span>
        )}
      </div>
    </>
  );
}
