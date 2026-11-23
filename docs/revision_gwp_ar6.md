# Revisión de GWP del seeder AR6

Fecha: 2026-11-23. Estado: **aprobado como diagnóstico técnico provisional** (2026-11-23). No autoriza modificar valores. Condiciones de la aprobación:

- Los valores actuales del seeder se mantienen intactos. No se modifica la base de datos ni se ejecutan seeders o migraciones.
- No son definitivos los valores cuya verificación contra la tabla original del IPCC WGIII sigue pendiente.
- Todas las discrepancias se conservan documentadas.
- NH3 y R-744 quedan documentados fuera del seeder, sin incorporarse.
- Siguen pendientes las decisiones sobre CH4, SF6, c-C4F8, HFC-32 y HFC-365mfc.
- No se inicia el mapeo de A1 ni la carga de factores reales.

## Alcance y aclaración de conteo

`database/seeders/gwp_ar6_seeder.ts` contiene **26 gases**, no 27 (el informe anterior contó mal). La tabla documenta los 26 y, aparte, NH3 y R-744, que no están en el seeder.

Todos los valores del seeder pertenecen al conjunto `IPCC-AR6-WGIII-GWP100` (`horizonteAnios = 100`, `estandarVersion = 'AR6 WGIII Annex II (2022)'`), con fuente declarada "IPCC AR6 WGIII Annex II, Table 9" y referencia `https://www.ipcc.ch/report/ar6/wg3/downloads/report/IPCC_AR6_WGIII_Annex-II.pdf`. El código indica que la Tabla 9 deriva de AR6 WGI (Forster et al. 2021, sección 7.6 y tabla 7.SM.7) y que el metano se distingue con las Tablas 11 y 12.

## Fuentes y disponibilidad real

| Id | Documento | Tipo | Disponibilidad |
|---|---|---|---|
| S1 | IPCC AR6 WGIII, Annex II, Table 9 (y Tablas 11–12) | Original IPCC (fuente declarada del seeder) | **No consultada.** ipcc.ch responde 403 a accesos automatizados y el PDF fuerza descarga en el navegador. |
| S2 | IPCC AR6 WGIII, Errata | Original IPCC | **No consultada** (403). |
| S3 | IPCC AR6 WGI, Cap. 7, Tabla 7.SM.7, versión *Final Government Distribution* ("Do Not Cite, Quote or Distribute"), copia alojada por Maine DEP: `https://www1.maine.gov/dep/ftp/AIR/DATA/GHG_SUMMARIES/IPCC_2021_AR6_Table_7.SM.7.pdf` | Documento IPCC, **borrador previo a la versión final**, en alojamiento de terceros | Leída completa. Redondeo a 3 cifras significativas. CH4 sin ajustes químicos (la tabla remite a la Tabla 7.15 para los valores con ajustes). |
| S4 | GHG Protocol, *IPCC Global Warming Potential Values*, versión 2.0, 7 ago 2024: `https://ghgprotocol.org/sites/default/files/2024-08/Global-Warming-Potential-Values%20%28August%202024%29.pdf` | **Secundaria** (adaptada de AR6 WGI, cita la sección 7.6.1.1 y las Tablas 7.15 y 7.SM.6) | Leída completa. Redondeo a 3 cifras significativas. |
| — | IPCC AR6 WGI, Tabla 7.15 y versión final de 7.SM.7 en ipcc.ch | Original IPCC | **No consultadas** (ipcc.ch bloqueado). |

Ningún valor de este documento queda confirmado contra S1, porque S1 no pudo leerse. "Confirmado" significa aquí: el valor del seeder coincide exactamente con S3 y con S4.

## Criterio de clasificación

- **Confirmado**: el valor del seeder es igual al de S3 y al de S4.
- **Diferencia**: el valor del seeder no es igual al de S3 o S4. Se distingue el tipo:
  - *precisión*: el valor del seeder, redondeado a 3 cifras significativas, da el valor de S3 y de S4;
  - *no explicada por redondeo*: el redondeo no reproduce el valor publicado;
  - *identificación*: el valor coincide con otra sustancia;
  - *entre fuentes*: S3 y S4 no coinciden entre sí.
- **Pendiente de verificar**: la comparación depende de una tabla no consultada o de una metodología distinta.
- **Sin valor identificado**: ninguna fuente consultada publica un GWP.

## Matriz (GWP100 en todos los casos)

