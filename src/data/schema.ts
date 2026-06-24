/**
 * ESQUEMA DE DATOS — Padel Hangar
 * Cada interfaz mapea 1:1 con la entidad real del club.
 * Cambiar a datos reales = implementar JsonProvider con este mismo esquema.
 */

/** Pista de pádel del recinto */
export interface Pista {
  id: string;
  nombre: string;
  tipo: 'indoor' | 'outdoor';
}

/** Reserva individual de una pista */
export interface Reserva {
  id: string;
  /** FK → Pista.id */
  pistaId: string;
  /** Fecha ISO YYYY-MM-DD */
  fecha: string;
  /** Hora de inicio (entero 0-23). Slots válidos: 9, 11, 13, 16, 18, 20, 22 */
  horaInicio: number;
  /** Duración en minutos (normalmente 90) */
  duracionMin: number;
  tipo: 'suelta' | 'fija' | 'escuela' | 'evento';
  canal: 'telegram' | 'playtomic' | 'recepcion' | 'web';
  /** Franja tarifaria derivada de horaInicio */
  tramo: 'valle' | 'llano' | 'punta';
  /** Importe cobrado al jugador (€) */
  importe: number;
  /** Coste imputado de electricidad (€) */
  importeLuz: number;
  estadoPago: 'pagado' | 'pendiente';
  /** FK → Socio.id */
  socioId: string;
  /** FK → Profesor.id — solo para reservas de tipo escuela */
  profesorId?: string;
  /** True si el jugador no apareció sin avisar */
  noShow: boolean;
}

/** Socio del club */
export interface Socio {
  id: string;
  nombre: string;
  /** Fecha ISO YYYY-MM-DD de alta en el club */
  altaFecha: string;
  estado: 'al_dia' | 'pendiente' | 'lista_espera' | 'baja';
}

/** Bono de pista fija (reserva recurrente semanal) */
export interface BonoFija {
  id: string;
  /** FK → Socio.id */
  socioId: string;
  /** FK → Pista.id */
  pistaId: string;
  /** Día de la semana 0=lunes … 6=domingo */
  diaSemana: number;
  /** Hora de inicio */
  hora: number;
  periodo: 'trimestral' | 'anual';
  /** Fecha de vencimiento ISO YYYY-MM-DD */
  vence: string;
  estadoPago: 'pagado' | 'pendiente';
  /** Importe del bono (€) */
  importe: number;
  /** El socio renovó al vencer */
  renovado: boolean;
}

/** Profesor/a de academia del club */
export interface Profesor {
  id: string;
  nombre: string;
}

/** Coste operativo mensual agrupado por categoría */
export interface Coste {
  /** Mes en formato YYYY-MM */
  mes: string;
  categoria: 'personal' | 'suministros' | 'alquiler' | 'mantenimiento' | 'marketing';
  importe: number;
}

/** Dataset completo: todo lo que necesita el dashboard */
export interface Dataset {
  pistas: Pista[];
  reservas: Reserva[];
  socios: Socio[];
  bonos: BonoFija[];
  profesores: Profesor[];
  costes: Coste[];
}
