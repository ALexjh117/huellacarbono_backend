# Cierre integral del backend de huella de carbono

## Diagnóstico del repositorio

- Rama: `reconstruccion-factores-emision-limpia`; HEAD al iniciar: `1d3faae`.
- El árbol de trabajo ya contenía modificaciones y archivos nuevos en catálogo, factores, cálculo, migraciones, configuración y pruebas. Se conservaron sin revertir ni sustituir.
- Evidencia local: catálogo y matriz contienen 191 fuentes; 70 asignaciones documentales de subcategoría (A2-01–A2-25, A3-01–A3-25, A4-01–A4-20). La matriz indica que el resto no tiene subcategoría asignada.
- El reporte previo de estado indica 141 vínculos sin subcategoría / 50 clasificados en PostgreSQL. No se conectó a la base: la diferencia aritmética es 20, pero no se conocen los códigos concretos hasta ejecutar `cotejo_subcategorias_postgres.sql`.
- La matriz no acredita factores de actividad oficiales: sus filas declaran que no fueron localizados en archivos y que la base no fue consultada. No hay fuentes habilitadas para cálculo real sobre evidencia inspeccionada.

## Correcciones preparadas

`FactorEmisionService` comprueba duplicidad para el mismo contexto de versión, fuente, unidad de entrada, gas/especie, región, sector y año de aplicación. Región y sector normalizan mayúsculas/minúsculas, espacios iniciales/finales y secuencias de espacios. Las vigencias inclusivas se consideran solapadas cuando inicio A ≤ fin B y viceversa. Crear y actualizar pasan las mismas dimensiones. Se añadió un caso unitario para diferenciar candidatos por sector, año y región. El selector conserva el rechazo de ambigüedad por gas y no inventa precedencia genérico/específico.

El seeder existente es idempotente respecto a coincidencias exactas: no actualiza silenciosamente nombres, clasificaciones ni relaciones divergentes; aborta su transacción al encontrarlas. El SQL de cotejo ahora muestra resumen, faltantes documentados, actividades/subcategorías distintas, vínculos duplicados, subcategorías de otra actividad y códigos fuera de la lista comparada. No escribe.

## Hallazgos y límites

- `1795600000000_extend_emission_calculation_trace` define un trigger que no incluye sector ni año de aplicación en su llave de solapamiento; además su verificación previa no incluye especie. Puede rechazar factores legítimos o detectar duplicados de forma distinta al servicio. Se dejó intacta porque puede estar aplicada y no debe editarse una migración histórica.
- `1795700000000_add_metodologia_y_trazabilidad_factor` está presente como migración nueva en el árbol local. El estado de aplicada/pendiente solo puede conocerse consultando `adonis_schema` en cada base. Sus precondiciones verifican esquema y trazabilidad de factores aprobados.
- Las metodologías identificadas en código: A1 combustión fija genérica; A2 móvil con consumo específico explícito cuando convierte distancia a combustible; A3 proceso general; A4 emisión fugitiva sobre cantidad cuantificada; A5 agricultura general; B1 electricidad por energía; C1 bienes/servicios; C2 y C6 transporte; C3 residuos; C4 viajes; C5 movilidad; C7 uso de productos; C8 fin de vida; C13 activos arrendados. Estar enrutada en el motor no equivale a metodología completa: varias requieren ecuaciones y parámetros específicos que no están implementados. Location/market-based tampoco está diferenciado como selección metodológica.
- La selección existente filtra versión, fuente, activo/aprobado, vigencia, año, región y sector, exige compatibilidad de unidad y rechaza más de un candidato para un gas. Las filas sin factor compatible se omiten con razón. CO2e directo no recibe GWP otra vez; los gases individuales requieren GWP versionado.
- No se ejecutaron comandos de prueba, migración, seeder ni consultas a PostgreSQL, según la instrucción. No se declara ninguna prueba ejecutada/pasada.

## Conciliación y operación manual

Resumen documental verificable: 191 fuentes; 70 asignaciones; distribución: A2 terrestre 20, A2 transporte especial propio 5, A3 minerales 5, metalurgia 5, industria química 8, otros procesos 7, A4 refrigerantes 8, sistemas eléctricos 3, petróleo/gas 5 y aguas residuales 4. PostgreSQL: último dato reportado antes de esta revisión, 141 vínculos sin subcategoría y 50 con subcategoría; se debe confirmar. La lista de 20 no puede determinarse sin la salida SQL. Las demás 121 fuentes no tienen asignación de subcategoría documentada: cualquier relación existente para ellas requiere aprobación, no eliminación automática.

