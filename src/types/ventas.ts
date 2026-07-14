// ---------------------------------------------------------------------------
// Types del módulo Ventas — alineados con el BFF (NestJS /bff/ventas/*)
// ---------------------------------------------------------------------------

/** Estados posibles de una nota de venta */
export type NotaVentaEstado = 'EDITANDO' | 'AFIRME' | ''; // Editando | Completada | Anulada

/** Fila de venta devuelta por POST /ventas/lista */
export interface SDTVenta {
  notaVentaKey: number;
  notaVentaFecha: string;
  notaVentaTiempo?: string;
  clienteKey?: number;
  clienteNombreCompleto: string;
  notaVentaEstado: NotaVentaEstado;
  notaVentaFolioTri?: number;
  notaVentaGlosa?: string;
  notaVentaNumero?: string;
  notaVentaTotal?: number;
  formaPagoDescripcion?: string;
}

/** Respuesta de POST /ventas/lista */
export interface GetVentasOutput {
  ventas: SDTVenta[];
  timeStamp?: string;
}

/** Filtros que envía la UI → BFF en /ventas/lista */
export interface FiltroVentas {
  lastSync?: string;              // ISO 8601
  fechaFiltro?: string;          // "YYYY-MM-DD" — desde esta fecha
  nota?: string;
  estado?: NotaVentaEstado | '';
  clienteNombreCompleto?: string;
}

/** Respuesta de POST /ventas (crear venta) */
export type CrearVentaOutput = number;

/** Respuesta de GET /ventas/caja-estado */
export interface CajaEstadoOutput {
  CajaAbierta: boolean;
  CajaKey?: number;
  CajaNumero?: string;
}

/** Respuesta de GET /ventas/:id (detalle) */
export interface DetalleVentaOutput {
  NotaVentaKey: number;
  NotaVentaNumero: string;
  NotaVentaFecha: string;
  ClienteKey: number;
  ClienteNombre: string;
  NotaVentaEstado: NotaVentaEstado;
  NotaVentaTotal: number;
  FormaPagoDescripcion: string;
  // Líneas de detalle — extender cuando el BFF las exponga
  Lineas?: DetalleVentaLinea[];
}

export interface DetalleVentaLinea {
  ProductoKey: number;
  ProductoDescripcion: string;
  Cantidad: number;
  PrecioUnitario: number;
  Total: number;
}

// ---------------------------------------------------------------------------
// SDTs del módulo Venta (pantalla POS) — alineados con xVenta.yaml
// ---------------------------------------------------------------------------

/** GeneXus.Common.Messages_Message */
export interface GxMessage {
  Id: string;
  Type: number;
  Description: string;
}

/** POS.AI_API.Venta.SDTCategoriaItem */
export interface GxCategoriaItem {
  CatCod: string;
  CatNom: string;
}

/**
 * Respuesta de GET /bff/ventas/pantalla/categorias-menu
 * Mapea GetCategoriasMenuOutput del YAML; SyncTimeStamp es adición del BFF.
 */
export interface GetCategoriasMenuPaginadoOutput {
  ColClasificadoras: GxCategoriaItem[];
  ColBuscadoras: GxCategoriaItem[];
  SyncTimeStamp?: string;
  Messages?: GxMessage[];
}

/** BFF /ventas/pantalla/carta-touch → productos dentro de cada grupo */
export interface GxProductoTouch {
  productoKey: number;
  productoCodigo: string;
  productoDescripcion: string;
  productoUnidadMedida: string;
  productoUnidadMedida2a: string;
  productoTratamientoTributario: string;
  productoActEcoCod: number;
  productoActEcoDescripcion: string;
  productoStock: number;
  productoPrecios: string;
  productoModalidadVenta: number;
  productoTieneStock: boolean;
  productoVendeLote: boolean;
  itemInformacionAdicional: string;
}

/** BFF /ventas/pantalla/carta-touch → ítem de grupo */
export interface GxGrupoTouch {
  grupoSelectorIdentificador: string;
  grupoSelectorDescripcion: string;
  grupoSelectorTouchSelector: boolean;
  grupoSelectorOrden: number;
  productos: GxProductoTouch[];
}

