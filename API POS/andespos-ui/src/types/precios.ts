// ---------------------------------------------------------------------------
// Types alineados con el OpenAPI spec de xListaDePrecios (GeneXus backend)
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

/** Filtro que envía la UI → backend en GetPrecios */
export interface FiltroPrecios {
  EmpKey: number;
  CodIntValor?: string;
  ProductoDescripcion?: string;
  Ubicacion?: string;
  CategoriaPrecioIdl?: string;
  PrecioCantidad?: number;
  FechaFiltro?: string; // "YYYY-MM-DD"
}

/** Respuesta de GetPrecios */
export interface GetPreciosOutput {
  ListaPreciosSDT: SDTPrecios[];
  TimeStamp: string;
  Messages: GxMessage[];
}

/** Respuesta de GetBCPrecio (PrecioChar es un JSON string del BC) */
export interface GetBCPrecioOutput {
  PrecioChar: string;
  Messages: GxMessage[];
}

/** Respuesta genérica con Mensaje (PutBCPrecio, CaducarPrecio, UploadPrecios) */
export interface MensajeOutput {
  Mensaje: string;
  Messages: GxMessage[];
}

/** Input para CaducarPrecio */
export interface CaducarPrecioInput {
  EmpKey: number;
  ProductoKey: number;
  PrecioTimeInicio: string;
  PrecioUbiCod: string;
  CategoriaPrecioIdl: string;
  PrecioCantidad: number;
  PrecioHoraInicio: string;
  Token: string;
}

/** Input para PutBCPrecio */
export interface PutBCPrecioInput {
  PrecioChar: string;
  Token: string;
}

/** Input para UploadPreciosByUrl (YAML: UploadPreciosByUrlInput) */
export interface UploadPreciosByUrlInput {
  EmpKey: number;
  ParmTransConf: string;
  FileUrl: string;
  FileName: string;
  Token: string;
}

/** Input para UploadPreciosNativo (YAML: UploadPreciosNativoInput) */
export interface UploadPreciosNativoInput {
  EmpKey: number;
  ParmTransConf: string;
  FileBlobFile: string;   // object_id devuelto por POST /gxobject
  FileName: string;
  Token: string;
}

/** Input para GetNovedades */
export interface GetNovedadesInput {
  EmpKey: number;
  UbiCod: string;
  TimeStampIn: string;
  Token: string;
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

/** Input para CrearPrecioNuevo — Token: StrControl = EmpKey + ProductoKey */
export interface CrearPrecioNuevoInput {
  EmpKey: number;
  ProductoKey: number;
  UbiCod: string;
  PrecioValor: number;
  Token: string;
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
