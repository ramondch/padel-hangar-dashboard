/**
 * SELECTORES — Padel Hangar
 *
 * TODAS las métricas del dashboard se calculan aquí a partir del Dataset crudo.
 * La UI NUNCA calcula nada: solo consume los tipos exportados por este fichero.
 *
 * Regla: cambiar a datos reales = solo cambiar el provider. Los selectores
 * y la UI quedan intactos.
 */

import type { Dataset, Reserva } from './schema';

// ── Tipos de salida ───────────────────────────────────────────────────────────

export type Period = 'mes' | 'trimestre' | 'ano';

export interface KpiData {
  ingresos: number;
  ingresosVsPrev: number;          // variación %
  ocupacion: number;               // %
  ocupacionVsPrev: number;         // pp
  ingresoPorHora: number;          // € por hora-pista disponible
  ingresoPorHoraVsPrev: number;    // %
  renovacionBonos: number;         // %
  renovacionBonosVsPrev: number;   // pp
  cobrosPendientes: number;        // €
  cobrosPendientesVsPrev: number;  // %
  tasaNoShow: number;              // %
  tasaNoShowVsPrev: number;        // pp
  nuevosSocios: number;
  nuevosSociosVsPrev: number;      // %
  bonosActivos: number;
  bonosActivosVsPrev: number;      // %
  periodoLabel: string;
}

export interface RevPoint {
  mes: string;   // "Ene", "Feb", …
  ingresos: number;
  costes: number;
  margen: number;
}

export interface CourtOcc {
  nombre: string;
  tipo: 'indoor' | 'outdoor';
  occ: number; // %
}

/** [slot 0-6][dia 0-6] = % ocupación */
export type HeatData = number[][];

export interface ProfPerf {
  nombre: string;
  ingresos: number;
  occ: number; // %
}

export interface TramoPerf {
  nombre: string;
  ingresos: number;
  pct: number;
  color: string;
}

export interface CanalPct {
  nombre: string;
  pct: number;
  color: string;
}

export interface PagoPct {
  nombre: string;
  pct: number;
  color: string;
}

export interface ComboPoint {
  mes: string;
  ingPorHora: number;
  occ: number;
}

export interface DashboardData {
  kpis: KpiData;
  revenue: RevPoint[];      // siempre 12 meses
  courts: CourtOcc[];
  heat: HeatData;
  profesores: ProfPerf[];
  tramos: TramoPerf[];
  canales: CanalPct[];
  pagos: PagoPct[];
  combo: ComboPoint[];      // siempre 12 meses
}

// ── Constantes internas ───────────────────────────────────────────────────────

const SLOTS_HORA = [9, 11, 13, 16, 18, 20, 22];
const N_SLOTS = SLOTS_HORA.length;
const SLOT_DUR_H = 1.5; // duración slot en horas

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const MES_LABELS: Record<Period, string> = {
  mes:       'Junio 2026',
  trimestre: 'Q2 2026 (abr–jun)',
  ano:       'Año 2026 (jul 25–jun 26)',
};

// ── Rangos de fechas ──────────────────────────────────────────────────────────

type DateRange = { desde: Date; hasta: Date };

function periodRanges(period: Period): { cur: DateRange; prev: DateRange } {
  if (period === 'mes') {
    return {
      cur:  { desde: new Date('2026-06-01'), hasta: new Date('2026-06-30') },
      prev: { desde: new Date('2026-05-01'), hasta: new Date('2026-05-31') },
    };
  }
  if (period === 'trimestre') {
    return {
      cur:  { desde: new Date('2026-04-01'), hasta: new Date('2026-06-30') },
      prev: { desde: new Date('2026-01-01'), hasta: new Date('2026-03-31') },
    };
  }
  // año: rolling 12 meses (jul 2025 – jun 2026 vs ene–jun 2025)
  return {
    cur:  { desde: new Date('2025-07-01'), hasta: new Date('2026-06-30') },
    prev: { desde: new Date('2025-01-01'), hasta: new Date('2025-06-30') },
  };
}

