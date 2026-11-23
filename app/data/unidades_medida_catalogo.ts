/**
 * Catálogo de unidades de medida que requiere el módulo de huella de carbono.
 *
 * `factorBase` indica cuántas unidades base equivale UNA unidad de la fila.
 * Las unidades base de cada magnitud son coherentes entre sí para que las
 * conversiones con parámetros sean exactas:
 *
 *   Masa kg · Volumen L · Energía MJ · Distancia m · Área m² · Tiempo s
 *   Densidad kg/L · Poder calorífico másico MJ/kg · volumétrico MJ/L
 *
 * Todos los factores son equivalencias de definición (SI o definiciones
 * legales exactas), no factores de emisión:
 * - 1 lb = 0,45359237 kg (definición internacional de 1959).
 * - 1 gal EE. UU. = 3,785411784 L (231 in³ exactas).
 * - 1 bbl de petróleo = 42 gal EE. UU. = 158,987294928 L.
 * - 1 ft³ = 28,316846592 L (pie internacional = 0,3048 m).
 * - 1 kWh = 3,6 MJ; 1 MMBtu = 1 055,05585262 MJ (Btu de la tabla internacional).
 * - 1 milla náutica = 1 852 m.
 *
 * Por qué existe cada grupo (documento "Listado de actividades por Alcance"):
 * - Masa: combustibles sólidos y biomasa (A1), refrigerantes y SF6 (A4),
 *   fertilizantes (A5), materiales comprados (C1) y residuos (C3, C8).
 * - Volumen: combustibles líquidos y gaseosos (A1, A2), venteo de gas (A4).
 * - Energía: electricidad (B1) y combustibles expresados en energía (A1).
 * - Distancia: transporte y movilidad (A2, C2, C4, C5, C6).
 * - Área: uso del suelo (A5) y edificios arrendados (C13).
 * - Tiempo: horas de operación de equipos y días de teletrabajo (A2, C5).
 * - Transporte de carga / pasajeros: t·km (C2, C6) y pasajero·km (C4, C5).
 *   Son magnitudes separadas porque no se pueden convertir entre sí.
 * - Producción: productos vendidos o equipos contados por unidad (C7).
 * - Hospedaje: noches de hotel (C4 hotel).
 * - Densidad y poder calorífico: parámetros para pasar de volumen a masa o a
 *   energía. El catálogo sólo trae sus unidades, nunca sus valores.
 *
 * Unidades monetarias (COP, USD) no se incluyen: convertir entre monedas
 * exige una tasa de cambio fechada, no un factor base fijo.
 */
export type UnidadCatalogo = {
  codigo: string
  nombre: string
  simbolo: string
  magnitud: string
  factorBase: string
}

