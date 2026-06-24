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

const fmt  = (n: number) => Math.round(n).toLocaleString('es-ES');
const fmt1 = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const PERIODS: { key: Period; label: string }[] = [
  { key: 'mes',       label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'ano',       label: 'Año' },
];

const SLOT_LABELS = ['09h','11h','13h','16h','18h','20h','22h'];

function LogoPH() {
  return (
    <svg width="164" height="48" viewBox="0 0 164 48" aria-label="Padel Hangar" role="img" style={{ flexShrink: 0 }}>
      {/* Semicírculo amarillo — elemento visual del logo */}
      <path d="M0 48 L0 24 A24 24 0 0 1 48 24 L48 48 Z" fill="#FFD400"/>
      <circle cx="24" cy="24" r="11" fill="#020D1F"/>
      <circle cx="24" cy="24" r="5"  fill="#FFD400" opacity=".6"/>
      {/* Texto */}
      <text x="58" y="21" fill="#E8F2FF" fontSize="20" fontWeight="700"
        fontFamily="'Barlow Condensed',system-ui,sans-serif" letterSpacing="1.5">
        PADEL
      </text>
      <text x="58" y="42" fill="#FFD400" fontSize="20" fontWeight="700"
        fontFamily="'Barlow Condensed',system-ui,sans-serif" letterSpacing="1.5">
        HANGAR
      </text>
    </svg>
  );
}

export default function App() {
  const [dataset, setDataset]             = useState<Dataset | null>(null);
  const [period, setPeriod]               = useState<Period>('mes');
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null);
  const [selectedPago, setSelectedPago]   = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot]   = useState<number | null>(null);

  useEffect(() => {
    dataProvider.getDataset().then(setDataset);
  }, []);

  const dash = useMemo(
    () => dataset ? computeDashboard(dataset, period) : null,
    [dataset, period],
  );

  const hasFilters = selectedCourt !== null || selectedCanal !== null
    || selectedPago !== null || selectedSlot !== null;

  function clearAll() {
    setSelectedCourt(null);
    setSelectedCanal(null);
    setSelectedPago(null);
    setSelectedSlot(null);
  }

  if (!dash) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--mut)' }}>
        Cargando datos…
      </div>
    );
  }

  const { kpis, revenue, courts, heat, profesores, tramos, canales, pagos, combo } = dash;

  const kpiCards = [
    { icon: '💶', label: 'Ingresos',            value: fmt(kpis.ingresos),           unit: '€',  change: kpis.ingresosVsPrev,         changeUnit: 'pct' as const },
    { icon: '📊', label: 'Ocupación media',      value: String(kpis.ocupacion),       unit: '%',  change: kpis.ocupacionVsPrev,        changeUnit: 'pp'  as const },
    { icon: '🎾', label: 'Ingreso / hora-pista', value: fmt1(kpis.ingresoPorHora),    unit: '€',  change: kpis.ingresoPorHoraVsPrev,   changeUnit: 'pct' as const },
    { icon: '🔁', label: '% Renovación bonos',   value: String(kpis.renovacionBonos), unit: '%',  change: kpis.renovacionBonosVsPrev,  changeUnit: 'pp'  as const },
    { icon: '⚠️', label: 'Cobros pendientes',    value: fmt(kpis.cobrosPendientes),   unit: '€',  change: kpis.cobrosPendientesVsPrev, changeUnit: 'pct' as const },
    { icon: '⏱️', label: 'Tasa de no-show',      value: fmt1(kpis.tasaNoShow),        unit: '%',  change: kpis.tasaNoShowVsPrev,       changeUnit: 'pp'  as const },
    { icon: '👥', label: 'Nuevos socios',         value: String(kpis.nuevosSocios),    unit: '',   change: kpis.nuevosSociosVsPrev,     changeUnit: 'pct' as const },
    { icon: '📈', label: 'Bonos / fijas activas', value: String(kpis.bonosActivos),   unit: '',   change: kpis.bonosActivosVsPrev,     changeUnit: 'pct' as const },
  ];

  return (
    <div className="wrap">
      {/* ── Cabecera ── */}
      <div className="top">
        <LogoPH />
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

      {/* ── Filtros activos ── */}
      {hasFilters && (
        <div className="filter-bar" role="status" aria-live="polite">
          <span className="filter-label">Filtrando por</span>

          {selectedCourt !== null && (
            <span className="chip">
              Pista: {selectedCourt}
              <button onClick={() => setSelectedCourt(null)} aria-label="Quitar filtro pista">×</button>
            </span>
          )}
          {selectedCanal !== null && (
            <span className="chip">
              Canal: {selectedCanal}
              <button onClick={() => setSelectedCanal(null)} aria-label="Quitar filtro canal">×</button>
            </span>
          )}
          {selectedPago !== null && (
            <span className="chip">
              Pago: {selectedPago}
              <button onClick={() => setSelectedPago(null)} aria-label="Quitar filtro pago">×</button>
            </span>
          )}
          {selectedSlot !== null && (
            <span className="chip">
              Franja: {SLOT_LABELS[selectedSlot]}
              <button onClick={() => setSelectedSlot(null)} aria-label="Quitar filtro franja">×</button>
            </span>
          )}

          <button className="btn-clear" onClick={clearAll}>Limpiar todo</button>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="kpis">
        {kpiCards.map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* ── Fila 1 ── */}
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
          subtitle={selectedCourt ? `Seleccionada: ${selectedCourt}` : undefined}
          interactive
          legend={[
            { color: 'var(--yellow)', label: 'Indoor' },
            { color: 'var(--blue)',   label: 'Outdoor' },
          ]}
        >
          <CourtChart
            data={courts}
            selected={selectedCourt}
            onSelect={setSelectedCourt}
          />
        </ChartCard>

        <ChartCard
          title="Ocupación por franja"
          subtitle={selectedSlot !== null ? `Franja activa: ${SLOT_LABELS[selectedSlot]}` : undefined}
          interactive
        >
          <Heatmap
            data={heat}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            courtNote={selectedCourt}
          />
        </ChartCard>
      </div>

      {/* ── Fila 2 ── */}
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

        <ChartCard
          title="Origen de las reservas"
          subtitle={selectedCanal ? `Seleccionado: ${selectedCanal}` : undefined}
          interactive
        >
          <Donut
            data={canales}
            selected={selectedCanal}
            onSelect={setSelectedCanal}
          />
        </ChartCard>

        <ChartCard
          title="Estado de pagos y renovación"
          subtitle={selectedPago ? `Seleccionado: ${selectedPago}` : undefined}
          interactive
          note="El bot persigue automáticamente el cobro pendiente; tras el plazo de gracia libera la plaza a lista de espera."
        >
          <Donut
            data={pagos}
            selected={selectedPago}
            onSelect={setSelectedPago}
          />
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
        Padel Hangar · Cuadro de mandos (demo) — datos simulados · 8 pistas indoor + 3 outdoor
      </div>
    </div>
  );
}