function inRange(r: DateRange, fecha: string): boolean {
  const d = new Date(fecha);
  return d >= r.desde && d <= r.hasta;
}

// ── Helpers de cálculo ────────────────────────────────────────────────────────

function numDaysInRange(r: DateRange): number {
  return Math.round((r.hasta.getTime() - r.desde.getTime()) / 86400000) + 1;
}

function sumImporte(rs: Reserva[]): number {
  return rs.reduce((s, r) => s + r.importe, 0);
}

function pctChange(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10; // 1 decimal
}

function ppChange(cur: number, prev: number): number {
  return Math.round((cur - prev) * 10) / 10;
}

// ── Selectores públicos ───────────────────────────────────────────────────────

function calcOcupacion(reservas: Reserva[], numDias: number, numPistas: number): number {
  const posibles = numDias * numPistas * N_SLOTS;
  if (posibles === 0) return 0;
  return Math.round((reservas.length / posibles) * 1000) / 10;
}

function calcIngPorHora(ingresos: number, numDias: number, numPistas: number): number {
  const horasPosibles = numDias * numPistas * N_SLOTS * SLOT_DUR_H;
  if (horasPosibles === 0) return 0;
  return Math.round((ingresos / horasPosibles) * 10) / 10;
}

/** KPI principal del dashboard */
function calcKpis(ds: Dataset, period: Period): KpiData {
  const { cur, prev } = periodRanges(period);
  const { reservas, socios, bonos, pistas } = ds;

  const rCur  = reservas.filter(r => inRange(cur, r.fecha));
  const rPrev = reservas.filter(r => inRange(prev, r.fecha));

  const dCur  = numDaysInRange(cur);
  const dPrev = numDaysInRange(prev);
  const nP    = pistas.length;

  // Ingresos
  const ingCur  = Math.round(sumImporte(rCur));
  const ingPrev = Math.round(sumImporte(rPrev));

  // Ocupación
  const occCur  = calcOcupacion(rCur,  dCur,  nP);
  const occPrev = calcOcupacion(rPrev, dPrev, nP);

  // Ingreso por hora-pista
  const iphCur  = calcIngPorHora(ingCur,  dCur,  nP);
  const iphPrev = calcIngPorHora(ingPrev, dPrev, nP);

  // Bonos: renovación de bonos vencidos en el periodo actual
  const bonosCur = bonos.filter(b => inRange(cur, b.vence));
  const renovados = bonosCur.filter(b => b.renovado).length;
  const renPct    = bonosCur.length ? Math.round((renovados / bonosCur.length) * 100) : 0;

  const bonosPrev = bonos.filter(b => inRange(prev, b.vence));
  const renPctPrev = bonosPrev.length
    ? Math.round((bonosPrev.filter(b => b.renovado).length / bonosPrev.length) * 100)
    : 0;

  // Cobros pendientes
  const pendCur  = Math.round(rCur.filter(r => r.estadoPago === 'pendiente').reduce((s, r) => s + r.importe, 0));
  const pendPrev = Math.round(rPrev.filter(r => r.estadoPago === 'pendiente').reduce((s, r) => s + r.importe, 0));

  // No-show
  const nsRateCur  = rCur.length  ? Math.round((rCur.filter(r => r.noShow).length  / rCur.length)  * 1000) / 10 : 0;
  const nsRatePrev = rPrev.length ? Math.round((rPrev.filter(r => r.noShow).length / rPrev.length) * 1000) / 10 : 0;

  // Nuevos socios
  const socCur  = socios.filter(s => inRange(cur,  s.altaFecha)).length;
  const socPrev = socios.filter(s => inRange(prev, s.altaFecha)).length;

  // Bonos activos al final del periodo
  const bonosActivosCur  = bonos.filter(b => b.estadoPago === 'pagado' && new Date(b.vence) >= cur.hasta).length;
  const bonosActivosPrev = bonos.filter(b => b.estadoPago === 'pagado' && new Date(b.vence) >= prev.hasta).length;

  return {
    ingresos: ingCur,
    ingresosVsPrev: pctChange(ingCur, ingPrev),
    ocupacion: occCur,
    ocupacionVsPrev: ppChange(occCur, occPrev),
    ingresoPorHora: iphCur,
    ingresoPorHoraVsPrev: pctChange(iphCur, iphPrev),
    renovacionBonos: renPct,
    renovacionBonosVsPrev: ppChange(renPct, renPctPrev),
    cobrosPendientes: pendCur,
    cobrosPendientesVsPrev: pctChange(pendCur, pendPrev),
    tasaNoShow: nsRateCur,
    tasaNoShowVsPrev: ppChange(nsRateCur, nsRatePrev),
    nuevosSocios: socCur,
    nuevosSociosVsPrev: pctChange(socCur, socPrev),
    bonosActivos: bonosActivosCur,
    bonosActivosVsPrev: pctChange(bonosActivosCur, bonosActivosPrev),
    periodoLabel: MES_LABELS[period],
  };
}

