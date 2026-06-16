// ---------------------------------------------------------------------------
// Types del módulo Ventas — alineados con el BFF (NestJS /bff/ventas/*)
// ---------------------------------------------------------------------------

/** Estados posibles de una nota de venta */
export type NotaVentaEstado = 'EDITANDO' | 'AFIRME' | ''; // Editando | Completada | Anulada

/** Fila de venta devuelta por POST /ventas/lista */
export interface SDTVenta {
  NotaVentaKey: number;
  NotaVentaFecha: string;            // ISO date-time
  ClienteKey: number;
  ClienteNombreCompleto: string;
  NotaVentaEstado: NotaVentaEstado;
  NotaVentaFolioTri?: string;
  NotaVentaGlosa?: string;
  // campos adicionales que el API puede incluir
  NotaVentaNumero?: string;
  NotaVentaTotal?: number;
  FormaPagoDescripcion?: string;
}

/** Respuesta de POST /ventas/lista */
export interface GetVentasOutput {
  SDTVentas: SDTVenta[];
  TimeStamp?: string;
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

/** Operaciones.mNotaVenta.Items.ProductoSelectorTouch.Productos_ProductosItem */
export interface GxProductoTouch {
  ProductoKey: number;
  ProductoCodigo: string;
  ProductoDescripcion: string;
  ProductoUnidadMedida: string;
  ProductoUnidadMedida2a: string;
  ProductoTratamientoTributario: string;
  ProductoActEcoCod: number;
  ProductoActEcoDescripcion: string;
  ProductoStock: number;
  ProductoPrecios: string;
  ProductoModalidadVenta: number;
  ProductoTieneStock: boolean;
  ProductoVendeLote: boolean;
  ItemInformacionAdicional: string;
}

/** Operaciones.mNotaVenta.Items.ProductoSelectorTouch_GrupoItem */
export interface GxGrupoTouch {
  GrupoSelectorIdentificador: string;
  GrupoSelectorDescripcion: string;
  GrupoSelectorTouchSelector: boolean;
  GrupoSelectorOrden: number;
  Productos: GxProductoTouch[];
}

/**
 * Respuesta de GET /bff/ventas/pantalla/carta-touch
 * Mapea GetCartaTouchInicialOutput del YAML.
 */
export interface GetCartaTouchOutput {
  SDTCartaVenta: { CartaGrupos: GxGrupoTouch[] };
  Messages?: GxMessage[];
}

/** POS.AI_API.Venta.SDTSelectorProductoGeneral */
export interface GxSelectorProductoGeneralItem {
  ProductoKey: number;
  MItemCodVal: string;
  ProductoDescripcion: string;
  ProductoPrecio: number;
  ProductoStock: number;
  ProductoUnidadMedida: string;
  ProductoVendeLote: boolean;
  ItemInformacionAdicional: string;
}

/**
 * Respuesta de GET /bff/ventas/pantalla/selector-general
 * Mapea GetSelectorProductoGeneralOutput del YAML.
 */
export interface GetSelectorGeneralOutput {
  MostrarBotonVer: boolean;
  SDTSelectorProductoGeneral: GxSelectorProductoGeneralItem[];
  Messages?: GxMessage[];
}

/** POS.AI_API.Venta.SDTDetalleProductoVenta.StockXLocalizacion item */
export interface GxStockXLocalizacionItem {
  PuntoAccesoDescripcion: string;
  ProductoStockCantidadInventario: number;
  PuntoAccesoStockLocalizacion: string;
}

/** POS.AI_API.Venta.SDTDetalleProductoVenta.GlosaTecnica item */
export interface GxGlosaTecnicaItem {
  CategoriaNombre: string;
  PropiedadDescripcion: string;
  PropiedadValor: string;
}

/** POS.AI_API.Venta.SDTDetalleProductoVenta */
export interface GxDetalleProductoVenta {
  MItemNom: string;
  ImagenesURI: string;
  StockXLocalizacion: GxStockXLocalizacionItem[];
  GlosaTecnica: GxGlosaTecnicaItem[];
}

/**
 * Respuesta de GET /bff/ventas/pantalla/producto-detalles
 * Mapea GetProductoDetallesVentaOutput del YAML.
 */
export interface GetProductoDetallesOutput {
  SDTDetalleProductoVenta: GxDetalleProductoVenta;
  Messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Pantalla venta — Init
// ---------------------------------------------------------------------------

export interface GxPantallaVentaInitSettings {
  UsaLectorQR: boolean;
  PermiteCotizar: boolean;
  LargoMinimoCodigo: number;
  TipoDocumentoDefecto: string;
  UsaComanda: boolean;
  UsaProductoLibre: boolean;
  VentasGuiasDespacho: boolean;
  ModificaPrecioOk: boolean;
  ModificaDescuentoOk: boolean;
}

export interface GxPantallaVentaInitPermisos {
  PuedeActualizar: boolean;
  RecibePagos: boolean;
  EditaVendedor: boolean;
  EditaGlosa: boolean;
  TomaPedidoOk: boolean;
  DespachoOk: boolean;
}

export interface GxPantallaVentaInitMetodosDePago {
  EfectivoOk: boolean;
  TarjetaOk: boolean;
  ConvenioOk: boolean;
  TransferenciaOk: boolean;
  ChequeOk: boolean;
  CreditoOk: boolean;
}

export interface GxPantallaVentaInitReglaDeNegocio {
  ExigeVendedorOk: boolean;
  ChequeClienteExige: boolean;
}

export interface GxPantallaVentaInitEstado {
  NotaVentaEstado: string;
  IsEditable: boolean;
  RedirectURI: string;
  EmiteBoletaNormalOk: boolean;
  CantidadComandasPendientes: number;
  ImprimirComandasPendientesOk: boolean;
}

export interface GxPantallaVentaInitActores {
  ClienteKey: number;
  ClienteNombreCompleto: string;
  ClienteGiro: string;
  VendedorKey: number;
  VendedorApodo: string;
  VendedorEditOk: boolean;
}

export interface GxPantallaVentaInitUIFlags {
  PermiteEmitirGuiaVenta: boolean;
  PermiteEmitirFactura: boolean;
  PermiteEmitirBoleta: boolean;
  PermiteEmitirTicketOk: boolean;
  PermiteEmitirTicketNoTriOk: boolean;
  PermiteEmitirGuiaTraslado: boolean;
  PermiteAgregarReferencia: boolean;
  PermiteDatosTransportista: boolean;
  MuestraDescuentoGlobalOk: boolean;
  VistaInicial: string;
  MuestraCatBuscadoraOk: boolean;
  MuestraTotalPagosOk: boolean;
  MuestraTotalVueltoOk: boolean;
  MuestraTotalBrutoOk: boolean;
  PermiteEditarTipoDocTriOk: boolean;
}

export interface GxPantallaVentaInit {
  Settings: GxPantallaVentaInitSettings;
  Permisos: GxPantallaVentaInitPermisos;
  MetodosDePago: GxPantallaVentaInitMetodosDePago;
  ReglaDeNegocio: GxPantallaVentaInitReglaDeNegocio;
  Estado: GxPantallaVentaInitEstado;
  Actores: GxPantallaVentaInitActores;
  UIFlags: GxPantallaVentaInitUIFlags;
}

/** Respuesta de GET /bff/ventas/pantalla/init */
export interface GetPantallaVentaInitOutput {
  SDTPantallaVentaInit: GxPantallaVentaInit;
  Messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Pantalla venta — Totales
// ---------------------------------------------------------------------------

export interface GxVentaTotalesMontos {
  TotalBruto: number;
  TotalPagos: number;
  Vuelto: number;
  TotalLista: number;
  VueltoLista: number;
  TotalAMostrar: number;
}

export interface GxVentaTotalesEstadoCarrito {
  ExisteProductoOk: boolean;
  TieneItemLibreOk: boolean;
  TieneProductoTabOk: boolean;
  ExisteProductoXEncargarDeliveryOk: boolean;
}

export interface GxVentaTotalesFlags {
  MostrarTotalOk: boolean;
  MostrarPagosOk: boolean;
  MostrarVueltoOk: boolean;
  MostrarBtnPagosOk: boolean;
}

export interface GxVentaTotales {
  Montos: GxVentaTotalesMontos;
  EstadoCarrito: GxVentaTotalesEstadoCarrito;
  Flags: GxVentaTotalesFlags;
}

/** Respuesta de GET /bff/ventas/pantalla/totales */
export interface GetPantallaVentaTotalesOutput {
  SDTVentaTotales: GxVentaTotales;
  Messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Pantalla venta — Carrito (delta-sync)
// ---------------------------------------------------------------------------

export interface GxVentaCarritoItem {
  Linea: number;
  ProductoKey: number;
  CodigoInterno: string;
  Descripcion: string;
  UnidadMedida: string;
  Cantidad: number;
  Precio: number;
  DescuentoMonto: number;
  TotalItem: number;
  EsNoFacturableOk: boolean;
  EditaGlosaOk: boolean;
  EsAnuladoOk: boolean;
  EsDescuentoOk: boolean;
}

export interface GxVentaCarritoLineaEliminada {
  LineaEliminadaItem: number;
}

export interface GxVentaCarrito {
  Sync: { TimeStamp: string };
  ItemsActualizados: GxVentaCarritoItem[];
  LineasEliminadas: GxVentaCarritoLineaEliminada[];
}

/** Respuesta de GET /bff/ventas/pantalla/carrito */
export interface GetPantallaVentaCarritoOutput {
  SDTVentaCarrito: GxVentaCarrito;
  Messages?: GxMessage[];
}

// ---------------------------------------------------------------------------
// Pantalla venta — Filtro categorías
// ---------------------------------------------------------------------------

export interface FiltroCategoriasInput {
  colCatClasificadoras?: GxCategoriaItem[];
  colCatBuscadoras?: GxCategoriaItem[];
  textoBusqueda?: string;
}

/** Respuesta de POST /bff/ventas/pantalla/filtro-categorias (misma forma que selector-general) */
export type GetFiltroCategoriasOutput = GetSelectorGeneralOutput;
