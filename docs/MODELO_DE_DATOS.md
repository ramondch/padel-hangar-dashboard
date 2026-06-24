# Modelo de datos — Padel Hangar

Este documento describe cada entidad y campo que el sistema de gestión del club debe exportar para conectar el cuadro de mandos con datos reales.

---

## Pista

| Campo   | Tipo                        | Descripción                              | Ejemplo      |
|---------|-----------------------------|------------------------------------------|--------------|
| `id`    | string                      | Identificador único de la pista          | `"P01"`      |
| `nombre`| string                      | Nombre mostrado en el dashboard          | `"Indoor 1"` |
| `tipo`  | `"indoor"` \| `"outdoor"`   | Tipo de pista                            | `"indoor"`   |

---

## Reserva

| Campo         | Tipo                                                    | Descripción                                           | Ejemplo          |
|---------------|---------------------------------------------------------|-------------------------------------------------------|------------------|
| `id`          | string                                                  | Identificador único                                   | `"R000001"`      |
| `pistaId`     | string                                                  | FK → Pista.id                                         | `"P03"`          |
| `fecha`       | string (ISO `YYYY-MM-DD`)                               | Fecha de la reserva                                   | `"2026-06-15"`   |
| `horaInicio`  | number (entero)                                         | Hora de inicio del slot. Valores esperados: 9,11,13,16,18,20,22 | `18`    |
| `duracionMin` | number                                                  | Duración en minutos (normalmente 90)                  | `90`             |
| `tipo`        | `"suelta"` \| `"fija"` \| `"escuela"` \| `"evento"`    | Tipo de reserva                                       | `"fija"`         |
| `canal`       | `"telegram"` \| `"playtomic"` \| `"recepcion"` \| `"web"` | Canal de reserva                                   | `"playtomic"`    |
| `tramo`       | `"valle"` \| `"llano"` \| `"punta"`                    | Franja tarifaria (derivada de `horaInicio`)           | `"punta"`        |
| `importe`     | number (€)                                              | Importe cobrado al jugador                            | `34.00`          |
| `importeLuz`  | number (€)                                              | Coste de electricidad imputado (0 para outdoor)       | `4.50`           |
| `estadoPago`  | `"pagado"` \| `"pendiente"`                             | Estado del cobro                                      | `"pagado"`       |
| `socioId`     | string                                                  | FK → Socio.id                                         | `"S042"`         |
| `profesorId`  | string (opcional)                                       | FK → Profesor.id — solo en reservas de tipo escuela   | `"PR02"`         |
| `noShow`      | boolean                                                 | El jugador no apareció sin avisar                     | `false`          |

**Regla de tramo** (derivar si no existe en el sistema origen):
- `horaInicio < 16` → `"valle"`
- `horaInicio >= 18` y `< 22` → `"punta"`
- En cualquier otro caso → `"llano"`

---

## Socio

| Campo       | Tipo                                                    | Descripción                                         | Ejemplo        |
|-------------|---------------------------------------------------------|-----------------------------------------------------|----------------|
| `id`        | string                                                  | Identificador único                                 | `"S042"`       |
| `nombre`    | string                                                  | Nombre del socio                                    | `"Ana García"` |
| `altaFecha` | string (ISO `YYYY-MM-DD`)                               | Fecha de alta en el club                            | `"2024-03-12"` |
| `estado`    | `"al_dia"` \| `"pendiente"` \| `"lista_espera"` \| `"baja"` | Estado de cuota                               | `"al_dia"`     |

---

## BonoFija

| Campo        | Tipo                           | Descripción                                             | Ejemplo      |
|--------------|--------------------------------|---------------------------------------------------------|--------------|
| `id`         | string                         | Identificador único                                     | `"B001"`     |
| `socioId`    | string                         | FK → Socio.id                                           | `"S042"`     |
| `pistaId`    | string                         | FK → Pista.id — pista asignada para el bono             | `"P05"`      |
| `diaSemana`  | number (0–6)                   | 0 = lunes, 6 = domingo                                  | `2`          |
| `hora`       | number (entero)                | Hora de inicio del slot semanal                         | `20`         |
| `periodo`    | `"trimestral"` \| `"anual"`   | Tipo de bono                                            | `"trimestral"` |
| `vence`      | string (ISO `YYYY-MM-DD`)      | Fecha de vencimiento del bono                           | `"2026-09-30"` |
| `estadoPago` | `"pagado"` \| `"pendiente"`    | Estado del pago del bono                                | `"pagado"`   |
| `importe`    | number (€)                     | Importe total del bono (no por sesión)                  | `580.00`     |
| `renovado`   | boolean                        | El socio renovó al vencer (para calcular tasa renovación) | `true`    |

---

## Profesor

| Campo    | Tipo   | Descripción              | Ejemplo       |
|----------|--------|--------------------------|---------------|
| `id`     | string | Identificador único      | `"PR01"`      |
| `nombre` | string | Nombre del profesor/a    | `"Carlos M."` |

---

## Coste

| Campo       | Tipo                                                                        | Descripción                          | Ejemplo         |
|-------------|-----------------------------------------------------------------------------|--------------------------------------|-----------------|
| `mes`       | string (`YYYY-MM`)                                                          | Mes al que pertenece el coste        | `"2026-06"`     |
| `categoria` | `"personal"` \| `"suministros"` \| `"alquiler"` \| `"mantenimiento"` \| `"marketing"` | Categoría del gasto       | `"personal"`    |
| `importe`   | number (€)                                                                  | Importe total de esa categoría       | `8750.00`       |

---

## Notas de integración

1. **Granularidad de costes**: si el sistema de gestión sólo exporta un total mensual, crea una fila única con `categoria: "personal"` (o la más representativa). Los selectores usarán el total igualmente.

2. **Slots horarios**: el heatmap está diseñado para los 7 slots `[9, 11, 13, 16, 18, 20, 22]`. Si el sistema opera con slots de 90 min corridos (8:00, 9:30 …), mapea la hora de inicio al slot más cercano al exportar.

3. **noShow**: si el sistema no registra no-shows, exporta siempre `false`. La métrica aparecerá en 0%.

4. **renovado**: si el sistema no tiene este campo, puedes derivarlo comprobando si existe un nuevo `BonoFija` para el mismo `(socioId, pistaId, hora, diaSemana)` con `vence` posterior.
