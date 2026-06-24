import { useState, useEffect, useMemo } from 'react';
import { dataProvider } from './data/index';
import { computeDashboard, type Period } from './data/selectors';
import type { Dataset } from './data/schema';

import KpiCard    from './components/KpiCard';
import ChartCard  from './components/ChartCard';
import RevenueChart from './components/charts/RevenueChart';
import CourtChart   from './components/charts/CourtChart';
import Heatmap      from './components/charts/Heatmap';
import ProfList     from './components/charts/ProfList';
import TramoList    from './components/charts/TramoList';
import Donut        from './components/charts/Donut';
import ComboChart   from './components/charts/ComboChart';

const fmt = (n: number) => Math.round(n).toLocaleString('es-ES');
const fmt1 = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const PERIODS: { key: Period; label: string }[] = [
  { key: 'mes',       label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'ano',       label: 'Año' },
];

export default function App() {
  const [dataset, setDataset]   = useState<Dataset | null>(null);
  const [period, setPeriod]     = useState<Period>('mes');

  useEffect(() => {
    dataProvider.getDataset().then(setDataset);
  }, []);

  const dash = useMemo(
    () => dataset ? computeDashboard(dataset, period) : null,
    [dataset, period],
  );

  if (!dash) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--mut)' }}>
        Cargando datos…
      </div>
    );
  }

  const { kpis, revenue, courts, heat, profesores, tramos, canales, pagos, combo } = dash;

  const kpiCards = [
    { icon: '💶', label: 'Ingresos',           value: fmt(kpis.ingresos),          unit: '€',  change: kpis.ingresosVsPrev,         changeUnit: 'pct' as const },
    { icon: '📊', label: 'Ocupación media',     value: String(kpis.ocupacion),      unit: '%',  change: kpis.ocupacionVsPrev,        changeUnit: 'pp'  as const },
    { icon: '🎾', label: 'Ingreso / hora-pista',value: fmt1(kpis.ingresoPorHora),   unit: '€',  change: kpis.ingresoPorHoraVsPrev,   changeUnit: 'pct' as const },
    { icon: '🔁', label: '% Renovación bonos',  value: String(kpis.renovacionBonos),unit: '%',  change: kpis.renovacionBonosVsPrev,  changeUnit: 'pp'  as const },
    { icon: '⚠️', label: 'Cobros pendientes',   value: fmt(kpis.cobrosPendientes),  unit: '€',  change: kpis.cobrosPendientesVsPrev, changeUnit: 'pct' as const },
    { icon: '⏱️', label: 'Tasa de no-show',     value: fmt1(kpis.tasaNoShow),       unit: '%',  change: kpis.tasaNoShowVsPrev,       changeUnit: 'pp'  as const },
    { icon: '👥', label: 'Nuevos socios',        value: String(kpis.nuevosSocios),   unit: '',   change: kpis.nuevosSociosVsPrev,     changeUnit: 'pct' as const },
    { icon: '📈', label: 'Bonos / fijas activas',value: String(kpis.bonosActivos),  unit: '',   change: kpis.bonosActivosVsPrev,     changeUnit: 'pct' as const },
  ];

  return (
    <div className="wrap">
      {/* ── Cabecera ── */}
      <div className="top">
        <div className="logo" role="img" aria-label="Padel Hangar">✈️</div>
        <div>
          <div className="h1">Padel <b>Hangar</b> · Cuadro de mandos</div>
          <div className="sub">
            Panel de control — {kpis.periodoLabel} · datos de demostración
          </div>
        </div>
        <div className="seg" role="group" aria-label="Seleccionar periodo">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={period === p.key ? 'on' : ''}
              onClick={() => setPeriod(p.key)}
              aria-pressed={period === p.key}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Barra hazard ── */}
      <div className="hazard" aria-hidden="true" />

      {/* ── KPIs ── */}
      <div className="kpis">
        {kpiCards.map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* ── Fila 1: Ingresos wide + Pistas + Heatmap ── */}
      <div className="grid">
        <ChartCard
          title="Ingresos vs costes · margen"
          subtitle="12 meses · evolución anual"
          wide
          legend={[
            { color: 'var(--yellow)', label: 'Ingresos' },
            { color: 'var(--red)',    label: 'Costes' },
            { color: 'var(--green)',  label: 'Margen' },
          ]}
        >
          <RevenueChart data={revenue} />
        </ChartCard>

        <ChartCard
          title="Rendimiento de pistas"
          subtitle="% ocupación"
          legend={[
            { color: 'var(--yellow)', label: 'Indoor' },
            { color: 'var(--blue)',   label: 'Outdoor' },
          ]}
        >
          <CourtChart data={courts} />
        </ChartCard>

        <ChartCard title="Ocupación por franja" subtitle="día × hora · % uso">
          <Heatmap data={heat} />
        </ChartCard>
      </div>

      {/* ── Fila 2: Profesores + Tramos + Donuts + Combo ── */}
      <div className="grid" style={{ marginTop: 14 }}>
        <ChartCard title="Rendimiento de profesores" subtitle="ingresos · ocupación de franja">
          <ProfList data={profesores} />
        </ChartCard>

        <ChartCard
          title="Tarifas por tramo"
          subtitle="ingresos por banda horaria"
          note="La franja punta concentra la mayor parte de los ingresos: margen para crecer en valle vía promociones del bot."
        >
          <TramoList data={tramos} />
        </ChartCard>

        <ChartCard title="Origen de las reservas" subtitle="canal · % del total">
          <Donut data={canales} />
        </ChartCard>

        <ChartCard
          title="Estado de pagos y renovación"
          subtitle="cartera de socios · %"
          note="El bot persigue automáticamente el cobro pendiente; tras el plazo de gracia libera la plaza a lista de espera."
        >
          <Donut data={pagos} />
        </ChartCard>

        <ChartCard
          title="Ocupación e ingreso por hora-pista"
          subtitle="indicador combinado · 12 meses"
          wide
          legend={[
            { color: 'var(--yellow)', label: 'Ingreso/hora-pista (€)' },
            { color: 'var(--teal)',   label: 'Ocupación media (%)' },
          ]}
        >
          <ComboChart data={combo} />
        </ChartCard>
      </div>

      {/* ── Pie ── */}
      <div className="foot">
        Padel Hangar · Cuadro de mandos (demo) — datos simulados con fines de demostración · 8 pistas indoor + 3 outdoor
      </div>
    </div>
  );
}