export const UNIDADES_MEDIDA_CATALOGO: readonly UnidadCatalogo[] = [
  // Masa (base kg)
  { codigo: 'UM-KG', nombre: 'Kilogramo', simbolo: 'kg', magnitud: 'Masa', factorBase: '1' },
  { codigo: 'UM-G', nombre: 'Gramo', simbolo: 'g', magnitud: 'Masa', factorBase: '0.001' },
  {
    codigo: 'UM-T',
    nombre: 'Tonelada métrica',
    simbolo: 't',
    magnitud: 'Masa',
    factorBase: '1000',
  },
  { codigo: 'UM-LB', nombre: 'Libra', simbolo: 'lb', magnitud: 'Masa', factorBase: '0.45359237' },

  // Volumen (base L)
  { codigo: 'UM-L', nombre: 'Litro', simbolo: 'L', magnitud: 'Volumen', factorBase: '1' },
  {
    codigo: 'UM-M3',
    nombre: 'Metro cúbico',
    simbolo: 'm³',
    magnitud: 'Volumen',
    factorBase: '1000',
  },
  {
    codigo: 'UM-GAL',
    nombre: 'Galón (EE. UU.)',
    simbolo: 'gal',
    magnitud: 'Volumen',
    factorBase: '3.785411784',
  },
  {
    codigo: 'UM-BBL',
    nombre: 'Barril de petróleo',
    simbolo: 'bbl',
    magnitud: 'Volumen',
    factorBase: '158.987294928',
  },
  {
    codigo: 'UM-FT3',
    nombre: 'Pie cúbico',
    simbolo: 'ft³',
    magnitud: 'Volumen',
    factorBase: '28.316846592',
  },

  // Energía (base MJ)
  { codigo: 'UM-MJ', nombre: 'Megajulio', simbolo: 'MJ', magnitud: 'Energía', factorBase: '1' },
  { codigo: 'UM-GJ', nombre: 'Gigajulio', simbolo: 'GJ', magnitud: 'Energía', factorBase: '1000' },
  {
    codigo: 'UM-TJ',
    nombre: 'Terajulio',
    simbolo: 'TJ',
    magnitud: 'Energía',
    factorBase: '1000000',
  },
  {
    codigo: 'UM-KWH',
    nombre: 'Kilovatio hora',
    simbolo: 'kWh',
    magnitud: 'Energía',
    factorBase: '3.6',
  },
  {
    codigo: 'UM-MWH',
    nombre: 'Megavatio hora',
    simbolo: 'MWh',
    magnitud: 'Energía',
    factorBase: '3600',
  },
  {
    codigo: 'UM-MMBTU',
    nombre: 'Millón de BTU',
    simbolo: 'MMBtu',
    magnitud: 'Energía',
    factorBase: '1055.05585262',
  },

  // Distancia (base m)
  { codigo: 'UM-M', nombre: 'Metro', simbolo: 'm', magnitud: 'Distancia', factorBase: '1' },
  {
    codigo: 'UM-KM',
    nombre: 'Kilómetro',
    simbolo: 'km',
    magnitud: 'Distancia',
    factorBase: '1000',
  },
  {
    codigo: 'UM-NMI',
    nombre: 'Milla náutica',
    simbolo: 'nmi',
    magnitud: 'Distancia',
    factorBase: '1852',
  },

  // Área (base m²)
  { codigo: 'UM-M2', nombre: 'Metro cuadrado', simbolo: 'm²', magnitud: 'Área', factorBase: '1' },
  { codigo: 'UM-HA', nombre: 'Hectárea', simbolo: 'ha', magnitud: 'Área', factorBase: '10000' },

  // Tiempo (base s)
  { codigo: 'UM-H', nombre: 'Hora', simbolo: 'h', magnitud: 'Tiempo', factorBase: '3600' },
  { codigo: 'UM-D', nombre: 'Día', simbolo: 'd', magnitud: 'Tiempo', factorBase: '86400' },

  // Transporte
  {
    codigo: 'UM-TKM',
    nombre: 'Tonelada-kilómetro',
    simbolo: 't·km',
    magnitud: 'Transporte de carga',
    factorBase: '1',
  },
  {
    codigo: 'UM-PKM',
    nombre: 'Pasajero-kilómetro',
    simbolo: 'p·km',
    magnitud: 'Transporte de pasajeros',
    factorBase: '1',
  },

  // Producción y hospedaje
  { codigo: 'UM-UND', nombre: 'Unidad', simbolo: 'und', magnitud: 'Producción', factorBase: '1' },
  {
    codigo: 'UM-NOCHE',
    nombre: 'Noche de habitación',
    simbolo: 'noche',
    magnitud: 'Hospedaje',
    factorBase: '1',
  },

  // Parámetros físicos para conversiones (base kg/L, MJ/kg, MJ/L)
  {
    codigo: 'UM-KG-L',
    nombre: 'Kilogramo por litro',
    simbolo: 'kg/L',
    magnitud: 'Densidad',
    factorBase: '1',
  },
  {
    codigo: 'UM-KG-M3',
    nombre: 'Kilogramo por metro cúbico',
    simbolo: 'kg/m³',
    magnitud: 'Densidad',
    factorBase: '0.001',
  },
  {
    codigo: 'UM-MJ-KG',
    nombre: 'Megajulio por kilogramo (TJ/Gg)',
    simbolo: 'MJ/kg',
    magnitud: 'Poder calorífico másico',
    factorBase: '1',
  },
  {
    codigo: 'UM-MJ-L',
    nombre: 'Megajulio por litro',
    simbolo: 'MJ/L',
    magnitud: 'Poder calorífico volumétrico',
    factorBase: '1',
  },
  {
    codigo: 'UM-MJ-M3',
    nombre: 'Megajulio por metro cúbico',
    simbolo: 'MJ/m³',
    magnitud: 'Poder calorífico volumétrico',
    factorBase: '0.001',
  },
]