/** Respuesta de GET /bff/ventas/pantalla/carta-touch */
export interface GetCartaTouchOutput {
  cartaGrupos: GxGrupoTouch[];
  Messages?: GxMessage[];
}

/** GET /bff/ventas/pantalla/selector-general — ítem de resultado */
export interface GxSelectorProductoGeneralItem {
  productoKey: number;
  tipoCodDes: string;
  mItemCodVal: string;
  productoDescripcion: string;
  /** ⚠️ STRING ya formateado por GeneXus — NUNCA Number()/parseFloat(), renderizar tal cual */
  precioPicture: string;
  /** ⚠️ idem — pre-formateado por GeneXus */
  cantidadPicture: string;
  unidadMedida: string;
  productoVendeLote: boolean;
  itemInformacionAdicional: string;
}

/** Respuesta de GET /bff/ventas/pantalla/selector-general */
export interface GetSelectorGeneralOutput {
  mostrarBotonVer: boolean;
  productos: GxSelectorProductoGeneralItem[];
}

/** POS.AI_API.Venta.SDTDetalleProductoVenta.StockXLocalizacion item */
export interface GxStockXLocalizacionItem {
  puntoAccesoDescripcion: string;
  productoStockCantidadInventario: number;
  puntoAccesoStockLocalizacion: string;
}

/** POS.AI_API.Venta.SDTDetalleProductoVenta.GlosaTecnica item */
export interface GxGlosaTecnicaItem {
  categoriaNombre: string;
  propiedadDescripcion: string;
  propiedadValor: string;
}

/** POS.AI_API.Venta.SDTDetalleProductoVenta */
export interface GxDetalleProductoVenta {
  mItemNom: string;
  imagenesURI: string;
  stockXLocalizacion: GxStockXLocalizacionItem[];
  glosaTecnica: GxGlosaTecnicaItem[];
}

/**
 * Respuesta de GET /bff/ventas/pantalla/producto-detalles — el BFF
 * devuelve el detalle directamente, sin wrapper.
 */
export type GetProductoDetallesOutput = GxDetalleProductoVenta;

// ---------------------------------------------------------------------------
// Pantalla venta — Init
// ---------------------------------------------------------------------------

export interface GxPantallaVentaInitSettings {
  usaLectorQR: boolean;
  permiteCotizar: boolean;
  largoMinimoCodigo: number;
  tipoDocumentoDefecto: string;
  usaComanda: boolean;
  usaProductoLibre: boolean;
  ventasGuiasDespacho: boolean;
  modificaPrecioOk: boolean;
  modificaDescuentoOk: boolean;
}

export interface GxPantallaVentaInitPermisos {
  puedeActualizar: boolean;
  recibePagos: boolean;
  editaVendedor: boolean;
  editaGlosa: boolean;
  tomaPedidoOk: boolean;
  despachoOk: boolean;
}

export interface GxPantallaVentaInitMetodosDePago {
  efectivoOk: boolean;
  tarjetaOk: boolean;
  convenioOk: boolean;
  transferenciaOk: boolean;
  chequeOk: boolean;
  creditoOk: boolean;
}

export interface GxPantallaVentaInitReglaDeNegocio {
  exigeVendedorOk: boolean;
  chequeClienteExige: boolean;
}

export interface GxPantallaVentaInitEstado {
  notaVentaEstado: string;
  isEditable: boolean;
  redirectURI: string;
  emiteBoletaNormalOk: boolean;
  cantidadComandasPendientes: number;
  imprimirComandasPendientesOk: boolean;
}

export interface GxPantallaVentaInitActores {
  clienteKey: number;
  clienteNombreCompleto: string;
  clienteGiro: string;
  vendedorKey: number;
  vendedorApodo: string;
  vendedorEditOk: boolean;
}