Después de revisar cada fila de salida del SQL y aprobar las diferencias con evidencia documental, preparar un plan SQL manual acotado por IDs y probarlo primero en base aislada. El seeder solo inserta faltantes y aborta si encuentra relación existente incompatible; no reconcilia relaciones erróneas existentes automáticamente. No ejecutar el seeder en producción como sustituto de aprobación.

## Guía única de validación manual (PowerShell)

Ejecutar desde `C:\Users\SOFIA\huellacarbono_backend`. No ejecutar migraciones o seeders contra producción.

### 1. Git: proteger y reconocer el estado inicial

```powershell
git status --short --branch
git log -1 --oneline
git diff --stat
git ls-files --others --exclude-standard
```

Esperado: rama/commit indicados arriba y lista de cambios preexistentes más estos artefactos. Revise que sus modificaciones locales estén presentes; no use comandos de descarte.

### 2. PostgreSQL: confirmar destino antes de conectar

```powershell
$env:NODE_ENV = 'test'
node -e "console.log({NODE_ENV:process.env.NODE_ENV, TEST_DB_HOST:process.env.TEST_DB_HOST, TEST_DB_PORT:process.env.TEST_DB_PORT, TEST_DB_DATABASE:process.env.TEST_DB_DATABASE, TEST_DB_USER:process.env.TEST_DB_USER})"
```

Esperado: `test`, `127.0.0.1`, `5432`, `huellacarbono_test`, `huellacarbono_test`. No mostrar la contraseña. Si un valor difiere o coincide con `DB_*` productivo, detenerse y corregir el entorno local antes de usar Ace.

### 3. Respaldo

En una consola PowerShell con cliente PostgreSQL y acceso al destino que se vaya a respaldar:

```powershell
$env:PGHOST = '127.0.0.1'
$env:PGPORT = '5432'
$env:PGUSER = 'USUARIO_LOCAL'
$env:PGDATABASE = 'BASE_LOCAL'
$backup = Join-Path $env:TEMP ("huella-{0:yyyyMMdd-HHmmss}.dump" -f (Get-Date))
pg_dump --format=custom --no-owner --file=$backup
if ($LASTEXITCODE -ne 0) { throw 'pg_dump falló; no continuar' }
pg_restore --list $backup | Select-Object -First 10
```

Reemplace solo por credenciales/nombre locales revisados; `pg_dump` pide contraseña interactivamente si aplica. Debe existir el archivo y `pg_restore --list` mostrar su índice. Si falla, no continúe ni sobrescriba el único respaldo.

### 4. Conciliación del catálogo (consulta de solo lectura)

Desde la raíz del repositorio, conecte con `psql` a la base objetivo revisada y ejecute:

```powershell
psql -X -v ON_ERROR_STOP=1 -d 'BASE_LOCAL' -f docs/cotejo_subcategorias_postgres.sql
```

Use un servicio/usuario local apropiado o variables `PGHOST`, `PGPORT`, `PGUSER`; no escriba contraseñas en el comando. Esperado: resumen y filas etiquetadas como discrepancia. Guarde la salida. Identifique las veinte asignaciones documentadas que falten/estén mal solo después de comparar cada código con la matriz y `app/data/catalogo_actividades_emision.ts`. Los códigos adicionales y vínculos duplicados requieren revisión individual; no los borre ni reasigne sin aprobación.

### 5. Estado de migraciones sin aplicarlas

```powershell
node ace migration:status
```

Ejecutar solo después de confirmar que las variables `test` apuntan a la base aislada. Revise el estado de ambas migraciones `179560...` y `179570...`; no deduzca la aplicación por presencia del archivo. Si el estado reporta historial/esquema parcial, detenerse y comparar con respaldo y columnas antes de decidir.

### 6. Base aislada y migraciones

Crear una base local exclusiva vacía mediante el administrador PostgreSQL local. Ejemplo interactivo en `psql` (cambiar contraseña local):

