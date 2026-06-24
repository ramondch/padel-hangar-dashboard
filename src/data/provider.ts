/**
 * CAPA DE PROVIDER — Padel Hangar
 *
 * Para pasar a datos reales: implementa JsonProvider y pon
 * VITE_DATA_SOURCE=json en tu fichero .env o en la configuración del hosting.
 */

import type { Dataset } from './schema';
import { generateDataset } from './synthetic';

// ── Interfaz pública ──────────────────────────────────────────────────────────

export interface DataProvider {
  getDataset(): Promise<Dataset>;
}

// ── Implementación: datos sintéticos ─────────────────────────────────────────

export class SyntheticProvider implements DataProvider {
  async getDataset(): Promise<Dataset> {
    // Generación síncrona; envolvemos en Promise para respetar la interfaz
    return generateDataset();
  }
}

// ── Implementación: JSON en /public/data/ ─────────────────────────────────────

/**
 * Lee los ficheros JSON exportados del sistema de gestión real.
 * El esquema de cada fichero debe coincidir EXACTAMENTE con las interfaces
 * definidas en schema.ts. Ver docs/MODELO_DE_DATOS.md para el detalle campo a campo.
 */
export class JsonProvider implements DataProvider {
  private base: string;

  constructor(base = import.meta.env.BASE_URL + 'data') {
    this.base = base.replace(/\/$/, '');
  }

  async getDataset(): Promise<Dataset> {
    const [pistas, reservas, socios, bonos, profesores, costes] = await Promise.all([
      fetch(`${this.base}/pistas.json`).then(r => r.json()),
      fetch(`${this.base}/reservas.json`).then(r => r.json()),
      fetch(`${this.base}/socios.json`).then(r => r.json()),
      fetch(`${this.base}/bonos.json`).then(r => r.json()),
      fetch(`${this.base}/profesores.json`).then(r => r.json()),
      fetch(`${this.base}/costes.json`).then(r => r.json()),
    ]);
    return { pistas, reservas, socios, bonos, profesores, costes };
  }
}
