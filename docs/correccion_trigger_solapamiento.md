# Corrección del trigger de solapamiento de factores

## Compatibilidad y orden

La nueva migración es `1795800000000_fix_factor_emision_overlap_dimensions.ts`; su timestamp es posterior a `1795700000000_add_metodologia_y_trazabilidad_factor.ts`, por lo que se aplica después en el orden natural de Adonis/Lucid.

Compatibilidad verificada por inspección del código (sin conexión a PostgreSQL):

- `179560` agrega `factor_emision.gas_especifico VARCHAR(80)` y `sector_categoria VARCHAR(150)`, y crea el trigger/función históricos.
- `179570` requiere y valida `factor_emision.anio_aplicacion INTEGER` antes de añadir sus restricciones.
- La nueva migración comprueba tipos/ancho de todas las dimensiones; si `179570` no fue aplicada o el esquema difiere, falla con un mensaje indicando las columnas incompatibles antes de reemplazar el trigger.
- Contexto confirmado por el equipo: `179560` está aplicada; `179570` debe tratarse como pendiente hasta verificar el estado. La migración correctiva no marca ni presupone que `179570` se aplicó; depende de que su ejecución anterior concluya correctamente.

No se revisó el estado de la base desde esta tarea y no se ejecutó ninguna migración.

## Regla de equivalencia

Se consideran iguales los contextos con iguales versión, fuente, unidad de entrada, gas, especie (recortada), región y sector normalizados (trim, espacios repetidos colapsados y minúsculas), y año de aplicación con semántica `IS NOT DISTINCT FROM` para nulos. Las fechas son intervalos inclusivos: dos factores solapan si cada inicio es menor o igual al fin del otro; un fin nulo equivale a infinito.

El servicio ahora preserva `anioAplicacion: null` como una actualización explícita a nulo durante la validación y el guardado; omitir el campo sí conserva el valor anterior.

El trigger corre para INSERT y UPDATE de todas las columnas de la regla, incluyendo `sector_categoria` y `anio_aplicacion`. La exclusión por `id_factor_emision` permite actualizar el registro sin que se encuentre a sí mismo. El bloqueo advisory se calcula de la serialización JSON de todas las dimensiones de contexto, incluidos sector y año, antes de comprobar solapamientos; así inserciones concurrentes del mismo contexto comparten bloqueo, y sectores/años distintos pueden coexistir.

No se cambió la política de aprobación: el trigger mantiene la misma cobertura que el anterior y no añade una condición por estado de aprobación. Los candidatos ambiguos del motor siguen rechazándose por la lógica de selección existente; esta restricción CRUD solo impide duplicados equivalentes con vigencia solapada.

## Pruebas preparadas

Se amplió el caso funcional CRUD de factores en `tests/functional/catalogos.spec.ts`. Los escenarios comprueban sectores y años distintos, solapamiento duplicado, vigencias adyacentes no solapadas, normalización de región, dimensiones nulas, autoactualización, cambios de sector/año y dos altas concurrentes con el mismo contexto (se espera una respuesta exitosa y una respuesta de conflicto). La suite funcional usa transacción global Japa; el escenario concurrente debe confirmarse en PostgreSQL aislado porque la forma de propagar esa transacción a las solicitudes HTTP depende del runner.

La prueba unitaria del motor de cálculo en `tests/unit/emissions_calculation.spec.ts` permanece separada: comprueba que varios candidatos para el mismo gas se rechazan por ambigüedad. No se usa como prueba del trigger.

## Validación manual desde Git Bash

Desde la raíz del repositorio:

```bash
git status --short --branch
git diff --check
git diff -- database/migrations/1795800000000_fix_factor_emision_overlap_dimensions.ts tests/functional/catalogos.spec.ts docs/correccion_trigger_solapamiento.md
```

Confirme que la rama sigue siendo `reconstruccion-factores-emision-limpia`, que siguen presentes los cambios previos y que `git diff --check` no informa whitespace. Esta inspección no conecta a la base.

Después, con respaldo y destino de pruebas aislado confirmados por el equipo, desde la misma carpeta:

```bash
NODE_ENV=test node ace migration:status
NODE_ENV=test node ace migration:run
NODE_ENV=test node ace migration:status
NODE_ENV=test node ace test functional --files tests/functional/catalogos.spec.ts
NODE_ENV=test node ace test unit --files tests/unit/emissions_calculation.spec.ts
```

El comando de estado debe mostrar `179570` aplicada antes de `179580`; `migration:run` debe aplicar solo las pendientes, incluida la nueva corrección. Las pruebas requieren la base exclusiva `huellacarbono_test` protegida por `config/database.ts`. Si una guardia rechaza el entorno o cualquier migración falla, detenerse; no ejecutar contra la base `huelladecarbono` ni usar rollback. Los nombres/opciones `--files` pueden depender de la versión CLI de Ace instalada; confirmar `node ace test --help` antes si Ace rechaza la opción.

Para verificar específicamente la concurrencia, el test debe terminar con exactamente un `200` y un `409`. Si ambas solicitudes pasan o ambas fallan, guardar la salida y revisar la transacción del runner/trigger en esa versión de PostgreSQL antes de considerar cerrada la corrección.