export interface GxPantallaVentaInitUIFlags {
  permiteEmitirGuiaVenta: boolean;
  permiteEmitirFactura: boolean;
  permiteEmitirBoleta: boolean;
  permiteEmitirTicketOk: boolean;
  permiteEmitirTicketNoTriOk: boolean;
  permiteEmitirGuiaTraslado: boolean;
  permiteAgregarReferencia: boolean;
  permiteDatosTransportista: boolean;
  muestraDescuentoGlobalOk: boolean;
  vistaInicial: string;
  muestraCatBuscadoraOk: boolean;
  muestraTotalPagosOk: boolean;
  muestraTotalVueltoOk: boolean;
  muestraTotalBrutoOk: boolean;
  permiteEditarTipoDocTriOk: boolean;
}

/** Respuesta de GET /bff/ventas/pantalla/init — el BFF devuelve los campos directamente (sin wrapper) */
export interface GetPantallaVentaInitOutput {
  settings: GxPantallaVentaInitSettings;
  permisos: GxPantallaVentaInitPermisos;
  metodosDePago: GxPantallaVentaInitMetodosDePago;
  reglaDeNegocio: GxPantallaVentaInitReglaDeNegocio;
  estado: GxPantallaVentaInitEstado;
  actores: GxPantallaVentaInitActores;
  uiFlags: GxPantallaVentaInitUIFlags;
  messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Pantalla venta — Totales
// ---------------------------------------------------------------------------

export interface GxVentaTotalesMontos {
  totalBruto: number;
  totalPagos: number;
  vuelto: number;
  totalLista: number;
  vueltoLista: number;
  totalAMostrar: number;
}

export interface GxVentaTotalesEstadoCarrito {
  existeProductoOk: boolean;
  tieneItemLibreOk: boolean;
  tieneProductoTabOk: boolean;
  existeProductoXEncargarDeliveryOk: boolean;
}

export interface GxVentaTotalesFlags {
  mostrarTotalOk: boolean;
  mostrarPagosOk: boolean;
  mostrarVueltoOk: boolean;
  mostrarBtnPagosOk: boolean;
}

/** Respuesta de GET /bff/ventas/pantalla/totales — el BFF devuelve los campos directamente (sin wrapper) */
export interface GetPantallaVentaTotalesOutput {
  montos: GxVentaTotalesMontos;
  estadoCarrito: GxVentaTotalesEstadoCarrito;
  flags: GxVentaTotalesFlags;
  messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Pantalla venta — Carrito (delta-sync)
// ---------------------------------------------------------------------------

export interface GxVentaCarritoItem {
  linea: number;
  productoKey: number;
  codigoInterno: string;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
  precio: number;
  descuentoMonto: number;
  totalItem: number;
  esNoFacturableOk: boolean;
  editaGlosaOk: boolean;
  esAnuladoOk: boolean;
  esDescuentoOk: boolean;
}

export interface GxVentaCarritoLineaEliminada {
  lineaEliminadaItem: number;
}

/** Respuesta de GET /bff/ventas/pantalla/carrito — el BFF devuelve los campos directamente (sin wrapper) */
export interface GetPantallaVentaCarritoOutput {
  sync: { timeStamp: string };
  itemsActualizados: GxVentaCarritoItem[];
  lineasEliminadas: GxVentaCarritoLineaEliminada[];
  messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Pantalla venta — Filtro categorías
// ---------------------------------------------------------------------------

export interface FiltroCategoriasInput {
  colCatClasificadoras?: GxCategoriaItem[];
  colCatBuscadoras?: string[];
  textoBusqueda?: string;
}

/** POST /bff/ventas/pantalla/filtro-categorias — ítem de resultado (shape propio, distinto de selector-general) */
export interface GxFiltroCategoriaProductoItem {
  mItemKey: number;
  mItemNom: string;
  codigo: string;
  categoria: string;
  /** numérico real, a diferencia de precioPicture de selector-general */
  precioItem: number;
  stock: number;
}

/** Respuesta de POST /bff/ventas/pantalla/filtro-categorias */
export interface GetFiltroCategoriasOutput {
  mostrarBotonVer: boolean;
  productos: GxFiltroCategoriaProductoItem[];
}
