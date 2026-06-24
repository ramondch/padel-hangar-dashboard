import type { RevPoint } from '../../data/selectors';

interface Props { data: RevPoint[] }

export default function RevenueChart({ data }: Props) {
  const W = 820, H = 270, pl = 42, pr = 12, pt = 12, pb = 26;
  const iw = W - pl - pr, ih = H - pt - pb;

  const max = Math.max(...data.map(d => Math.max(d.ingresos, d.costes)));
  const yv  = (v: number) => pt + ih - (v / max) * ih;
  const n   = data.length;
  const slot = iw / n;

  const gridLines: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const v  = max * i / 4;
    const yy = pt + ih - (i / 4) * ih;
    gridLines.push(
      `<line x1="${pl}" y1="${yy}" x2="${W - pr}" y2="${yy}" stroke="#2b2c32"/>`,
      `<text x="${pl - 6}" y="${yy + 3}" fill="#8b8c93" font-size="10" text-anchor="end">${Math.round(v / 1000)}k</text>`,
    );
  }

  const pts: [number, number][] = [];
  const bars: string[] = [];

  data.forEach((d, i) => {
    const cx = pl + slot * i + slot / 2;
    const bw = Math.min(13, slot * 0.3);
    bars.push(
      `<rect x="${cx - bw - 2}" y="${yv(d.ingresos)}" width="${bw}" height="${pt + ih - yv(d.ingresos)}" rx="3" fill="#FFD400"/>`,
      `<rect x="${cx + 2}" y="${yv(d.costes)}" width="${bw}" height="${pt + ih - yv(d.costes)}" rx="3" fill="#fb7185" opacity="0.85"/>`,
      `<text x="${cx}" y="${H - 8}" fill="#8b8c93" font-size="10" text-anchor="middle">${d.mes}</text>`,
    );
    pts.push([cx, yv(d.margen)]);
  });

  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const dots = pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="#34d399"/>`).join('');

  const svg = [
    `<svg viewBox="0 0 ${W} ${H}" width="100%">`,
    ...gridLines,
    ...bars,
    `<path d="${path}" fill="none" stroke="#34d399" stroke-width="2.5"/>`,
    dots,
    '</svg>',
  ].join('');

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
