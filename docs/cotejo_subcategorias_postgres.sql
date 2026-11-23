-- Solo lectura. Ejecutar con el esquema de huella en search_path.
-- No modifica ni propone actualizar datos. Aprobar documentalmente toda diferencia.
WITH esperado(codigo_fuente, codigo_actividad, codigo_subcategoria) AS (
VALUES
('A2-01','A2','TRANSPORTE-TERRESTRE'),('A2-02','A2','TRANSPORTE-TERRESTRE'),('A2-03','A2','TRANSPORTE-TERRESTRE'),('A2-04','A2','TRANSPORTE-TERRESTRE'),('A2-05','A2','TRANSPORTE-TERRESTRE'),('A2-06','A2','TRANSPORTE-TERRESTRE'),('A2-07','A2','TRANSPORTE-TERRESTRE'),('A2-08','A2','TRANSPORTE-TERRESTRE'),('A2-09','A2','TRANSPORTE-TERRESTRE'),('A2-10','A2','TRANSPORTE-TERRESTRE'),('A2-11','A2','TRANSPORTE-TERRESTRE'),('A2-12','A2','TRANSPORTE-TERRESTRE'),('A2-13','A2','TRANSPORTE-TERRESTRE'),('A2-14','A2','TRANSPORTE-TERRESTRE'),('A2-15','A2','TRANSPORTE-TERRESTRE'),('A2-16','A2','TRANSPORTE-TERRESTRE'),('A2-17','A2','TRANSPORTE-TERRESTRE'),('A2-18','A2','TRANSPORTE-TERRESTRE'),('A2-19','A2','TRANSPORTE-TERRESTRE'),('A2-20','A2','TRANSPORTE-TERRESTRE'),('A2-21','A2','TRANSPORTE-ESPECIAL-PROPIO'),('A2-22','A2','TRANSPORTE-ESPECIAL-PROPIO'),('A2-23','A2','TRANSPORTE-ESPECIAL-PROPIO'),('A2-24','A2','TRANSPORTE-ESPECIAL-PROPIO'),('A2-25','A2','TRANSPORTE-ESPECIAL-PROPIO'),
('A3-01','A3','MINERALES'),('A3-02','A3','MINERALES'),('A3-03','A3','MINERALES'),('A3-04','A3','MINERALES'),('A3-05','A3','MINERALES'),('A3-06','A3','METALURGIA'),('A3-07','A3','METALURGIA'),('A3-08','A3','METALURGIA'),('A3-09','A3','METALURGIA'),('A3-10','A3','METALURGIA'),('A3-11','A3','INDUSTRIA-QUIMICA'),('A3-12','A3','INDUSTRIA-QUIMICA'),('A3-13','A3','INDUSTRIA-QUIMICA'),('A3-14','A3','INDUSTRIA-QUIMICA'),('A3-15','A3','INDUSTRIA-QUIMICA'),('A3-16','A3','INDUSTRIA-QUIMICA'),('A3-17','A3','INDUSTRIA-QUIMICA'),('A3-18','A3','INDUSTRIA-QUIMICA'),('A3-19','A3','OTROS-PROCESOS'),('A3-20','A3','OTROS-PROCESOS'),('A3-21','A3','OTROS-PROCESOS'),('A3-22','A3','OTROS-PROCESOS'),('A3-23','A3','OTROS-PROCESOS'),('A3-24','A3','OTROS-PROCESOS'),('A3-25','A3','OTROS-PROCESOS'),
('A4-01','A4','REFRIGERANTES'),('A4-02','A4','REFRIGERANTES'),('A4-03','A4','REFRIGERANTES'),('A4-04','A4','REFRIGERANTES'),('A4-05','A4','REFRIGERANTES'),('A4-06','A4','REFRIGERANTES'),('A4-07','A4','REFRIGERANTES'),('A4-08','A4','REFRIGERANTES'),('A4-09','A4','SISTEMAS-ELECTRICOS'),('A4-10','A4','SISTEMAS-ELECTRICOS'),('A4-11','A4','SISTEMAS-ELECTRICOS'),('A4-12','A4','PETROLEO-GAS'),('A4-13','A4','PETROLEO-GAS'),('A4-14','A4','PETROLEO-GAS'),('A4-15','A4','PETROLEO-GAS'),('A4-16','A4','PETROLEO-GAS'),('A4-17','A4','AGUAS-RESIDUALES'),('A4-18','A4','AGUAS-RESIDUALES'),('A4-19','A4','AGUAS-RESIDUALES'),('A4-20','A4','AGUAS-RESIDUALES')
),
actual AS (
  SELECT fuente.codigo AS codigo_fuente, actividad.codigo AS codigo_actividad,
         subcategoria.codigo AS codigo_subcategoria,
         actividad_subcategoria.codigo AS actividad_de_subcategoria
  FROM actividad_emision_fuente vinculo
  JOIN fuente_emision fuente USING (id_fuente_emision)
  LEFT JOIN actividad_emision actividad USING (id_actividad_emision)
  LEFT JOIN subcategoria_emision subcategoria USING (id_subcategoria_emision)
  LEFT JOIN actividad_emision actividad_subcategoria
    ON actividad_subcategoria.id_actividad_emision = subcategoria.id_actividad_emision
)
SELECT 'RESUMEN' AS tipo, 'TOTAL_FUENTES_EN_POSTGRES' AS codigo,
       (SELECT count(*) FROM fuente_emision)::text AS detalle
