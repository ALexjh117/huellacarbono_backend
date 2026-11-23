# Importación trazable de factores de emisión

Rutas bajo `/api/v1/factores-emision` (permisos `factor_emision.crear` para escribir y `factor_emision.ver` para consultar):

| Ruta | Efecto |
| --- | --- |
| `POST importaciones` | Evalúa el archivo y guarda la previsualización. No crea factores. |
| `POST importaciones/:id/aplicar` | Revalida y crea los factores válidos en una sola transacción, en estado `PENDIENTE`. |
| `POST importaciones/:id/rechazar` | Cierra la importación sin crear factores. |
| `GET importaciones[?versionId=]`, `GET importaciones/:id` | Consulta, con el resultado de cada fila. |
| `GET cobertura?versionId=` | Estado de las fuentes del catálogo en una versión metodológica. |

## Resultado de cada fila en la previsualización

- `INSERTAR`: cumple todas las reglas del alta de factores y no duplica nada.
- `DUPLICADO`: repite un factor que ya existe (mismo código y fecha de inicio, o mismas condiciones con vigencia superpuesta) o repite otra fila del mismo archivo.
- `RECHAZADO`: formato inválido, falta trazabilidad (fuente bibliográfica, institución, año de publicación o de aplicación), código de catálogo inexistente o unidad incompatible con la metodología de la fuente.

## Estados de la importación

| Estado | Significado |
| --- | --- |
| `PREVISUALIZADA` | Evaluada; todavía no se creó ningún factor. Es el único estado que se puede aplicar o rechazar. |
| `APLICADA` | Se crearon todas las filas del archivo. |
| `PARCIAL` | Se crearon todas las filas `INSERTAR`; el archivo traía filas `DUPLICADO` o `RECHAZADO` **desde la previsualización**, que quedan registradas y nunca generan factores. |
| `RECHAZADA` | Cerrada por una persona sin crear factores. |

## PARCIAL no es una aplicación fallida

`PARCIAL` describe el **contenido del archivo**: la persona vio en la previsualización qué filas se descartaban y decidió aplicar el resto.

Una **aplicación fallida** es otra cosa y no cambia el estado:

1. Antes de escribir, se revalidan todas las filas `INSERTAR` contra la base actual. Si alguna dejó de ser válida (por ejemplo, otro usuario creó un factor equivalente), la solicitud responde `409`, no se crea **ningún** factor y la importación sigue `PREVISUALIZADA`. Hay que previsualizar de nuevo.
2. Las inserciones se hacen en una sola transacción. Si cualquiera falla (incluido el trigger de solapamiento de PostgreSQL ante una carga simultánea), la transacción se revierte completa: no queda ningún factor de esa operación y la importación sigue `PREVISUALIZADA`.

La fila de la importación se bloquea (`SELECT … FOR UPDATE`) durante la aplicación o el rechazo; dos solicitudes simultáneas sobre la misma importación se ejecutan una detrás de otra y la segunda recibe `409`.

## Integridad

- **Hash del contenido**: SHA-256 de la versión y las filas, con claves ordenadas. El mismo contenido no puede previsualizarse dos veces, sin importar el estado de la importación anterior (aplicada, parcial, rechazada o pendiente) ni la referencia o el nombre de archivo.
- Un contenido distinto que repite factores ya cargados obtiene un hash nuevo, pero esas filas salen `DUPLICADO` y no hay nada que aplicar.
- Los factores importados quedan `PENDIENTE`, con `origen` e `id_importacion`. La importación nunca aprueba factores ni modifica factores existentes; la aprobación sigue el flujo normal.

## Cobertura

Recorre todas las fuentes activas del catálogo (191) y, para la versión indicada:

- `CON_FACTOR_APROBADO`: al menos un factor activo, aprobado y vigente en la fecha de consulta.
- `SOLO_PENDIENTES`: ningún aprobado vigente, pero sí factores activos en `BORRADOR` o `PENDIENTE`.
- `SIN_FACTOR`: ni aprobados vigentes ni pendientes. Los aprobados vencidos o futuros se informan aparte en `aprobadosNoVigentes`; los `RECHAZADO` e inactivos no cuentan.

Sólo cuenta factores de la versión consultada. Indica disponibilidad de factores, no que un dato concreto sea calculable: eso depende también de su unidad y parámetros.
