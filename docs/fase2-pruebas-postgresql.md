# Fase 2: preparar y validar el motor en PostgreSQL aislado

Esta guía se limita a una base local exclusiva de pruebas. El archivo `.env.test` y `config/database.ts` requieren `NODE_ENV=test`, destino local en el puerto 5432, usuario `huellacarbono_test` y base `huellacarbono_test`; rechazan la conexión si no coincide. No copies valores `DB_*` productivos en `TEST_DB_*`.

## Preparación

Instala e inicia PostgreSQL local. Con un administrador local, crea una cuenta y base exclusivas:

```sql
CREATE ROLE huellacarbono_test LOGIN PASSWORD 'CAMBIAR_LOCALMENTE';
CREATE DATABASE huellacarbono_test OWNER huellacarbono_test;
```

Guarda la contraseña solo en `.env.test` local como `TEST_DB_PASSWORD`. Antes de ejecutar cualquier comando de Ace, inspecciona solo las variables no secretas:

```powershell
$env:NODE_ENV = 'test'
node -e "console.log({NODE_ENV:process.env.NODE_ENV, TEST_DB_HOST:process.env.TEST_DB_HOST, TEST_DB_PORT:process.env.TEST_DB_PORT, TEST_DB_DATABASE:process.env.TEST_DB_DATABASE, TEST_DB_USER:process.env.TEST_DB_USER})"
```

La salida esperada es `test`, `127.0.0.1`, `5432`, `huellacarbono_test`, `huellacarbono_test`. No imprimas `TEST_DB_PASSWORD`. `config/database.ts` aplica una segunda barrera y rechaza hosts remotos, base/usuario inesperados o el mismo destino configurado en `DB_*`.

## Orden exacto

Ejecuta las migraciones sobre la base de pruebas vacía en el orden cronológico/nombre siguiente. La migración `.disabled` queda excluida:

1. `1761885935168_create_users_table.ts`
2. `1768620764696_create_access_tokens_table.ts`
3. `1794400000000_create_huella_schema.ts`
4. `1794500000000_retarget_access_tokens.ts`
5. `1794600000000_create_permiso_tables.ts`
6. `1794700000000_territorio_organizacion.ts`
7. `1794800000000_add_unidad_medida_permissions.ts`
8. `1794900000000_add_calculo_carbono_permissions.ts`
9. `1794900000000_add_que_se_copia_dato_actividad.ts`
10. `1794910000000_add_dato_actividad_permissions.ts`
11. `1795000000000_add_dato_actividad_carbono_permissions.ts`
12. `1795100000000_add_intensidad_y_reduccion.ts`
13. `1795200000000_create_catalogos_emision.ts`
14. `1795300000000_create_reglas_conversion_importacion.ts`
15. `1795400000000_add_catalogo_emisiones_permissions.ts`
16. `1795500000000_reconcile_catalogo_actividades_emision.ts`
17. `1795600000000_extend_emission_calculation_trace.ts`
18. `1795700000000_add_metodologia_y_trazabilidad_factor.ts`

```powershell
node ace migration:run
```

Después de migrar, comprueba `adonis_schema` y las tablas/columnas antes de seedear. Deben existir, entre otras, `alcance_emision`, `actividad_emision`, `subcategoria_emision`, `fuente_emision`, `actividad_emision_fuente`, `dato_actividad_carbono`, `resultado_carbono`, `factor_emision`, `regla_calculo`, `regla_calculo_parametro`, `conversion_unidad`, `gwp_set` y `gwp_value`. Las FK del puente deben asegurar actividad/fuente/subcategoría; datos y resultados deben referir actividad/fuente válidas; cada resultado debe conservar dato, factor, gas, GWP y metodología/versiones que se aplicaron.

## Seeders, en orden

En una base de pruebas recién migrada, el catálogo documental debe preceder a los GWP. Los roles/territorio solo son necesarios para los escenarios funcionales de autenticación/organización:

```powershell
node ace db:seed --files database/seeders/rol_seeder.ts
node ace db:seed --files database/seeders/territorio_seeder.ts
node ace db:seed --files database/seeders/catalogo_actividades_emision_seeder.ts
node ace db:seed --files database/seeders/gwp_ar6_seeder.ts
```

No uses `caso_roble_seeder` o `caso_guia_empaques_seeder` como evidencia de factores documentados. El seeder GWP almacena potenciales de calentamiento y no factores de emisión por actividad. La tabla [matriz de factores](matriz_disponibilidad_factores_191.csv) deja las 191 fuentes no calculables hasta que haya factores aprobados y referencias verificables.

## Validaciones automáticas

```powershell
node ace test unit
node ace test functional
```

Las pruebas funcionales usan transacción global para revertir sus fixtures de prueba. No ejecutes ninguna prueba con `NODE_ENV=development` ni cambies los guards de `config/database.ts`. El motor necesita catálogo y un factor aprobado por versión/fuente/fecha, con unidades compatibles y GWP explícito para gases individuales.

## Casos numéricos de referencia

La conversión de unidad debe ocurrir antes de multiplicar por factor. La conversión CO2e es `masa de gas × GWP` solo para gases individuales; CO2e directo no recibe GWP otra vez. Casos de aritmética independiente para unit tests o factores sintéticos de una base descartable:

| Entrada de gas | GWP100 usado | Resultado esperado |
| --- | ---: | ---: |
| 2 kg CO2 | 1 | 2 kg CO2e |
| 0.1 kg CH4 biogénico | 27 | 2.7 kg CO2e |
| 0.01 kg N2O | 273 | 2.73 kg CO2e |
| 7.43 kg CO2e directo | no aplica | 7.43 kg CO2e |
| 1 kg CH4 fósil fugitivo/proceso | 29.8 | 29.8 kg CO2e |

La referencia GWP cargada por el seeder es IPCC AR6 WGIII Annex II (2022), GWP100; consulta [la fuente IPCC](https://www.ipcc.ch/report/ar6/wg3/downloads/report/IPCC_AR6_WGIII_Annex-II.pdf). Estos números no sustituyen factores de actividad ni validan una fuente del catálogo.

Prueba además conversión de unidades de igual magnitud, unidades incompatibles, factor vencido/no aprobado/ausente, especie CH4 faltante, ausencia de GWP, dato incompleto, fórmula/regla no soportada, multigas, cálculo idéntico repetido y recálculo después de cambiar dato o factor. Verifica el hash/resultado histórico, que el nuevo cálculo use nueva entrada y que no se dupliquen emisiones al consolidar. Para escenarios de actividad, comprueba A1 combustión fija, A2 combustible y distancia con consumo específico/unidades explícitos, B1 electricidad, C2/C6 transporte y C3 residuos. Refrigerantes requieren gas específico/GWP y factores documentados; no se deben simular como factor disponible del catálogo.

## Resultado y límites

Al final, consulta en esta base de pruebas los conteos del catálogo (3 alcances, 15 actividades, 10 subcategorías, 191 fuentes), integridad de la tabla puente, conteos por gas/GWP, factor y cálculo; inspecciona trazabilidad en `resultado_carbono`. No reportes una metodología o fuente como calculable si no tiene factor aprobado, vigente, con unidad, gas y referencia respaldados. Hasta ejecutar estos pasos localmente, migraciones, seeders y pruebas funcionales siguen pendientes y no se afirma compatibilidad de ejecución contra un servidor PostgreSQL real.