| # | Gas | Valor actual | Fuente del seeder | Valor de referencia | Fuente de referencia | Horizonte | Estado | Observaciones | Decisión pendiente |
|---|---|---|---|---|---|---|---|---|---|
| 1 | CO2 | 1 | S1 | 1 / 1 | S3; S4 (AR6) | GWP100 | Confirmado | Gas de referencia, 1 por definición. | Ninguna. |
| 2 | CH4_BIOGENIC (CH4) | 27 | S1 (Tablas 9, 11, 12) | S4: 27.0 (non-fossil). S3: 27.9 | S4 (AR6); S3 | GWP100 | Pendiente de verificar | S3 da 27.9 **sin ajustes químicos**; S4 da 27.0 citando la Tabla 7.15 (no consultada). Son metodologías distintas: no son equivalentes. | Confirmar en S1 o en la Tabla 7.15 cuál es el valor non-fossil y su tratamiento. |
| 3 | CH4_FOSSIL_COMBUSTION (CH4) | 27 | S1 | S4: 27.0 (non-fossil) | S4 | GWP100 | Pendiente de verificar | S4 indica que la combustión fósil usa el valor non-fossil, para no duplicar el CO2 de oxidación. El seeder es coherente con esa instrucción, pero falta la fuente original. | Confirmar en S1 y aprobar la regla de que la combustión usa el valor non-fossil. |
| 4 | CH4_FOSSIL_FUGITIVE_PROCESS (CH4) | 29.8 | S1 | S4: 29.8 (fossil) | S4 | GWP100 | Pendiente de verificar | Incluye el CO2 de oxidación del metano fósil. No figura en S3. | Confirmar en S1 o en la Tabla 7.15. |
| 5 | N2O | 273 | S1 | 273 / 273 | S3; S4 | GWP100 | Confirmado | — | Ninguna. |
| 6 | HFC-32 (CH2F2) | 770 | S1 | 771 / 771 | S3; S4 | GWP100 | Diferencia (no explicada por redondeo) | 770 redondeado a 3 cifras sigue siendo 770, no 771. | Verificar en S1 y en S2. |
| 7 | HFC-143a (CH3CF3) | 5807 | S1 | 5810 / 5810 | S3; S4 | GWP100 | Diferencia (precisión) | 5807 → 5810. | Elegir el conjunto de precisión (ver C1). |
| 8 | CF4 (PFC-14) | 7379 | S1 | 7380 / 7380 | S3; S4 | GWP100 | Diferencia (precisión) | 7379 → 7380. | C1. |
| 9 | C2F6 (PFC-116) | 12410 | S1 | 12400 / 12400 | S3; S4 | GWP100 | Diferencia (precisión) | 12410 → 12400. | C1. |
| 10 | C3F8 (PFC-218) | 9289 | S1 | 9290 / 9290 | S3; S4 | GWP100 | Diferencia (precisión) | 9289 → 9290. | C1. |
| 11 | C4F10 (PFC-31-10) | 10022 | S1 | 10000 / 10000 | S3; S4 | GWP100 | Diferencia (precisión) | 10022 → 10000. | C1. |
| 12 | C5F12 (PFC-41-12) | 9218 | S1 | 9220 / 9220 | S3; S4 | GWP100 | Diferencia (precisión) | 9218 → 9220. | C1. |
| 13 | C6F14 (PFC-51-14) | 8617 | S1 | 8620 / 8620 | S3; S4 | GWP100 | Diferencia (precisión) | 8617 → 8620. | C1. |
| 14 | C7F16 (PFC-61-16) | 8409 | S1 | 8410 / 8410 | S3; S4 | GWP100 | Diferencia (precisión) | 8409 → 8410. | C1. |
| 15 | c-C4F8 (PFC-C-318) | 13902 | S1 | 10200 / 10200 | S3; S4 | GWP100 | Diferencia (identificación) | 13902 → 13900, que es el valor del **octafluorooxolano (c-C4F8O)** en S3 y S4, no el de c-C4F8. Ver sección B. | Verificar la fila en S1 y decidir la corrección. |
| 16 | HFC-134a (CH2FCF3) | 1526 | S1 | 1530 / 1530 | S3; S4 | GWP100 | Diferencia (precisión) | 1526 → 1530. | C1. |
| 17 | HFC-125 (CHF2CF3) | 3744 | S1 | 3740 / 3740 | S3; S4 | GWP100 | Diferencia (precisión) | 3744 → 3740. | C1. |
| 18 | HFC-152a (CH3CHF2) | 164 | S1 | 164 / 164 | S3; S4 | GWP100 | Confirmado | — | Ninguna. |
| 19 | HFC-227ea (CF3CHFCF3) | 3602 | S1 | 3600 / 3600 | S3; S4 | GWP100 | Diferencia (precisión) | 3602 → 3600. | C1. |
| 20 | HFC-23 (CHF3) | 14590 | S1 | 14600 / 14600 | S3; S4 | GWP100 | Diferencia (precisión) | 14590 → 14600. | C1. |
| 21 | HFC-236fa (CF3CH2CF3) | 8689 | S1 | 8690 / 8690 | S3; S4 | GWP100 | Diferencia (precisión) | 8689 → 8690. | C1. |
| 22 | HFC-245fa (CHF2CH2CF3) | 962 | S1 | 962 / 962 | S3; S4 | GWP100 | Confirmado | — | Ninguna. |
| 23 | HFC-365mfc (CH3CF2CH2CF3) | 913 | S1 | 914 / 914 | S3; S4 | GWP100 | Diferencia (no explicada por redondeo) | 913 redondeado a 3 cifras sigue siendo 913, no 914. | Verificar en S1 y en S2. |
| 24 | HFC-43-10mee (código del seeder `HFC-43-10-mee`) | 1599 | S1 | 1600 / 1600 | S3; S4 | GWP100 | Diferencia (precisión) | 1599 → 1600. El código usa un guion adicional respecto a la nomenclatura IPCC. | C1; revisar el código del gas. |
| 25 | SF6 | 25184 | S1 | S3: 25200. S4: 24300 | S3; S4 | GWP100 | Diferencia (entre fuentes) | Es coherente por precisión con S3 (borrador WGI) y **no** con S4 (24300). Ver sección B. | Obtener la versión final de WGI, S1 y S2 antes de decidir. |
| 26 | NF3 | 17423 | S1 | 17400 / 17400 | S3; S4 | GWP100 | Diferencia (precisión) | 17423 → 17400. | C1. |
| — | NH3 (R-717), fuera del seeder | — | — | No publicado | S3; S4 | — | Sin valor identificado | No figura en S3 ni en S4. No es uno de los gases de Kioto ni del GHG Protocol. | Decidir exclusión o reporte fuera del CO2e (C6). |
| — | R-744 (CO2 refrigerante), fuera del seeder | (sería `CO2` = 1) | — | 1 | S3; S4 (fila CO2) | GWP100 | Confirmado como CO2 | Químicamente es CO2. Una fuga se contabilizaría como masa de CO2 con GWP 1, usando el `gas_codigo` CO2 existente. | Aprobar su inclusión en Alcance 1 (C7). |

