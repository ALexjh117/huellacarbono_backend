# Estado de preparación de las fuentes

## Clasificación operativa

- **191/191 preparadas para configuración del catálogo:** tienen código y clasificación documental en `docs/matriz_disponibilidad_factores_191.csv`. Esto significa que se pueden asociar datos de método/factor cuando haya respaldo; no significa que puedan calcularse hoy.
- **191/191 requieren factor verificable:** no se localizaron factores de actividad aprobados con bibliografía, unidad, gas y vigencia en los archivos del proyecto.
- **0/191 habilitadas para cálculo real:** no hay registros `factor_emision` en el estado de base informado y la matriz mantiene todas las filas como no calculables.
- **Revisión metodológica adicional:** A3, A4, A5, C1-C8 y C13 requieren identificar la fuente de factor y parámetros/límites específicos. La multiplicación común del motor no implementa por sí sola procesos, fugas, AFOLU, tratamiento de residuos, transporte t·km, uso/fin de vida o asignación de arrendamientos.
- **Parámetros condicionales:** A2 por distancia requiere consumo específico y unidades de distancia/combustible explícitos; entradas directas de combustible no requieren derivar consumo desde distancia. Agricultura, residuos, transporte, viajes, movilidad y refrigerantes requieren datos propios del método/factor y siguen sin estar habilitados.
- **Subcategorías por cotejar:** la matriz tiene subcategoría para 70 fuentes de A2/A3/A4 y deja 121 sin subcategoría en las otras actividades. El estado de base informado indica 141 vínculos sin subcategoría, es decir, 50 con clasificación; queda una diferencia de 20 vínculos frente a la matriz. No se reasignó ni normalizó ninguno. Se requiere una consulta de solo lectura y comparación fila por fila antes de reparar relaciones.

## Criterio de habilitación

Una fuente pasa a calculable únicamente con factor aprobado, referencia documental identificable, institución/responsable, año de publicación y aplicación, vigencia, región/sector cuando aplique, unidades correctas, gas/especie y regla/metodología ejecutable para esa categoría. La aprobación de un registro de factor no vuelve automáticamente calculable una fuente si faltan requisitos metodológicos o parámetros. No usar fixtures sintéticas de las pruebas ni GWP como factores de actividad.
