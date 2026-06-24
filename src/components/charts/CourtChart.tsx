import type { CourtOcc } from '../../data/selectors';

interface Props {
  data: CourtOcc[];
  selected?: string | null;
  onSelect?: (name: string | null) => void;
}

export default function CourtChart({ data, selected, onSelect }: Props) {
  const W = 820, H = 250, pl = 28, pr = 8, pt = 8, pb = 70;
  const iw = W - pl - pr, ih = H - pt - pb;
  const yv = (v: number) => pt + ih - (v / 100) * ih;
  const n = data.length, slot = iw / n;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-label="Rendimiento de pistas">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map(i => {
        const yy = pt + ih - (i / 4) * ih;
        return (
          <g key={i}>
            <line x1={pl} y1={yy} x2={W - pr} y2={yy} stroke="#173869" />
            <text x={pl - 6} y={yy + 3} fill="#5C7FA3" fontSize={10} textAnchor="end">{i * 25}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((c, i) => {
        const cx = pl + slot * i + slot / 2;
        const bw = Math.min(26, slot * 0.6);
        const isSelected = selected === c.nombre;
        const isDimmed = selected !== null && selected !== undefined && !isSelected;
        const fill = c.tipo === 'indoor' ? '#FFD400' : '#38bdf8';

        return (
          <g
            key={c.nombre}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-pressed={isSelected}
            aria-label={`${c.nombre} ${c.occ}%`}
            onClick={() => onSelect?.(isSelected ? null : c.nombre)}
          >
            {/* Hit area */}
            <rect
              x={cx - slot / 2} y={pt}
              width={slot} height={ih + pb}
              fill="transparent"
            />
            {/* Bar */}
            <rect
              x={cx - bw / 2} y={yv(c.occ)}
              width={bw} height={pt + ih - yv(c.occ)}
              rx={3} fill={fill}
              opacity={isDimmed ? 0.25 : 1}
              style={{ transition: 'opacity .2s' }}
            />
            {/* Selection ring */}
            {isSelected && (
              <rect
                x={cx - bw / 2 - 3} y={yv(c.occ) - 3}
                width={bw + 6} height={pt + ih - yv(c.occ) + 6}
                rx={5} fill="none"
                stroke={fill} strokeWidth={2} opacity={0.6}
              />
            )}
            {/* Value label on selected */}
            {isSelected && (
              <text
                x={cx} y={yv(c.occ) - 7}
                fill={fill} fontSize={11} textAnchor="middle" fontWeight="700"
              >
                {c.occ}%
              </text>
            )}
            {/* Court name */}
            <text
              x={cx} y={pt + ih + 14}
              fill={isSelected ? '#EBF2FF' : '#5C7FA3'}
              fontSize={9.5} textAnchor="end"
              transform={`rotate(-38 ${cx} ${pt + ih + 14})`}
              fontWeight={isSelected ? '700' : 'normal'}
              style={{ transition: 'fill .2s' }}
            >
              {c.nombre}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