/** Serie de 12 meses para el gráfico de ingresos vs costes */
function calcRevenue(ds: Dataset): RevPoint[] {
  // Últimos 12 meses: jul 2025 – jun 2026
  const points: RevPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date('2026-06-01');
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth(); // 0-based
    const mesStr = `${y}-${String(m + 1).padStart(2, '0')}`;

    const ing = Math.round(
      ds.reservas.filter(r => r.fecha.startsWith(mesStr)).reduce((s, r) => s + r.importe, 0)
    );
    const cost = Math.round(
      ds.costes.filter(c => c.mes === mesStr).reduce((s, c) => s + c.importe, 0)
    );

    points.push({ mes: MESES_CORTOS[m], ingresos: ing, costes: cost, margen: ing - cost });
  }
  return points;
}

/** % Ocupación por pista en el periodo seleccionado */
function calcCourts(ds: Dataset, period: Period): CourtOcc[] {
  const { cur } = periodRanges(period);
  const dCur = numDaysInRange(cur);
  const rCur = ds.reservas.filter(r => inRange(cur, r.fecha));

  return ds.pistas.map(p => {
    const cnt = rCur.filter(r => r.pistaId === p.id).length;
    const posible = dCur * N_SLOTS;
    return { nombre: p.nombre, tipo: p.tipo, occ: Math.round((cnt / posible) * 100) };
  });
}

/** Heatmap [slot 0-6][dia 0-6] = % de ocupación */
function calcHeat(ds: Dataset, period: Period): HeatData {
  const { cur } = periodRanges(period);
  const rCur = ds.reservas.filter(r => inRange(cur, r.fecha));
  const nP = ds.pistas.length;
  const dCur = numDaysInRange(cur);
  const weeksApprox = dCur / 7;

  return SLOTS_HORA.map(hora => {
    return [0,1,2,3,4,5,6].map(dia => {
      const cnt = rCur.filter(r => {
        const d = new Date(r.fecha);
        const dow = (d.getDay() + 6) % 7; // 0=lun
        return r.horaInicio === hora && dow === dia;
      }).length;
      const posible = Math.round(weeksApprox) * nP;
      return posible > 0 ? Math.min(99, Math.round((cnt / posible) * 100)) : 0;
    });
  });
}

/** Rendimiento por profesor en el periodo */
function calcProfesores(ds: Dataset, period: Period): ProfPerf[] {
  const { cur } = periodRanges(period);
  const rCur = ds.reservas.filter(r => inRange(cur, r.fecha));
  const dCur = numDaysInRange(cur);
  // Asumimos 5 días laborables/semana y 4 clases/día por profesor
  const slotsProf = Math.round(dCur * (5 / 7) * 4);

  return ds.profesores.map(p => {
    const rs = rCur.filter(r => r.profesorId === p.id);
    return {
      nombre: p.nombre,
      ingresos: Math.round(rs.reduce((s, r) => s + r.importe, 0)),
      occ: slotsProf > 0 ? Math.min(99, Math.round((rs.length / slotsProf) * 100)) : 0,
    };
  }).sort((a, b) => b.ingresos - a.ingresos);
}

