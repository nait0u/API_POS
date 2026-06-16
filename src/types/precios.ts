// ---------------------------------------------------------------------------
// Types del módulo Lista de Precios — alineados con el BFF (NestJS /bff/precios/*)
// ---------------------------------------------------------------------------

/** Fila de precio devuelta por GetPrecios / GetNovedades */
export interface SDTPrecios {
  Empkey: number;
  ProductoKey: number;
  CodIntValor: string;
  ProductoDescripcion: string;
  PrecioTimeInicio: string;   // ISO date-time
  PrecioTimeFin: string;      // ISO date-time
  PrecioHoraInicio: string;   // "HH:mm:ss" o similar
  PrecioHoraFin: string;
  PrecioUbiCod: string;
  Ubinom: string;             // Nombre legible de ubicación
  CategoriaPrecioIdl: string;
  PrecioCantidad: number;
  PrecioItem: number;         // precio unitario
  PrecioDescuentoPorcentaje: number;
  PrecioDescuentoMax: number;
  PrecioUnidadMedida: string;
}

/** Clave primaria compuesta de un precio */
export interface PrecioPK {
  Empkey: number;
  ProductoKey: number;
  PrecioTimeInicio: string;
  PrecioUbiCod: string;
  CategoriaPrecioIdl: string;
  PrecioCantidad: number;
  PrecioHoraInicio: string;
}

/** Filtro que envía la UI → BFF en GetPrecios */
export interface FiltroPrecios {
  CodIntValor?: string;
  ProductoDescripcion?: string;
  Ubicacion?: string;
  CategoriaPrecioIdl?: string;
  PrecioCantidad?: number;
  FechaFiltro?: string; // "YYYY-MM-DD"
  LastSync?: string;    // ISO 8601 — delta-sync, valor del TimeStamp de la respuesta anterior
}

/** Respuesta de GetPrecios */
export interface GetPreciosOutput {
  ListaPreciosSDT: SDTPrecios[];
  TimeStamp: string;
  Messages: GxMessage[];
}

/** Respuesta genérica con Mensaje (ActualizarPrecioDetalle, CaducarPrecio, UploadPrecios) */
export interface MensajeOutput {
  Mensaje: string;
  Messages: GxMessage[];
}

/** Input para ActualizarPrecioDetalle (sin EmpKey/Token — manejados por BFF) */
export interface ActualizarPrecioDetalleInput {
  ProductoKey: number;
  PrecioTimeInicio: string;
  PrecioUbiCod: string;
  CategoriaPrecioIdl: string;
  PrecioCantidad: number;
  PrecioHoraInicio: string;
  PrecioItemNuevo: number;
  PrecioHoraFinNuevo: string;
  PrecioTimeFinNuevo: string;
  PrecioDescuentoPorcentajeNuevo: number;
  PrecioDescuentoMaxNuevo: number;
}

/** Input para CaducarPrecio (sin EmpKey/Token — manejados por BFF) */
export interface CaducarPrecioInput {
  ProductoKey: number;
  PrecioTimeInicio: string;
  PrecioUbiCod: string;
  CategoriaPrecioIdl: string;
  PrecioCantidad: number;
  PrecioHoraInicio: string;
}

/** Input para UploadPreciosNativo — FileBlobFile es base64, sin EmpKey/Token */
export interface UploadPreciosNativoInput {
  ParmTransConf: string;
  FileBlobFile: string;   // base64 del archivo
  FileName: string;
}

/** Input para GetNovedades (sin EmpKey/Token — BFF usa lastSync en lugar de TimeStampIn) */
export interface GetNovedadesInput {
  UbiCod?: string;
  LastSync: string;
}

/** Respuesta de GetNovedades */
export interface GetNovedadesOutput {
  ListaPreciosSDT: SDTPrecios[];
  TimeStampOut: string;
  Messages: GxMessage[];
}

/** Mensaje de GeneXus */
export interface GxMessage {
  Id: string;
  Type: number;
  Description: string;
}

/** Producto encontrado por el buscador (GetProductosBuscador) */
export interface ProductoSearchSDT {
  ProductoKey: number;
  TipoCodDes: string;
  MItemCodVal: string;
  ProductoDescripcion: string;
}

/** Respuesta de GetProductosBuscador */
export interface GetProductosBuscadorOutput {
  ProductoSearchSDT: ProductoSearchSDT[];
  Messages: GxMessage[];
}

/** Input para CrearPrecioNuevo (sin EmpKey/Token — manejados por BFF) */
export interface CrearPrecioNuevoInput {
  ProductoKey: number;
  UbiCod: string;
  PrecioValor: number;
}

/** Ubicación para combo (GetUbicaciones) */
export interface UbicacionItem {
  UbiCod: string;
  UbiNom: string;
}

/** Respuesta de GetUbicaciones */
export interface GetUbicacionesOutput {
  UbicacionesComboSDT: UbicacionItem[];
  Messages: GxMessage[];
}

/** Categoría de precio para combo (GetCategoriasPrecio) */
export interface CategoriaPrecioItem {
  CategoriaPrecioIdl: string;
  CategoriaPrecioDescripcion: string;
  CategoriaPrecioTipo: string;
}

/** Respuesta de GetCategoriasPrecio */
export interface GetCategoriasPrecioOutput {
  CategoriaPrecioSDT: CategoriaPrecioItem[];
  Messages: GxMessage[];
}

/** Parámetros de paginación client-side */
export interface PaginationState {
  page: number;
  pageSize: number;
}

/** Dirección de ordenamiento */
export type SortDirection = 'asc' | 'desc' | null;

/** Estado de ordenamiento */
export interface SortState {
  column: keyof SDTPrecios | null;
  direction: SortDirection;
}

/** Formatos de importación permitidos */
export const IMPORT_FORMATS = ['PRECIO01', 'WOOCOM01'] as const;
export type ImportFormat = (typeof IMPORT_FORMATS)[number];

/**
 * Datos del formulario (crear o editar) que se pasan desde los dialogs al hook.
 * Los valores ocultos por CapturaPrecio deben enviarse con defaults seguros
 * (0 para numéricos, '' para strings) para cumplir el contrato de GeneXus.
 */
export interface GuardarPrecioFormData {
  ubiCod: string;
  categoriaPrecioIdl: string;
  precioCantidad: number;
  precioHoraInicio: string;
  precioHoraFin: string;
  /** ISO date-time o cadena vacía si no aplica fin de vigencia */
  precioTimeFin: string;
  precioValor: number;
  precioDescuentoPorcentaje: number;
  precioDescuentoMax: number;
}

/** Input para GuardarPrecioAPI (POST) — unifica Crear y Editar en SCD Tipo 2, sin EmpKey/Token */
export interface GuardarPrecioAPIInput {
  ProductoKey: number;
  /** Timestamp actual al momento del submit (nueva versión SCD Tipo 2) */
  PrecioTimeInicio: string;
  UbiCod: string;
  CategoriaPrecioIdl: string;
  PrecioCantidad: number;
  PrecioHoraInicio: string;
  PrecioHoraFin: string;
  PrecioTimeFin: string;
  PrecioValor: number;
  PrecioDescuentoPorcentaje: number;
  PrecioDescuentoMax: number;
}
