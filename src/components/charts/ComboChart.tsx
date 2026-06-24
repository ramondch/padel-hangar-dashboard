import type { ComboPoint } from '../../data/selectors';

interface Props { data: ComboPoint[] }

export default function ComboChart({ data }: Props) {
  const W = 820, H = 210, pl = 36, pr = 36, pt = 10, pb = 24;
  const iw = W - pl - pr, ih = H - pt - pb;

  const maxR  = Math.max(...data.map(d => d.ingPorHora), 1);
  const yOc   = (v: number) => pt + ih - (v / 100) * ih;
  const yR    = (v: number) => pt + ih - (v / maxR) * ih;
  const n     = data.length;
  const slot  = iw / (n - 1);

  const gridLines: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const yy = pt + ih - (i / 4) * ih;
    gridLines.push(`<line x1="${pl}" y1="${yy}" x2="${W - pr}" y2="${yy}" stroke="#2b2c32"/>`);
  }

  const areaPts: [number, number][] = [];
  const linePts: [number, number][] = [];
  const labels: string[] = [];

  data.forEach((d, i) => {
    const x = pl + slot * i;
    areaPts.push([x, yOc(d.occ)]);
    linePts.push([x, yR(d.ingPorHora)]);
    labels.push(`<text x="${x}" y="${H - 7}" fill="#8b8c93" font-size="10" text-anchor="middle">${d.mes}</text>`);
  });

  const aFill = [
    `M${pl} ${pt + ih}`,
    ...areaPts.map(p => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`),
    `L${pl + slot * (n - 1)} ${pt + ih}`,
    'Z',
  ].join(' ');

  const aLine = areaPts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const lPath = linePts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const dots  = linePts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="#FFD400"/>`).join('');

  const svg = `
    <svg viewBox="0 0 ${W} ${H}" width="100%">
      <defs>
        <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#2dd4bf" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridLines.join('')}
      ${labels.join('')}
      <path d="${aFill}" fill="url(#ga)"/>
      <path d="${aLine}" fill="none" stroke="#2dd4bf" stroke-width="2"/>
      <path d="${lPath}" fill="none" stroke="#FFD400" stroke-width="2.5"/>
      ${dots}
    </svg>`;

  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}