## A. Resumen (26 gases del seeder)

| Estado | Cantidad | Gases |
|---|---|---|
| Confirmado | 4 | CO2, N2O, HFC-152a, HFC-245fa |
| Diferencia | 19 | 15 de precisión (HFC-143a, CF4, C2F6, C3F8, C4F10, C5F12, C6F14, C7F16, HFC-134a, HFC-125, HFC-227ea, HFC-23, HFC-236fa, HFC-43-10mee, NF3); 2 no explicadas por redondeo (HFC-32, HFC-365mfc); 1 de identificación (c-C4F8); 1 entre fuentes (SF6) |
| Pendiente de verificar | 3 | CH4_BIOGENIC, CH4_FOSSIL_COMBUSTION, CH4_FOSSIL_FUGITIVE_PROCESS |
| Sin valor identificado | 0 | — |
| **Total** | **26** | |

Fuera del seeder: NH3 queda sin valor identificado; R-744 es CO2 (GWP 1).

En `huelladecarbono` existen 8 de estos gases, según el volcado revisado antes (no se volvió a consultar): CO2, los 3 CH4, N2O, HFC-32 (770), HFC-134a (1526) y SF6 (25184). c-C4F8 no está en la base principal.

## B. Discrepancias importantes

**c-C4F8 (13902).** S3 y S4 publican c-C4F8 (PFC-C-318, `cyc(-CF2CF2CF2CF2-)`) = 10200, y octafluorooxolano (c-C4F8O) = 13900. 13902 redondea a 13900, así que es muy probable que se haya tomado la fila de c-C4F8O. No se puede descartar que S1 tenga ese mismo error, porque no se consultó; si lo tuviera, cabría buscarlo en S2. Usar 13902 para c-C4F8 sobrestimaría su CO2e en un 36 %.