UNION ALL
SELECT 'RESUMEN','ASIGNACIONES_DOCUMENTALES',count(*)::text FROM esperado
UNION ALL
SELECT 'RESUMEN','VINCULOS_ACTUALES',count(*)::text FROM actual
UNION ALL
SELECT 'RESUMEN','VINCULOS_CON_SUBCATEGORIA',count(*)::text FROM actual WHERE codigo_subcategoria IS NOT NULL
UNION ALL
SELECT 'DISCREPANCIA', e.codigo_fuente,
       CASE WHEN count(a.codigo_fuente) = 0 THEN 'VINCULO_DOCUMENTADO_AUSENTE'
            WHEN bool_or(a.codigo_actividad IS DISTINCT FROM e.codigo_actividad) THEN 'ACTIVIDAD_INCORRECTA'
            WHEN bool_or(a.codigo_subcategoria IS DISTINCT FROM e.codigo_subcategoria) THEN 'SUBCATEGORIA_INCORRECTA'
            ELSE 'OK' END
FROM esperado e LEFT JOIN actual a USING (codigo_fuente)
GROUP BY e.codigo_fuente, e.codigo_actividad, e.codigo_subcategoria
HAVING count(a.codigo_fuente) = 0
    OR bool_or(a.codigo_actividad IS DISTINCT FROM e.codigo_actividad)
    OR bool_or(a.codigo_subcategoria IS DISTINCT FROM e.codigo_subcategoria)
UNION ALL
SELECT 'VINCULO_EXTRA', a.codigo_fuente,
       concat_ws('/', a.codigo_actividad, coalesce(a.codigo_subcategoria, '(sin subcategoría)'))
FROM actual a JOIN esperado e USING (codigo_fuente)
WHERE a.codigo_actividad IS DISTINCT FROM e.codigo_actividad
   OR a.codigo_subcategoria IS DISTINCT FROM e.codigo_subcategoria
UNION ALL
SELECT 'CODIGO_FUENTE_DUPLICADO', codigo_fuente, count(*)::text
FROM actual GROUP BY codigo_fuente HAVING count(*) > 1
UNION ALL
SELECT 'SUBCATEGORIA_DE_OTRA_ACTIVIDAD', codigo_fuente,
       concat_ws('/', codigo_actividad, codigo_subcategoria, actividad_de_subcategoria)
FROM actual
WHERE codigo_subcategoria IS NOT NULL
  AND actividad_de_subcategoria IS DISTINCT FROM codigo_actividad
UNION ALL
SELECT 'CODIGO_FUERA_DE_FAMILIAS_DOCUMENTALES', a.codigo_fuente,
       concat_ws('/', a.codigo_actividad, coalesce(a.codigo_subcategoria, '(sin subcategoría)'))
FROM actual a
WHERE a.codigo_fuente !~ '^(A1|A2|A3|A4|A5|B1|C[0-9]+)-[0-9]{2}$'
ORDER BY 1, 2, 3;
