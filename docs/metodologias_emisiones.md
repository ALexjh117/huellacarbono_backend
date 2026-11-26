# Cobertura real de metodologías de emisión

Este documento distingue la lógica que el código ejecuta de las metodologías que solo están clasificadas por actividad. No se considera una metodología completa por estar incluida en `METHOD_BY_ACTIVITY`.

## Lógica común que sí existe

El servicio convierte la cantidad de actividad a la unidad de entrada del factor cuando ambas unidades tienen magnitud compatible, multiplica cantidad por factor y exige salida de masa. Para factores por gases individuales, convierte masa de gas a CO2e con un GWP asociado explícitamente a la versión; un factor CO2e directo evita esa segunda multiplicación. Los factores deben estar aprobados, activos, vigentes en la fecha del dato y corresponder a la fuente y versión. La conversión de masa/unidad no identifica por sí misma que un factor corresponda al combustible, tecnología, geografía, tratamiento o categoría concreta.

Las ecuaciones ejecutadas por el motor son las siguientes, condicionadas a que el factor aprobado ya corresponda a la fuente, categoría, gas, geografía, periodo y unidad que se registraron:

- **Factor por gas:** `emisión_gas = cantidad_actividad_convertida × factor_gas`.
- **CO₂e de un gas:** `emisión_CO₂e = emisión_gas × GWP(gas, especie, conjunto_versionado)`.
- **Factor expresado directamente como CO₂e:** `emisión_CO₂e = cantidad_actividad_convertida × factor_CO₂e`; no se vuelve a aplicar GWP.
- **A2 registrada por distancia con factor por combustible:** `consumo_combustible = distancia_convertida × consumo_específico`; ese consumo se convierte a la unidad del factor antes de multiplicar.
- **A2 con factor por distancia:** la distancia se convierte a la unidad del denominador del factor y se multiplica directamente.

Estas ecuaciones no habilitan automáticamente las 191 fuentes. Se rechaza u omite una fuente si no hay factor aprobado, vigente, compatible y sin ambigüedad, o si faltan los parámetros que esa fuente requiera.

Los resultados agregados exponen CO₂e por alcance, fuente, actividad, subcategoría y gas/especie. Cada línea conserva además la masa calculada por gas y su unidad; la suma del total se hace sobre valores CO₂e normalizados a la unidad de masa base del cálculo.

IPCC describe el método básico de actividad por factor, pero señala requisitos adicionales por categoría, combustible, gas y tier. Por tanto, la multiplicación común no sustituye esos requisitos. Referencias: [IPCC 2006, Volumen 2, combustión estacionaria](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_2_Ch2_Stationary_Combustion.pdf), [combustión móvil](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_3_Ch3_Mobile_Combustion.pdf), [Volumen 4, AFOLU](https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html) y [Volumen 5, residuos](https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol5.html).

## Estado por actividad

