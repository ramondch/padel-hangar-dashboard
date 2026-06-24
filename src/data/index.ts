/**
 * PUNTO DE ENTRADA DE DATOS — Padel Hangar
 *
 * Selecciona el provider según la variable de entorno VITE_DATA_SOURCE.
 *   • synthetic (por defecto): datos generados en el navegador con semilla fija
 *   • json: lee /public/data/*.json — para datos reales del club
 *
 * Para cambiar en producción añade en el hosting (Vercel / GitHub Pages .env):
 *   VITE_DATA_SOURCE=json
 */

import { SyntheticProvider, JsonProvider, type DataProvider } from './provider';

const source = import.meta.env.VITE_DATA_SOURCE ?? 'synthetic';

export const dataProvider: DataProvider =
  source === 'json' ? new JsonProvider() : new SyntheticProvider();

export type { DataProvider };
export type { Dataset } from './schema';
