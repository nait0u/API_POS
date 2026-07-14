// ---------------------------------------------------------------------------
// Types del módulo Carrito xVenta — BFF /bff/api/pos/carrito/*
// ---------------------------------------------------------------------------
// La mayoría de las mutaciones de carrito devuelven DeltaCarritoResponseDto,
// que reutiliza los mismos Gx* que ya existen para GET /ventas/pantalla/carrito
// y /ventas/pantalla/totales — aquí solo se compone la envoltura nueva.
// ---------------------------------------------------------------------------

import type {
  GxMessage,
  GxVentaCarritoItem,
  GxVentaCarritoLineaEliminada,
  GxVentaTotalesMontos,
  GxVentaTotalesEstadoCarrito,
  GxVentaTotalesFlags,
} from './ventas';

/**
 * Respuesta de toda mutación de carrito con delta (POST/PUT /carrito/*).
 * ⚠️ itemsActualizados puede traer entradas duplicadas para la misma `linea`
 * (ej. la línea sintética 99999 de descuento global) — al consolidar, hacer
 * upsert por `linea` (el último valor gana), no concatenar el array.
 */
export interface DeltaCarritoResponseDto {
  carrito: {
    sync: { timeStamp: string };
    itemsActualizados: GxVentaCarritoItem[];
    lineasEliminadas: GxVentaCarritoLineaEliminada[];
  };
  totales: {
    montos: GxVentaTotalesMontos;
    estadoCarrito: GxVentaTotalesEstadoCarrito;
    flags: GxVentaTotalesFlags;
  };
  messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Inputs de mutación
// ---------------------------------------------------------------------------

/** POST /carrito/producto — cantidad SIEMPRE aditiva (se suma a la línea existente) */
export interface AgregarProductoCarritoInput {
  notaVentaKey: number;
  categoriaIdl?: string;
  accion: string;
  productoKey: number;
  cantidad: string;
  loteKey?: number;
}

/** PUT /carrito/producto/cantidad — cantidad ABSOLUTA (reemplaza, no suma) */
export interface FijarCantidadCarritoInput {
  notaVentaKey: number;
  productoKey: number;
  cantidad: string;
}

export interface EliminarLineaCarritoInput {
  notaVentaKey: number;
  notaVentaProductoLinea: number;
}

export interface GlosaCabeceraInput {
  notaVentaKey: number;
  notaVentaGlosa: string;
}

export interface GlosaLineaInput {
  notaVentaKey: number;
  notaVentaProductoLinea: number;
  notaVentaProductoGlosaContenido: string;
  loteKey?: number;
}

/** Enviar descuentoPorcentaje: 0, descuentoTotal: 0 elimina el descuento vigente */
export interface DescuentoGlobalInput {
  notaVentaKey: number;
  descuentoEsPorcentaje: boolean;
  descuentoPorcentaje: number;
  descuentoTotal: number;
  glosaContenido?: string;
}

export interface AsignarClienteCarritoInput {
  notaVentaKey: number;
  /** 0 desasigna */
  clienteKey: number;
}

export interface AsignarClienteCarritoOutput {
  categoriaIdl: string;
}

export interface AsignarVendedorCarritoInput {
  notaVentaKey: number;
  vendedorKey: number;
}

export interface SDTTransportista {
  motivoTraslado: number;
  tipoTraslado: number;
  rutChofer?: string;
  nombreChofer?: string;
  patente?: string;
  carroPatente?: string;
  salidaFecha?: string;
  salidaHora?: string;
  llegadaFecha?: string;
  llegadaHora?: number;
}

export interface TransportistaCarritoInput {
  notaVentaKey: number;
  sdtTransportista: SDTTransportista;
}

export interface ReferenciaCarritoItem {
  tipoDocumento: string;
  folio: string;
  fecha?: string;
  razon?: string;
}

/** Operación bulk — reemplaza el estado completo de referencias; [] elimina todas */
export interface ReferenciasCarritoInput {
  notaVentaKey: number;
  referencias: ReferenciaCarritoItem[];
}

/** POST /carrito/omnibox — resuelve código → ProductoKey y agrega al carrito en una llamada */
export interface OmniboxAgregarInput {
  notaVentaKey: number;
  codigoEscaneado: string;
  /** default '1' en el BFF */
  cantidad?: string;
  /** default 'Agregar' en el BFF */
  accion?: string;
}

// ---------------------------------------------------------------------------
// Productos / OmniBox — BFF /bff/api/pos/omnibox, /bff/api/pos/productos
// ---------------------------------------------------------------------------

export interface ProductoResolucionDto {
  productoKey: number;
  modalidadVenta: number;
  usaLote: boolean;
  vendeLote: boolean;
  loteUnicoKey: number;
}

export interface LoteProductoDto {
  loteKey: number;
  loteCodigo: string;
  loteCaducaFecha: string;
  cantidadInventario: number;
}

export interface GetLotesProductoOutput {
  lotes: LoteProductoDto[];
}

/** Body de un error 428 del flujo OmniBox — el producto exige seleccionar un lote */
export interface LoteRequeridoErrorBody {
  code: 'LOTE_REQUERIDO';
  productoKey: number;
  lotes: LoteProductoDto[];
}

// ---------------------------------------------------------------------------
// Catálogos — BFF /bff/api/pos/catalogos/* (dominio, baja frecuencia de cambio)
// ---------------------------------------------------------------------------

export interface CatalogoItem {
  codigo: string;
  descripcion: string;
}

export interface GetCatalogoOutput {
  items: CatalogoItem[];
}