```sql
CREATE ROLE huellacarbono_test LOGIN PASSWORD 'CAMBIAR_LOCALMENTE';
CREATE DATABASE huellacarbono_test OWNER huellacarbono_test;
```

Configurar `.env.test` solo con valores locales ya existentes/revisados; no editarla para hacer pasar pruebas. Confirmar la salida del paso 2. Cuando el equipo autorice aplicar cambios en la base desechable:

```powershell
node ace migration:run
node ace migration:status
```

Esperado: migraciones habilitadas terminadas y status consistente. La migración `179520...disabled` se excluye. Si falla una precondición en `179560/179570`, detenerse y guardar el error; no improvisar rollback ni edición de historial.

### 7. Seeders en base aislada

```powershell
node ace db:seed --files database/seeders/rol_seeder.ts
node ace db:seed --files database/seeders/territorio_seeder.ts
node ace db:seed --files database/seeders/catalogo_actividades_emision_seeder.ts
node ace db:seed --files database/seeders/gwp_ar6_seeder.ts
```

Esperado: carga sin conflicto; un conflicto de catálogo es una señal para inspeccionar y no sobrescribir. GWP AR6 no es factor de actividad. No usar seeders de escenarios como evidencia oficial.

### 8. Pruebas unitarias y funcionales

```powershell
node ace test unit
node ace test functional
```

Ejecutar únicamente con `NODE_ENV=test` y la base aislada. Esperado: código de salida 0 y todos los grupos verdes. Si una prueba falla, conservar salida, nombre del test y versión de PostgreSQL; no cambiar configuraciones ni ejecutar en desarrollo/productivo.

### 9. Cálculo manual y trazabilidad

En la aplicación de pruebas, preparar factores sintéticos solo en esa base, identificados como fixtures y nunca como evidencia oficial. Comprobar: factor pendiente/inactivo/vencido/no compatible no calcula; año/versión determinan candidato; ambigüedad genérico-específico se omite; A2 distancia exige consumo y unidades; CO2/CH4/N2O convierte a CO2e una vez con GWP del set; CO2e directo no vuelve a multiplicarse por GWP. Inspeccionar `resultado_carbono` y verificar dato, factor, gas/especie, cantidad, unidad, GWP, metodología, años y origen snapshot. Sin factor oficial, ninguna fuente se declara calculable.

### 10. Verificación final

Volver a ejecutar el SQL de cotejo y revisar conteos del catálogo (3 alcances, 15 actividades, 10 subcategorías, 191 fuentes), duplicados y FK de relaciones. Inspeccionar `adonis_schema` y las columnas de trazabilidad de resultados en la base aislada. Fase validada solo si catálogo concilia o tiene excepciones aprobadas, pruebas terminan sin error, migraciones tienen estado consistente y cada resultado de cálculo conserva trazabilidad reproducible.

## Estado de cierre

- **COMPLETADO:** comparación documental de 191 fuentes y 70 asignaciones; endurecimiento idempotente del seeder ya existente; corrección de dimensiones en validación de duplicidad del servicio; SQL de cotejo de solo lectura; reglas de ambigüedad conservadas; documentación de metodologías reales y límites.
- **PENDIENTE DE VALIDACIÓN MANUAL:** códigos concretos de las 20 diferencias en PostgreSQL, estado de migraciones en cada base, ejecución de seeders y suite automatizada, integridad/trazabilidad en PostgreSQL.
- **PENDIENTE DE DOCUMENTACIÓN:** factores oficiales para las 191 fuentes; detalles de gas/unidad/vigencia/región/sector/parámetros y fuentes bibliográficas.
- **BLOQUEADO:** declarar fuentes calculables para A3/A4/A5, métodos B1 diferenciados, C1-C8/C13 específicos sin ecuaciones/parámetros/factores respaldados; compatibilidad completa del trigger histórico `179560...` con sector/año/especie sin una decisión de migración segura.

Archivos tocados en esta revisión: `app/services/factor_emision_service.ts` (dimensiones de solapamiento), `tests/unit/emissions_calculation.spec.ts` (escenarios de contexto), `docs/cotejo_subcategorias_postgres.sql` (cotejo solo lectura), `docs/cierre_integral_backend.md` (informe y guía). No se tocó PostgreSQL, migraciones, frontend ni configuración.