/** Ingresos y % por tramo horario */
function calcTramos(ds: Dataset, period: Period): TramoPerf[] {
  const { cur } = periodRanges(period);
  const rCur = ds.reservas.filter(r => inRange(cur, r.fecha));
  const total = sumImporte(rCur) || 1;

  const tramoDef: { key: Reserva['tramo']; nombre: string; color: string }[] = [
    { key: 'valle',  nombre: 'Valle (09–16h)',         color: 'var(--blue)' },
    { key: 'llano',  nombre: 'Llano (16–18 / 22h)',    color: 'var(--teal)' },
    { key: 'punta',  nombre: 'Punta (18–22h)',          color: 'var(--yellow)' },
  ];

  return tramoDef.map(t => {
    const ing = Math.round(rCur.filter(r => r.tramo === t.key).reduce((s, r) => s + r.importe, 0));
    return { nombre: t.nombre, ingresos: ing, pct: Math.round((ing / total) * 100), color: t.color };
  });
}

/** Distribución por canal de reserva */
function calcCanales(ds: Dataset, period: Period): CanalPct[] {
  const { cur } = periodRanges(period);
  const rCur = ds.reservas.filter(r => inRange(cur, r.fecha));
  const total = rCur.length || 1;

  const canalDef: { key: Reserva['canal']; nombre: string; color: string }[] = [
    { key: 'telegram',   nombre: 'Bot Telegram',   color: '#FFD400' },
    { key: 'playtomic',  nombre: 'Playtomic',       color: '#38bdf8' },
    { key: 'recepcion',  nombre: 'Recepción',       color: '#a78bfa' },
    { key: 'web',        nombre: 'Web / otros',     color: '#2dd4bf' },
  ];

  return canalDef.map(c => ({
    nombre: c.nombre,
    pct: Math.round((rCur.filter(r => r.canal === c.key).length / total) * 100),
    color: c.color,
  }));
}

/** Estado de socios (% cartera) */
function calcPagos(ds: Dataset): PagoPct[] {
  const total = ds.socios.filter(s => s.estado !== 'baja').length || 1;
  return [
    { nombre: 'Al día',               pct: 0, color: '#34d399' },
    { nombre: 'Pendiente',            pct: 0, color: '#fb923c' },
    { nombre: 'Lista de espera',      pct: 0, color: '#38bdf8' },
    { nombre: 'Moroso / liberado',    pct: 0, color: '#fb7185' },
  ].map((row, i) => {
    const estado = (['al_dia','pendiente','lista_espera','baja'] as const)[i];
    return { ...row, pct: Math.round((ds.socios.filter(s => s.estado === estado).length / total) * 100) };
  });
}

/** Serie combinada ingreso/hora + ocupación para los últimos 12 meses */
function calcCombo(ds: Dataset): ComboPoint[] {
  const nP = ds.pistas.length;
  const points: ComboPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date('2026-06-01');
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const mesStr = `${y}-${String(m + 1).padStart(2, '0')}`;

    const rMes  = ds.reservas.filter(r => r.fecha.startsWith(mesStr));
    const nDias = new Date(y, m + 1, 0).getDate();
    const ing   = rMes.reduce((s, r) => s + r.importe, 0);

    points.push({
      mes:       MESES_CORTOS[m],
      ingPorHora: calcIngPorHora(ing, nDias, nP),
      occ:       calcOcupacion(rMes, nDias, nP),
    });
  }

  return points;
}

// ── Selector principal ────────────────────────────────────────────────────────

/** Calcula todos los datos del dashboard para el periodo indicado. */
export function computeDashboard(ds: Dataset, period: Period): DashboardData {
  return {
    kpis:       calcKpis(ds, period),
    revenue:    calcRevenue(ds),
    courts:     calcCourts(ds, period),
    heat:       calcHeat(ds, period),
    profesores: calcProfesores(ds, period),
    tramos:     calcTramos(ds, period),
    canales:    calcCanales(ds, period),
    pagos:      calcPagos(ds),
    combo:      calcCombo(ds),
  };
}