| Actividad | Lo que ejecuta el motor hoy | Requisitos para una implementación específica | Estado |
| --- | --- | --- | --- |
| A1 combustión fija | Producto de consumo de combustible y factor compatible; no distingue tecnología de combustión. | Factor por combustible y gas, unidad documentada; conversiones masa/volumen a contenido energético cuando el factor está expresado por energía; parámetros de oxidación/tecnología cuando el método/factor los requiere. | Cálculo condicional a factor documentado; método IPCC completo no implementado. |
| A2 combustión móvil | Consumo de combustible×factor; un factor cuyo denominador sea distancia convierte distancia directamente, mientras un factor por combustible requiere consumo específico y unidades explícitas para derivar consumo. | Distinguir tipo de vehículo/combustible/tecnología; para CH4 y N2O pueden aplicar datos de distancia y factores por clase de vehículo/carretera. | Conversiones por unidad de distancia o combustible implementadas; factores/categorías vehiculares y ecuaciones por gas pendientes. |
| A3 procesos industriales | Producto de cantidad con factor compatible. | Fórmula y balance material por proceso/producto, contenido de carbono, producción u otros parámetros según proceso y fuente. | Solo método general; ecuaciones de proceso pendientes. |
| A4 emisiones fugitivas | Producto de cantidad liberada con factor compatible; conserva gas específico y GWP. | Para refrigerantes, gas exacto y masa emitida (p. ej. reposición/fuga medida o balance documentado); para petróleo/gas u otras fuentes, metodología de fuente y parámetros propios. | No estima fugas ni tasas; solo podría usar masa ya cuantificada y un factor documentado. |
| A5 agricultura/uso del suelo | Producto de actividad por factor compatible. | Categoría de suelo/ganado/cultivo, clima y gestión según método; áreas, existencias, entradas de N u otros parámetros. No hay modelos de suelo, ganado, cambio de existencias ni remociones. | No implementado como metodología AFOLU específica. |
| B1 electricidad | Producto de energía y factor; el filtro regional actual limita región a CO/COLOMBIA si el factor declara región. | Factor de red apropiado a ubicación y periodo para método location-based; método market-based requiere instrumentos/proveedor y criterios de calidad; prevenir doble conteo y mantener método identificado. | Cálculo por factor compatible disponible; selección y reporte Scope 2 location/market no implementados como métodos diferenciados. Referencia: [GHG Protocol Scope 2, capítulo 6](https://ghgprotocol.org/sites/default/files/standards/Scope%202%20Guidance_Final_Sept26.pdf). |
| C1 bienes y servicios | Producto de unidad de compra/actividad por factor compatible. | Cantidad o gasto, límites cradle-to-gate, proveedor/producto, asignación, moneda/año si factor monetario. | No hay cálculo económico ni análisis de ciclo de vida; requiere factor con base exacta compatible. |
| C2/C6 transporte | Producto de una medida de transporte/distancia por factor si unidades son compatibles. | Para factor t·km, toneladas de carga×distancia; tipo de vehículo/modo, carga, trayecto y viajes vacíos cuando lo requiera la fuente. | No deriva t·km, carga o modo; no implementar como cálculo genérico de distancia. |
| C3 residuos | Producto de masa/volumen tratado por factor compatible. | Tipo y composición de residuo, método de tratamiento, destino, degradabilidad/captura y horizonte cuando la guía aplica; rellenos sanitarios pueden necesitar modelo de decaimiento de primer orden. | No hay modelo de metano de relleno, tratamiento biológico, incineración ni aguas residuales. Referencia: [IPCC 2006, Volumen 5](https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol5.html). |
| C4 viajes/C5 movilidad | Producto de distancia/unidad de transporte por factor compatible. | Modo, clase, distancia, ocupación y/o pasajero-km según unidad del factor. | No estima distancia, ocupación ni combina segmentos; solo factor en unidad idéntica o convertible. |
| C7 uso de productos | Producto de actividad por factor compatible. | Vida útil, perfil de uso, energía/combustible, fase cubierta y asignación al producto. | No hay modelo de uso de producto. |
| C8 fin de vida | Producto de masa/volumen por factor compatible. | Material, destino, tratamiento, recuperación/reciclaje y método de asignación documentado. | No hay modelo de fin de vida; requiere factor específico por tratamiento. |
| C13 activos arrendados | Producto de actividad por factor compatible. | Límite organizacional, datos de energía/combustible y método de asignación/control; prevenir solapamiento con alcances 1/2. | No hay lógica de límites ni asignación. |

## Condiciones para declarar una fuente calculable

La matriz de 191 fuentes no contiene factores verificados en archivos del proyecto. El seeder GWP contiene potenciales GWP AR6, que no son factores de actividad. Una fuente solo podrá habilitarse con factor aprobado y trazable a documento/versión/año/vigencia, unidad exacta, gas o especies, geografía/tecnología/tratamiento pertinentes, límites y parámetros requeridos. Para metodologías no implementadas arriba, se requiere además codificar y probar la ecuación específica antes de marcar calculable. Los datos insuficientes se rechazan o se omiten con motivo explícito; no se sustituuyen por la multiplicación genérica.

## Selección de factores y ambigüedad

El cálculo filtra factores por versión metodológica y fuente exactas, estado activo, aprobación `APROBADO`, inicio/fin de vigencia y año de aplicación (el año del dato o año nulo). Después excluye regiones distintas de `CO`/`COLOMBIA` y categorías sectoriales que no coincidan con el sector económico de la organización. La unidad de actividad se convierte a la unidad de entrada del factor únicamente si la conversión documentada es compatible; la unidad de salida debe ser masa. La categoría funcional queda representada actualmente por la fuente y el código de actividad; no hay un selector independiente de tecnología o proceso.

No se encontró en la documentación del proyecto una regla que establezca precedencia entre un factor genérico y uno regional/sectorial específico. El motor no debe inferirla: cuando sobreviven dos candidatos para la misma especie de gas, omite el dato por ambigüedad. Esa regla puede hacer que una combinación genérico + específico no calcule; resolverlo requiere una decisión metodológica documentada sobre precedencia y alcance. La región también está limitada actualmente a Colombia (`CO`/`COLOMBIA`), no a una ubicación específica de la sede.

El cotejo de catálogo/base está preparado en [`cotejo_subcategorias_postgres.sql`](cotejo_subcategorias_postgres.sql). Contiene los 191 códigos del catálogo fuente y devuelve fuentes o vínculos ausentes y diferencias de actividad/subcategoría. Solo consulta; no modifica datos. No se puede enumerar aquí cuáles son las 20 relaciones de diferencia sin ejecutar esa consulta de lectura en la base y revisar su salida.