**SF6 (25184 / 25200 / 24300).** S3 es el borrador *Final Government Distribution* de WGI y da 25200. S4 dice basarse en la versión final de WGI y da 24300. 25184 es coherente con S3 y no con S4. La causa más probable es un cambio entre el borrador y la versión final de WGI (por ejemplo, una revisión de la vida media o una errata), **pero no está verificado**: no se pudo leer la versión final ni S2. Mientras no se aclare, la contradicción queda abierta y no se elige ningún valor.

**HFC-32 (770 frente a 771) y HFC-365mfc (913 frente a 914).** El redondeo no explica la diferencia. Puede deberse a otro cálculo en S1, a una errata o a un error de transcripción. Hay que verificarlo en S1.

**CH4.** S3 (27.9) no incluye ajustes químicos; S4 (27.0 / 29.8) sí distingue fósil y no fósil con la Tabla 7.15. No son comparables entre sí. La asignación del seeder (biogénico y combustión = 27; fugitivo y proceso = 29.8) coincide con la instrucción de S4, pero no con una tabla original consultada.

**Precisión (15 gases).** El seeder tiene 4 o 5 cifras; S3 y S4 publican 3 cifras significativas. Si S1 publica esas cifras, el seeder es fiel a su fuente declarada y la diferencia con S4 es solo de presentación. Aun así, las cifras no son intercambiables valor por valor.

## C. Decisiones metodológicas pendientes

1. **C1, conjunto de referencia.** Decidir entre WGIII Annex II Table 9 (S1, más cifras) y WGI / GHG Protocol (3 cifras). No se deben mezclar valores de ambas en un mismo `gwp_set`. Si se adopta el GHG Protocol, debería ir en un `gwp_set` nuevo y separado.
2. **C2, c-C4F8.** Confirmar en S1 la fila correcta y aprobar la corrección.
3. **C3, SF6.** Fijar la versión de WGI aplicable (final o borrador) y revisar S2 antes de elegir entre 25184, 25200 y 24300.
4. **C4, HFC-32 y HFC-365mfc.** Confirmarlos en S1 y S2.
5. **C5, CH4.** Aprobar la regla "combustión fósil = non-fossil 27; fugitivo y proceso = fossil 29.8", con su cita original (Tabla 7.15 o Tablas 11–12 de WGIII).
6. **C6, NH3.** Decidir si se excluye del CO2e o se reporta aparte sin GWP.
7. **C7, R-744.** Decidir si las fugas de CO2 refrigerante se contabilizan en Alcance 1 como CO2 con GWP 1.
8. **C8, forma de corregir.** El seeder cancela si un valor existente difiere y los resultados guardan una copia del GWP (`valor_gwp`, `id_gwp_value`, con `ON DELETE RESTRICT`). Hay que decidir si una corrección crea un **nuevo `gwp_set` versionado** (recomendado, porque preserva los cálculos históricos) o si modifica el conjunto actual, lo que en la base principal requeriría un plan aprobado aparte.
9. **C9, código `HFC-43-10-mee`.** Decidir si se alinea con la nomenclatura IPCC (`HFC-43-10mee`) en un conjunto nuevo.

## D. Recomendación técnica (no aplicada)

- **Conservar**: CO2, N2O, HFC-152a, HFC-245fa.
- **Conservar con documentación adicional**: los 15 gases con diferencia de precisión. Basta con verificar en S1 que esas cifras son las publicadas.
- **Requieren decisión explícita antes de usarse**: c-C4F8 (probable error de fila), SF6 (contradicción entre fuentes), HFC-32 y HFC-365mfc (diferencia no explicada) y los 3 CH4 (falta la fuente original y la regla de asignación).
- **Prioridad**: SF6, HFC-32, HFC-134a y CH4 ya existen en la base principal. c-C4F8 solo está en el seeder.
- **Para cerrar la verificación** hacen falta los PDF de S1 y S2, descargados manualmente desde ipcc.ch y guardados en el proyecto.

## E. Archivos consultados

Proyecto (solo lectura):

- `database/seeders/gwp_ar6_seeder.ts`
- `app/services/emissions/gwp_selection.ts`
- `database/migrations/1795600000000_extend_emission_calculation_trace.ts` (estructura de `gwp_set` y `gwp_value` y copia del GWP en los resultados)
- `docs/metodologias_emisiones.md`
- `docs/estado_preparacion_fuentes.md`

Externas: S3 y S4, leídas. S1, S2 y la página del informe `https://www.ipcc.ch/report/ar6/wg3/` (desde donde se localizaron los enlaces de S1 y S2) no permitieron leer los PDF.

No se ejecutaron consultas sobre ninguna base de datos en esta revisión.
