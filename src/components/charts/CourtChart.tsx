import type { CourtOcc } from '../../data/selectors';

interface Props { data: CourtOcc[] }

export default function CourtChart({ data }: Props) {
  const W = 820, H = 250, pl = 28, pr = 8, pt = 8, pb = 70;
  const iw = W - pl - pr, ih = H - pt - pb;
  const yv = (v: number) => pt + ih - (v / 100) * ih;
  const n  = data.length, slot = iw / n;

  const lines: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const yy = pt + ih - (i / 4) * ih;
    lines.push(
      `<line x1="${pl}" y1="${yy}" x2="${W - pr}" y2="${yy}" stroke="#2b2c32"/>`,
      `<text x="${pl - 6}" y="${yy + 3}" fill="#8b8c93" font-size="10" text-anchor="end">${i * 25}</text>`,
    );
  }

  const bars: string[] = [];
  data.forEach((c, i) => {
    const cx = pl + slot * i + slot / 2;
    const bw = Math.min(26, slot * 0.6);
    const fill = c.tipo === 'indoor' ? '#FFD400' : '#38bdf8';
    bars.push(
      `<rect x="${cx - bw / 2}" y="${yv(c.occ)}" width="${bw}" height="${pt + ih - yv(c.occ)}" rx="3" fill="${fill}"/>`,
      `<text x="${cx}" y="${pt + ih + 14}" fill="#8b8c93" font-size="9.5" text-anchor="end" transform="rotate(-38 ${cx} ${pt + ih + 14})">${c.nombre}</text>`,
    );
  });

  const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%">${lines.join('')}${bars.join('')}</svg>`;

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
