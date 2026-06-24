# Padel Hangar · Cuadro de mandos

Dashboard web estático para el club de pádel **Padel Hangar**.
Stack: **Vite + React + TypeScript** · Despliegue: **GitHub Pages** (gratuito).

---

## Arranque local

```bash
npm install
npm run dev
```

Abre [http://localhost:5173/padel-hangar-dashboard/](http://localhost:5173/padel-hangar-dashboard/)

Por defecto carga datos sintéticos generados en el navegador (sin backend, sin API).

---

## Despliegue en GitHub Pages (gratuito)

### Paso 1 — Crear el repositorio

1. Crea un repositorio en GitHub llamado `padel-hangar-dashboard` (puede ser privado).
2. Sube este código:

```bash
git init
git add .
git commit -m "init: cuadro de mandos Padel Hangar"
git remote add origin https://github.com/ramondch/padel-hangar-dashboard.git
git push -u origin main
```

### Paso 2 — Activar GitHub Pages

1. Ve a **Settings → Pages** en tu repositorio.
2. En **Source** selecciona **GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` se ejecuta automáticamente en cada push a `main`.
4. En 1-2 minutos la app estará disponible en:
   `https://ramondch.github.io/padel-hangar-dashboard/`

> **Nota:** Si el nombre del repositorio es diferente a `padel-hangar-dashboard`, actualiza `base` en `vite.config.ts`.

---

## Alternativa: despliegue en Vercel (también gratuito)

1. Importa el repositorio en [vercel.com](https://vercel.com).
2. Vercel detecta Vite automáticamente.
3. En **Environment Variables** añade si quieres datos reales:
   ```
   VITE_DATA_SOURCE=json
   ```
4. Haz click en **Deploy**. URL pública inmediata.

> Con Vercel no necesitas cambiar `base` en `vite.config.ts` — déjalo en `/padel-hangar-dashboard/` para que GitHub Pages siga funcionando.

---

## CÓMO CARGAR DATOS REALES

Hay dos formas equivalentes. Elige la más cómoda según tu sistema de gestión.

### Opción A — Exportar a JSON (recomendado)

1. Exporta cada entidad desde tu sistema de gestión a un fichero JSON:

   | Fichero                       | Entidad     |
   |-------------------------------|-------------|
   | `public/data/pistas.json`     | Pista       |
   | `public/data/reservas.json`   | Reserva     |
   | `public/data/socios.json`     | Socio       |
   | `public/data/bonos.json`      | BonoFija    |
   | `public/data/profesores.json` | Profesor    |
   | `public/data/costes.json`     | Coste       |

2. El esquema exacto de cada campo está en [`docs/MODELO_DE_DATOS.md`](docs/MODELO_DE_DATOS.md).
   Los ficheros en `public/data/*.json` son **ejemplos** del formato esperado.

3. Cambia la variable de entorno:
   - **GitHub Pages**: edita el fichero `.github/workflows/deploy.yml` y cambia:
     ```yaml
     VITE_DATA_SOURCE: json
     ```
   - **Vercel**: añade `VITE_DATA_SOURCE=json` en las variables de entorno del proyecto.
   - **Local**: crea `.env.local` con:
     ```
     VITE_DATA_SOURCE=json
     ```

4. Haz push / redesplega. El dashboard leerá tus JSON reales automáticamente.

### Opción B — Mapear campos en el provider

Si tu sistema exporta con nombres de campo distintos al esquema, implementa un adaptador
en `src/data/provider.ts`:

```typescript
export class MiSistemaProvider implements DataProvider {
  async getDataset(): Promise<Dataset> {
    const raw = await fetch('/api/export').then(r => r.json());
    return {
      pistas: raw.courts.map((c: any) => ({
        id: c.court_id,
        nombre: c.court_name,
        tipo: c.is_indoor ? 'indoor' : 'outdoor',
      })),
      // … mapear el resto de entidades
    };
  }
}
```

Luego en `src/data/index.ts`:
```typescript
export const dataProvider = new MiSistemaProvider();
```

La UI y los selectores no cambian: **solo el provider**.

---

## Estructura del proyecto

```
src/
├── data/
│   ├── schema.ts      ← Interfaces TypeScript (contrato de datos)
│   ├── synthetic.ts   ← Generador sintético con semilla fija
│   ├── provider.ts    ← SyntheticProvider + JsonProvider
│   ├── selectors.ts   ← TODA la lógica de métricas (KPIs, gráficos)
│   └── index.ts       ← Selección de provider por variable de entorno
├── components/
│   ├── KpiCard.tsx
│   ├── ChartCard.tsx
│   └── charts/
│       ├── RevenueChart.tsx   ← SVG: ingresos vs costes + margen
│       ├── CourtChart.tsx     ← SVG: % ocupación por pista
│       ├── Heatmap.tsx        ← CSS grid: día × franja
│       ├── ProfList.tsx       ← Barras: profesores
│       ├── TramoList.tsx      ← Barras: tramos
│       ├── Donut.tsx          ← SVG donut reutilizable
│       └── ComboChart.tsx     ← SVG: área + línea combinado
├── styles/
│   ├── tokens.css     ← Variables CSS de diseño
│   └── global.css     ← Estilos globales
└── App.tsx            ← Layout del dashboard
```

---

## Decisiones de diseño anotadas

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| SVG manual (sin librería) | Recharts | Fidelidad visual exacta al HTML de referencia |
| Datos sintéticos en browser | API externa | App 100% estática, sin coste de servidor |
| PRNG mulberry32 con seed=42 | Math.random() | Reproducibilidad entre recargas |
| 7 slots horarios fijos [9,11,13,16,18,20,22] | Slots de 90 min corridos | Alineación directa con el heatmap de referencia |
| `calcCombo` busca el mes en `costes` para obtener YYYY | Fecha hardcodeada | Tolera cambio de año sin tocar código |
