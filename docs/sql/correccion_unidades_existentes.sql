-- Corrección propuesta para unidades existentes en la base principal.
-- NO SE HA EJECUTADO. Requiere aprobación y respaldo previo (pg_dump).
--
-- El respaldo del 2026-11-25 ya tiene el id 31 como UM-KG activo (factor 1)
-- y el id 32 como UM-LB (factor 0.45359237). Este script no modifica esas
-- filas. El metro cúbico estándar queda como volumen en la migración
-- 1796300000000_clasificar_m3st_como_volumen.
--
-- Hallazgos en el respaldo de huelladecarbono (2026-11-23):
--   id 32  LIBRA       LB  MASA  factor_base 1  activa    -> 1 lb = 0.45359237 kg
--   id 31  Kilogramos  kg  Masa  factor_base 1  inactiva  -> correcto pero inactiva;
--          el motor necesita una unidad kg activa con factor 1 para consolidar.
--
-- El script termina en ROLLBACK. Cambie a COMMIT sólo después de revisar la
-- salida de las verificaciones.

BEGIN;

-- 1. Verificar que nada use todavía la libra (si hay filas, revisar antes).
SELECT 'dato_actividad_carbono' AS tabla, count(*) FROM dato_actividad_carbono WHERE id_unidad = 32
UNION ALL SELECT 'factor_emision entrada', count(*) FROM factor_emision WHERE id_unidad_entrada = 32
UNION ALL SELECT 'factor_emision salida', count(*) FROM factor_emision WHERE id_unidad_salida = 32
UNION ALL SELECT 'resultado_carbono', count(*) FROM resultado_carbono WHERE id_unidad = 32 OR id_unidad_original = 32 OR id_unidad_utilizada = 32
UNION ALL SELECT 'conversion_unidad', count(*) FROM conversion_unidad WHERE id_unidad_origen = 32 OR id_unidad_destino = 32;

-- 2. Corregir el factor base de la libra sólo si sigue con el valor erróneo.
UPDATE unidad_medida
   SET factor_base = 0.45359237
 WHERE id_unidad = 32
   AND upper(simbolo) = 'LB'
   AND factor_base = 1;

-- 3. Reactivar el kilogramo existente (decisión pendiente de aprobación).
UPDATE unidad_medida
   SET estado = TRUE
 WHERE id_unidad = 31
   AND lower(simbolo) = 'kg'
   AND factor_base = 1
   AND estado = FALSE;

SELECT id_unidad, codigo, nombre, simbolo, magnitud, factor_base, estado
  FROM unidad_medida
 WHERE id_unidad IN (31, 32);

ROLLBACK;
