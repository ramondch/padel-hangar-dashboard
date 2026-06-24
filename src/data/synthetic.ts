/**
 * GENERADOR DE DATOS SINTÉTICOS — Padel Hangar
 *
 * Produce un Dataset reproducible usando un PRNG con semilla fija.
 * Cubre 18 meses (enero 2025 – junio 2026).
 *
 * Calibración objetivo (mes punta):
 *   • Ingresos ≈ 52.000 €   • Ocupación media ≈ 81%
 *   • Indoor: 74–92%         • Outdoor: 52–64%
 *   • ~11% pagos pendientes  • ~5% no-show
 *   • Bajón agosto (~-28%)   • Estacionalidad realista
 */

import type { Dataset, Pista, Reserva, Socio, BonoFija, Profesor, Coste } from './schema';

// ── PRNG (mulberry32) con semilla fija ────────────────────────────────────────
function mkRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 42;

// ── Helpers ───────────────────────────────────────────────────────────────────
function rInt(rng: () => number, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}
function rPick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function rBool(rng: () => number, prob: number) {
  return rng() < prob;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

// ── Constantes del club ───────────────────────────────────────────────────────

/** 8 pistas indoor + 3 outdoor */
const PISTAS: Pista[] = [
  { id: 'P01', nombre: 'Indoor 1', tipo: 'indoor' },
  { id: 'P02', nombre: 'Indoor 2', tipo: 'indoor' },
  { id: 'P03', nombre: 'Indoor 3', tipo: 'indoor' },
  { id: 'P04', nombre: 'Indoor 4', tipo: 'indoor' },
  { id: 'P05', nombre: 'Indoor 5', tipo: 'indoor' },
  { id: 'P06', nombre: 'Indoor 6', tipo: 'indoor' },
  { id: 'P07', nombre: 'Indoor 7', tipo: 'indoor' },
  { id: 'P08', nombre: 'Indoor 8', tipo: 'indoor' },
  { id: 'P09', nombre: 'Outdoor 1', tipo: 'outdoor' },
  { id: 'P10', nombre: 'Outdoor 2', tipo: 'outdoor' },
  { id: 'P11', nombre: 'Outdoor 3', tipo: 'outdoor' },
];

const PROFESORES: Profesor[] = [
  { id: 'PR01', nombre: 'Carlos M.' },
  { id: 'PR02', nombre: 'Laura V.' },
  { id: 'PR03', nombre: 'Diego R.' },
  { id: 'PR04', nombre: 'Ana P.' },
  { id: 'PR05', nombre: 'Javi S.' },
];

/** Slots horarios alineados con el heatmap de referencia */
const SLOTS_HORA = [9, 11, 13, 16, 18, 20, 22] as const;

/** Nombres sintéticos de socios */
const NOMBRES_A = ['Ana','Luis','María','Carlos','Laura','Diego','Sofía','Pablo','Elena','Javier',
  'Marta','Andrés','Isabel','Sergio','Carmen','Raúl','Lucía','Miguel','Paula','Álvaro',
  'Nuria','Roberto','Patricia','Víctor','Cristina'];
const NOMBRES_B = ['García','López','Martínez','Sánchez','Fernández','Rodríguez','González',
  'Jiménez','Ruiz','Díaz','Moreno','Muñoz','Álvarez','Romero','Alonso','Navarro','Torres',
  'Domínguez','Vázquez','Ramos'];

// ── Lógica de negocio ─────────────────────────────────────────────────────────

function getTramo(hora: number): Reserva['tramo'] {
  if (hora < 16) return 'valle';
  if (hora >= 18 && hora < 22) return 'punta';
  return 'llano'; // 16, 22
}

/** Precio base por tramo y tipo de pista (€/90 min) */
const PRECIOS: Record<Pista['tipo'], Record<Reserva['tramo'], number>> = {
  indoor:   { valle: 20, llano: 24, punta: 34 },
  outdoor:  { valle: 15, llano: 19, punta: 26 },
};

function getImporte(rng: () => number, tramo: Reserva['tramo'], tipo: Pista['tipo']): number {
  const base = PRECIOS[tipo][tramo];
  // ±12% variación aleatoria
  return Math.round((base * (0.88 + rng() * 0.24)) * 100) / 100;
}

function getImporteLuz(hora: number, tipo: Pista['tipo']): number {
  if (tipo === 'outdoor') return 0;
  // Iluminación: más cara en horas nocturnas
  if (hora >= 20) return 4.5;
  if (hora >= 16) return 3.0;
  return 1.5;
}

function getCanal(rng: () => number): Reserva['canal'] {
  const v = rng();
  if (v < 0.38) return 'telegram';
  if (v < 0.72) return 'playtomic';
  if (v < 0.90) return 'recepcion';
  return 'web';
}

function getTipoReserva(rng: () => number, tieneProf: boolean): Reserva['tipo'] {
  if (tieneProf) return 'escuela';
  const v = rng();
  if (v < 0.45) return 'suelta';
  if (v < 0.85) return 'fija';
  if (v < 0.95) return 'escuela';
  return 'evento';
}

/** Distribución de profesores: Carlos > Laura > Diego > Ana > Javi */
function getProfesorId(rng: () => number): string {
  const v = rng();
  if (v < 0.30) return 'PR01';
  if (v < 0.55) return 'PR02';
  if (v < 0.75) return 'PR03';
  if (v < 0.90) return 'PR04';
  return 'PR05';
}

/**
 * Probabilidad de ocupación para una combinación (mes, díaSemana, tramo, tipo).
 * Modela estacionalidad, franjas punta y diferencia indoor/outdoor.
 */
function probOcupacion(
  mes: number,           // 0=ene … 11=dic
  diaSemana: number,     // 0=lun … 6=dom
  tramo: Reserva['tramo'],
  tipo: Pista['tipo'],
): number {
  // Estacionalidad mensual (agosto baja, otoño-primavera alta)
  const estac = [0.82, 0.85, 0.88, 0.87, 0.90, 0.86, 0.76, 0.59, 0.86, 0.91, 0.93, 0.83][mes];
  // Tramo horario
  const tramoF = { valle: 0.64, llano: 0.82, punta: 0.97 }[tramo];
  // Día de semana (viernes punta, domingo flojo)
  const diaF = [0.84, 0.86, 0.87, 0.89, 0.95, 0.91, 0.79][diaSemana];
  // Indoor siempre más demandado que outdoor
  const tipoF = tipo === 'indoor' ? 1.0 : 0.68;

  return Math.min(0.98, estac * tramoF * diaF * tipoF);
}

// ── Generadores de cada entidad ───────────────────────────────────────────────

function genSocios(rng: () => number): Socio[] {
  const socios: Socio[] = [];
  for (let i = 1; i <= 285; i++) {
    const v = rng();
    const estado: Socio['estado'] =
      v < 0.80 ? 'al_dia' :
      v < 0.91 ? 'pendiente' :
      v < 0.96 ? 'lista_espera' : 'baja';

    // Alta distribuida entre ene 2023 y jun 2026
    const baseMs = new Date('2023-01-01').getTime();
    const rangeMs = new Date('2026-06-01').getTime() - baseMs;
    const altaDate = new Date(baseMs + rng() * rangeMs);

    socios.push({
      id: `S${String(i).padStart(3, '0')}`,
      nombre: `${rPick(rng, NOMBRES_A)} ${rPick(rng, NOMBRES_B)}`,
      altaFecha: isoDate(altaDate),
      estado,
    });
  }
  return socios;
}

function genBonos(rng: () => number, socios: Socio[]): BonoFija[] {
  const bonos: BonoFija[] = [];
  const sociosActivos = socios.filter(s => s.estado === 'al_dia' || s.estado === 'pendiente');
  let idx = 0;

  // ~200 bonos activos: un bono por socio activo hasta ~200
  for (const socio of sociosActivos.slice(0, 210)) {
    const pista = rPick(rng, PISTAS);
    const diaSemana = rInt(rng, 0, 6);
    const hora = rPick(rng, SLOTS_HORA as unknown as number[]) as number;
    const periodo: BonoFija['periodo'] = rBool(rng, 0.6) ? 'trimestral' : 'anual';
    const mesesPeriodo = periodo === 'trimestral' ? 3 : 12;

    // Fecha de vencimiento: escalonada a lo largo del periodo de datos
    const baseVence = new Date('2025-07-01');
    const offsetMeses = Math.floor(rng() * 18);
    const vence = addMonths(baseVence, offsetMeses);

    const estadoPago: BonoFija['estadoPago'] = rBool(rng, 0.89) ? 'pagado' : 'pendiente';
    const precioBase = PRECIOS[pista.tipo][getTramo(hora)];
    const importeBono = Math.round(precioBase * 4 * mesesPeriodo * 0.85); // 15% dto por bono

    bonos.push({
      id: `B${String(++idx).padStart(3, '0')}`,
      socioId: socio.id,
      pistaId: pista.id,
      diaSemana,
      hora,
      periodo,
      vence: isoDate(vence),
      estadoPago,
      importe: importeBono,
      renovado: rBool(rng, 0.88),
    });
  }
  return bonos;
}

function genCostes(rng: () => number): Coste[] {
  const costes: Coste[] = [];
  const inicio = new Date('2025-01-01');

  for (let m = 0; m < 18; m++) {
    const d = addMonths(inicio, m);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    // Estacionalidad leve en costes (agosto algo menos por cierres parciales)
    const factor = d.getMonth() === 7 ? 0.90 : 1.0;

    costes.push(
      { mes, categoria: 'personal',      importe: Math.round((8400 + rng() * 800) * factor) },
      { mes, categoria: 'suministros',   importe: Math.round((3200 + rng() * 600) * factor) },
      { mes, categoria: 'alquiler',      importe: Math.round((6500 + rng() * 200) * factor) },
      { mes, categoria: 'mantenimiento', importe: Math.round((600  + rng() * 900) * factor) },
      { mes, categoria: 'marketing',     importe: Math.round((300  + rng() * 400) * factor) },
    );
  }
  return costes;
}

function genReservas(rng: () => number, socios: Socio[]): Reserva[] {
  const reservas: Reserva[] = [];
  const sociosIds = socios.filter(s => s.estado !== 'lista_espera').map(s => s.id);

  const inicio = new Date('2025-01-01');
  const fin = new Date('2026-06-30');
  let id = 1;

  // Iterar día a día
  const cur = new Date(inicio);
  while (cur <= fin) {
    const mes = cur.getMonth();           // 0-11
    const diaSemana = (cur.getDay() + 6) % 7; // 0=lun

    for (const pista of PISTAS) {
      for (const hora of SLOTS_HORA) {
        const tramo = getTramo(hora);
        const prob = probOcupacion(mes, diaSemana, tramo, pista.tipo);

        if (rng() > prob) continue; // pista libre ese slot

        const tieneProf = pista.tipo === 'indoor' && rBool(rng, 0.13);
        const profesorId = tieneProf ? getProfesorId(rng) : undefined;
        const importe = getImporte(rng, tramo, pista.tipo);
        const pendiente = rBool(rng, 0.11);

        reservas.push({
          id: `R${String(id++).padStart(6, '0')}`,
          pistaId: pista.id,
          fecha: isoDate(cur),
          horaInicio: hora,
          duracionMin: 90,
          tipo: getTipoReserva(rng, tieneProf),
          canal: getCanal(rng),
          tramo,
          importe,
          importeLuz: getImporteLuz(hora, pista.tipo),
          estadoPago: pendiente ? 'pendiente' : 'pagado',
          socioId: rPick(rng, sociosIds),
          profesorId,
          noShow: rBool(rng, 0.05),
        });
      }
    }

    cur.setDate(cur.getDate() + 1);
  }

  return reservas;
}

// ── Punto de entrada ──────────────────────────────────────────────────────────

let _cached: Dataset | null = null;

/** Devuelve el dataset sintético (se genera una sola vez y se cachea). */
export function generateDataset(): Dataset {
  if (_cached) return _cached;

  const rng = mkRng(SEED);

  const socios = genSocios(rng);
  const bonos = genBonos(rng, socios);
  const costes = genCostes(rng);
  const reservas = genReservas(rng, socios);

  _cached = { pistas: PISTAS, reservas, socios, bonos, profesores: PROFESORES, costes };
  return _cached;
}
