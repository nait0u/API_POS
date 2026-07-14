// ---------------------------------------------------------------------------
// API Client – Acceso exclusivo al BFF NestJS (/bff/*)
// ---------------------------------------------------------------------------
// El BFF (puerto 3000, proxied bajo /bff por Vite) deduce EmpKey y Token
// del contexto del dispositivo. El frontend solo envía datos de negocio.
// ---------------------------------------------------------------------------

import type {
  FiltroPrecios,
  GetPreciosOutput,
  MensajeOutput,
  GetNovedadesOutput,
  PrecioPK,
  GetProductosBuscadorOutput,
  GetUbicacionesOutput,
  GuardarPrecioFormData,
  GetCategoriasPrecioOutput,
} from '../types/precios';

const BFF = '/bff';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  messages?: any[];
  /** Body JSON parseado de la respuesta de error, cuando existe (ej. 428 LOTE_REQUERIDO) */
  body?: unknown;
  constructor(message: string, status: number, messages?: any[], body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// BFF fetch helper
// ---------------------------------------------------------------------------

let apiKey: string | null = null;

export function setApiKey(value: string | null): void {
  apiKey = value;
}

export function getApiKey(): string | null {
  return apiKey;
}

// Profile headers (x-pos-user, x-pos-emp-key, etc.) — set by ProfileContext
let _profileHeaders: Record<string, string> = {};

export function setProfileHeaders(headers: Record<string, string>): void {
  _profileHeaders = headers;
}

export function getProfileHeaders(): Record<string, string> {
  return { ..._profileHeaders };
}

export async function bffFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ..._profileHeaders,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (apiKey) {
    headers['x-pos-token'] = apiKey;
  }

  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = `BFF ${path} → HTTP ${response.status}`;
    let parsedBody: unknown;
    const body = await response.text().catch(() => '');
    if (body) {
      try {
        parsedBody = JSON.parse(body);
        const parsed = parsedBody as { message?: unknown; error?: unknown };
        if (typeof parsed?.message === 'string') {
          message = parsed.message;
        } else if (typeof parsed?.error === 'string') {
          message = parsed.error;
        } else {
          message = body;
        }
      } catch {
        message = body;
      }
    }
    throw new ApiError(message, response.status, undefined, parsedBody);
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Manejo centralizado de errores — contrato /bff/api/pos/*
// ---------------------------------------------------------------------------
// Toda respuesta de error de /api/pos/* tiene la forma
// { statusCode, errorCode, message, timestamp, ...extraFields }. Los hooks
// deben interpretar el ApiError con esta función en vez de repetir el
// switch por status en cada catch.

export type PosErrorKind =
  | 'auth'               // 401 — token inválido/expirado, redirigir a login
  | 'not-found'          // 404 — producto/cliente/lote sin match
  | 'not-editable'       // 409 — la NotaVenta no está en estado EDITANDO
  | 'contexto-incompleto'// 412 — faltan EmpKey/PuntoAccesoKey
  | 'lote-requerido'     // 428 — el producto exige seleccionar un lote (ver LoteRequeridoErrorBody)
  | 'negocio'            // 422 (u otro no clasificado) — regla de negocio/matemática fallida
  | 'desconocido';

export interface PosErrorInfo {
  kind: PosErrorKind;
  message: string;
  status: number;
  body?: unknown;
}

export function interpretPosError(err: unknown): PosErrorInfo {
  if (!(err instanceof ApiError)) {
    return { kind: 'desconocido', message: err instanceof Error ? err.message : 'Error desconocido', status: 0 };
  }
  const { status, message, body } = err;
  const kindByStatus: Record<number, PosErrorKind> = {
    401: 'auth',
    404: 'not-found',
    409: 'not-editable',
    412: 'contexto-incompleto',
    428: 'lote-requerido',
    422: 'negocio',
  };
  return { kind: kindByStatus[status] ?? 'desconocido', message, status, body };
}

// ---------------------------------------------------------------------------
// Precios — endpoints del BFF
// ---------------------------------------------------------------------------

export async function getPrecios(filtro: FiltroPrecios): Promise<GetPreciosOutput> {
  return bffFetch<GetPreciosOutput>(`${BFF}/precios/lista`, {
    method: 'POST',
    body: JSON.stringify({
      codIntValor: filtro.CodIntValor || undefined,
      productoDescripcion: filtro.ProductoDescripcion || undefined,
      ubicacion: filtro.Ubicacion || undefined,
      categoriaPrecioIdl: filtro.CategoriaPrecioIdl || undefined,
      precioCantidad: filtro.PrecioCantidad,
      fechaFiltro: filtro.FechaFiltro,
      lastSync: filtro.LastSync || undefined,
    }),
  });
}

export async function caducarPrecio(pk: PrecioPK): Promise<MensajeOutput> {
  // PK se envía tal cual viene del GET — regla de identidad opaca (guidelines §1)
  return bffFetch<MensajeOutput>(`${BFF}/precios/caducar`, {
    method: 'POST',
    body: JSON.stringify({
      productoKey: pk.ProductoKey,
      precioTimeInicio: pk.PrecioTimeInicio,
      precioUbiCod: pk.PrecioUbiCod,
      categoriaPrecioIdl: pk.CategoriaPrecioIdl,
      precioCantidad: pk.PrecioCantidad,
      precioHoraInicio: pk.PrecioHoraInicio,
    }),
  });
}

export async function getNovedades(ubiCod: string, lastSync: string): Promise<GetNovedadesOutput> {
  return bffFetch<GetNovedadesOutput>(`${BFF}/precios/novedades`, {
    method: 'POST',
    body: JSON.stringify({ ubiCod: ubiCod || undefined, lastSync }),
  });
}

export async function getProductosBuscador(textoBusqueda: string): Promise<GetProductosBuscadorOutput> {
  const params = new URLSearchParams({ texto: textoBusqueda });
  return bffFetch<GetProductosBuscadorOutput>(`${BFF}/precios/buscar?${params}`);
}

export async function getUbicaciones(): Promise<GetUbicacionesOutput> {
  return bffFetch<GetUbicacionesOutput>(`${BFF}/precios/ubicaciones`);
}

export async function getCategoriasPrecio(): Promise<GetCategoriasPrecioOutput> {
  return bffFetch<GetCategoriasPrecioOutput>(`${BFF}/precios/categorias`);
}

export interface FormatoUpload {
  Id: string;
  Descripcion: string;
}

export async function getFormatosUpload(parmTransConf: string): Promise<FormatoUpload[]> {
  const params = new URLSearchParams({ parmTransConf });
  const response = await bffFetch<{ FormatosList: FormatoUpload[] }>(
    `${BFF}/precios/formatos-upload?${params}`,
    { cache: 'no-store' },
  );
  return response.FormatosList || [];
}

export async function uploadPreciosNativo(
  parmTransConf: string,
  file: File,
): Promise<MensajeOutput> {
  // BFF espera el archivo en base64; no hay two-step gxobject
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return bffFetch<MensajeOutput>(`${BFF}/precios/upload`, {
    method: 'POST',
    body: JSON.stringify({ parmTransConf, fileBlobFile: base64, fileName: file.name }),
  });
}

export async function guardarPrecioAPI(
  productoKey: number,
  formData: GuardarPrecioFormData,
): Promise<MensajeOutput> {
  // PrecioTimeInicio es el inicio de la nueva versión SCD Tipo 2 (timestamp actual).
  // No reutiliza ningún valor recibido del GET, por lo que new Date() es correcto aquí.
  return bffFetch<MensajeOutput>(`${BFF}/precios/guardar`, {
    method: 'POST',
    body: JSON.stringify({
      productoKey,
      precioTimeInicio: new Date().toISOString(),
      ubiCod: formData.ubiCod,
      categoriaPrecioIdl: formData.categoriaPrecioIdl,
      precioCantidad: formData.precioCantidad,
      precioHoraInicio: formData.precioHoraInicio,
      precioHoraFin: formData.precioHoraFin,
      precioTimeFin: formData.precioTimeFin,
      precioValor: formData.precioValor,
      precioDescuentoPorcentaje: formData.precioDescuentoPorcentaje,
      precioDescuentoMax: formData.precioDescuentoMax,
    }),
  });
}

export async function crearPrecioNuevo(
  productoKey: number,
  ubiCod: string,
  precioValor: number,
): Promise<MensajeOutput> {
  return bffFetch<MensajeOutput>(`${BFF}/precios/crear`, {
    method: 'POST',
    body: JSON.stringify({ productoKey, ubiCod, precioValor }),
  });
}

// ---------------------------------------------------------------------------
// Ventas — endpoints del BFF
// ---------------------------------------------------------------------------

import type {
  FiltroVentas,
  GetVentasOutput,
  CrearVentaOutput,
  CajaEstadoOutput,
  DetalleVentaOutput,
  GetCategoriasMenuPaginadoOutput,
  GetCartaTouchOutput,
  GetProductoDetallesOutput,
  GetSelectorGeneralOutput,
  GetPantallaVentaInitOutput,
  GetPantallaVentaTotalesOutput,
  GetPantallaVentaCarritoOutput,
  FiltroCategoriasInput,
  GetFiltroCategoriasOutput,
} from '../types/ventas';

export type { CrearVentaOutput };

/** POST /ventas/lista — lista paginada/filtrada para la grilla */
export async function getVentas(filtro: FiltroVentas = {}): Promise<GetVentasOutput> {
  return bffFetch<GetVentasOutput>(`${BFF}/ventas/lista`, {
    method: 'POST',
    body: JSON.stringify({
      lastSync: filtro.lastSync || undefined,
      fechaFiltro: filtro.fechaFiltro || undefined,
      nota: filtro.nota || undefined,
      estado: filtro.estado || undefined,
      clienteNombreCompleto: filtro.clienteNombreCompleto || undefined,
    }),
  });
}

/** POST /ventas — crea una nueva nota de venta; retorna el NotaVentaKey */
export async function crearVenta(clienteKey: number): Promise<number> {
  return bffFetch<number>(`${BFF}/ventas`, {
    method: 'POST',
    body: JSON.stringify({ clienteKey }),
  });
}

/** POST /ventas/anular — anula una nota de venta; el SII puede demorar varios segundos */
export async function anularVenta(notaVentaKey: number): Promise<MensajeOutput> {
  return bffFetch<MensajeOutput>(`${BFF}/ventas/anular`, {
    method: 'POST',
    body: JSON.stringify({ notaVentaKey }),
  });
}

/** GET /ventas/caja-estado — estado actual de la caja */
export async function getCajaEstado(): Promise<CajaEstadoOutput> {
  return bffFetch<CajaEstadoOutput>(`${BFF}/ventas/caja-estado`);
}

/** GET /ventas/:id — detalle completo de una venta */
export async function getDetalleVenta(notaVentaKey: number): Promise<DetalleVentaOutput> {
  return bffFetch<DetalleVentaOutput>(`${BFF}/ventas/${notaVentaKey}`);
}

/** GET /ventas/pantalla/categorias-menu?limit=&offset= — colecciones clasificadoras y buscadoras para la UI del POS */
export async function getCategoriasMenu(limit = 50, offset = 0): Promise<GetCategoriasMenuPaginadoOutput> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return bffFetch<GetCategoriasMenuPaginadoOutput>(`${BFF}/ventas/pantalla/categorias-menu?${params}`);
}

/** GET /ventas/pantalla/carta-touch — grupos y productos del selector táctil */
export async function getCartaTouch(categoriaIdl?: string): Promise<GetCartaTouchOutput> {
  const params = new URLSearchParams();
  if (categoriaIdl) params.set('categoriaIdl', categoriaIdl);
  const qs = params.size ? `?${params}` : '';
  return bffFetch<GetCartaTouchOutput>(`${BFF}/ventas/pantalla/carta-touch${qs}`);
}

/** GET /ventas/pantalla/producto-detalles?mitemKey= — stock por localización y glosa técnica */
export async function getProductoDetalles(mitemKey: number): Promise<GetProductoDetallesOutput> {
  const params = new URLSearchParams({ mitemKey: String(mitemKey) });
  return bffFetch<GetProductoDetallesOutput>(`${BFF}/ventas/pantalla/producto-detalles?${params}`);
}

/** GET /ventas/pantalla/selector-general — búsqueda de productos por texto o código */
export async function getSelectorGeneral(
  textoBusqueda?: string,
  codigoBusqueda?: string,
): Promise<GetSelectorGeneralOutput> {
  const params = new URLSearchParams();
  if (textoBusqueda) params.set('textoBusqueda', textoBusqueda);
  if (codigoBusqueda) params.set('codigoBusqueda', codigoBusqueda);
  const qs = params.size ? `?${params}` : '';
  return bffFetch<GetSelectorGeneralOutput>(`${BFF}/ventas/pantalla/selector-general${qs}`);
}

/** GET /ventas/pantalla/init?notaVentaKey=&pmodo= — settings, permisos y métodos de pago de la pantalla */
export async function getPantallaVentaInit(
  notaVentaKey: number,
  pmodo?: string,
): Promise<GetPantallaVentaInitOutput> {
  const params = new URLSearchParams({ notaVentaKey: String(notaVentaKey) });
  if (pmodo) params.set('pmodo', pmodo);
  return bffFetch<GetPantallaVentaInitOutput>(`${BFF}/ventas/pantalla/init?${params}`);
}

/** GET /ventas/pantalla/totales?notaVentaKey= — montos y estado del carrito */
export async function getPantallaVentaTotales(notaVentaKey: number): Promise<GetPantallaVentaTotalesOutput> {
  const params = new URLSearchParams({ notaVentaKey: String(notaVentaKey) });
  return bffFetch<GetPantallaVentaTotalesOutput>(`${BFF}/ventas/pantalla/totales?${params}`);
}

/** GET /ventas/pantalla/carrito?notaVentaKey= — delta-sync del carrito */
export async function getPantallaVentaCarrito(notaVentaKey: number): Promise<GetPantallaVentaCarritoOutput> {
  const params = new URLSearchParams({ notaVentaKey: String(notaVentaKey) });
  return bffFetch<GetPantallaVentaCarritoOutput>(`${BFF}/ventas/pantalla/carrito?${params}`);
}

/** POST /ventas/pantalla/filtro-categorias — filtrar productos por categorías seleccionadas */
export async function getFiltroCategoriasVenta(
  input: FiltroCategoriasInput,
): Promise<GetFiltroCategoriasOutput> {
  return bffFetch<GetFiltroCategoriasOutput>(`${BFF}/ventas/pantalla/filtro-categorias`, {
    method: 'POST',
    body: JSON.stringify({
      colCatClasificadoras: input.colCatClasificadoras?.length ? input.colCatClasificadoras : undefined,
      colCatBuscadoras: input.colCatBuscadoras?.length ? input.colCatBuscadoras : undefined,
      textoBusqueda: input.textoBusqueda || undefined,
    }),
  });
}

// ---------------------------------------------------------------------------
// Carrito xVenta — endpoints del BFF (/bff/api/pos/carrito)
// ---------------------------------------------------------------------------

const POS = `${BFF}/api/pos`;

import type {
  DeltaCarritoResponseDto,
  AgregarProductoCarritoInput,
  FijarCantidadCarritoInput,
  EliminarLineaCarritoInput,
  GlosaCabeceraInput,
  GlosaLineaInput,
  DescuentoGlobalInput,
  AsignarClienteCarritoInput,
  AsignarClienteCarritoOutput,
  AsignarVendedorCarritoInput,
  TransportistaCarritoInput,
  ReferenciasCarritoInput,
  OmniboxAgregarInput,
  ProductoResolucionDto,
  GetLotesProductoOutput,
  GetCatalogoOutput,
} from '../types/carrito';

export type { DeltaCarritoResponseDto, LoteProductoDto, LoteRequeridoErrorBody } from '../types/carrito';

/** POST /carrito/producto — agrega producto de catálogo; cantidad SIEMPRE aditiva */
export async function agregarProductoCarrito(input: AgregarProductoCarritoInput): Promise<DeltaCarritoResponseDto> {
  return bffFetch<DeltaCarritoResponseDto>(`${POS}/carrito/producto`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** PUT /carrito/producto/cantidad — fija cantidad ABSOLUTA de una línea */
export async function fijarCantidadCarrito(input: FijarCantidadCarritoInput): Promise<DeltaCarritoResponseDto> {
  return bffFetch<DeltaCarritoResponseDto>(`${POS}/carrito/producto/cantidad`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** DELETE /carrito/linea?notaVentaKey=&notaVentaProductoLinea= — elimina una línea completa */
export async function eliminarLineaCarrito(input: EliminarLineaCarritoInput): Promise<DeltaCarritoResponseDto> {
  const params = new URLSearchParams({
    notaVentaKey: String(input.notaVentaKey),
    notaVentaProductoLinea: String(input.notaVentaProductoLinea),
  });
  return bffFetch<DeltaCarritoResponseDto>(`${POS}/carrito/linea?${params}`, { method: 'DELETE' });
}

/** PUT /carrito/glosa-cabecera — no retorna Delta */
export async function setGlosaCabecera(input: GlosaCabeceraInput): Promise<{ ok: true }> {
  return bffFetch<{ ok: true }>(`${POS}/carrito/glosa-cabecera`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** PUT /carrito/glosa-linea */
export async function setGlosaLinea(input: GlosaLineaInput): Promise<DeltaCarritoResponseDto> {
  return bffFetch<DeltaCarritoResponseDto>(`${POS}/carrito/glosa-linea`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/**
 * PUT /carrito/descuento-global — descuentoPorcentaje:0, descuentoTotal:0 elimina el descuento vigente.
 * ⚠️ GeneXus recalcula el descuento de forma perezosa — el total con descuento recién
 * se refleja en la SIGUIENTE mutación de carrito, no en esta respuesta ni en un GET
 * de totales inmediato. No tratar esto como error.
 */
export async function setDescuentoGlobal(input: DescuentoGlobalInput): Promise<DeltaCarritoResponseDto> {
  return bffFetch<DeltaCarritoResponseDto>(`${POS}/carrito/descuento-global`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** PUT /carrito/cliente — clienteKey: 0 desasigna */
export async function setClienteCarrito(input: AsignarClienteCarritoInput): Promise<AsignarClienteCarritoOutput> {
  return bffFetch<AsignarClienteCarritoOutput>(`${POS}/carrito/cliente`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** PUT /carrito/vendedor */
export async function setVendedorCarrito(input: AsignarVendedorCarritoInput): Promise<{ ok: true }> {
  return bffFetch<{ ok: true }>(`${POS}/carrito/vendedor`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** PUT /carrito/transportista */
export async function setTransportista(input: TransportistaCarritoInput): Promise<{ ok: true }> {
  return bffFetch<{ ok: true }>(`${POS}/carrito/transportista`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** PUT /carrito/referencias — operación bulk; referencias: [] elimina todas las existentes */
export async function setReferencias(input: ReferenciasCarritoInput): Promise<{ ok: true }> {
  return bffFetch<{ ok: true }>(`${POS}/carrito/referencias`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/**
 * POST /carrito/omnibox — resuelve código → ProductoKey, evalúa lote, agrega al carrito.
 * Response 428: { code: 'LOTE_REQUERIDO', productoKey, lotes } — ver LoteRequeridoErrorBody,
 * accesible vía `ApiError.body` en el catch (usar interpretPosError).
 */
export async function omniboxAgregar(input: OmniboxAgregarInput): Promise<DeltaCarritoResponseDto> {
  return bffFetch<DeltaCarritoResponseDto>(`${POS}/carrito/omnibox`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Productos / OmniBox — endpoints del BFF (/bff/api/pos)
// ---------------------------------------------------------------------------

/** GET /omnibox/resolver?codigoEscaneado= */
export async function resolverOmnibox(codigoEscaneado: string): Promise<ProductoResolucionDto> {
  const params = new URLSearchParams({ codigoEscaneado });
  return bffFetch<ProductoResolucionDto>(`${POS}/omnibox/resolver?${params}`);
}

/** GET /productos/:productoKey/lotes */
export async function getLotesProducto(productoKey: number): Promise<GetLotesProductoOutput> {
  return bffFetch<GetLotesProductoOutput>(`${POS}/productos/${productoKey}/lotes`);
}

// ---------------------------------------------------------------------------
// Catálogos — endpoints del BFF (/bff/api/pos/catalogos) — estables, cachear
// ---------------------------------------------------------------------------

function getCatalogo(nombre: string): Promise<GetCatalogoOutput> {
  return bffFetch<GetCatalogoOutput>(`${POS}/catalogos/${nombre}`);
}

export const getTratamientoTributario = () => getCatalogo('tratamiento-tributario');
export const getUnidadesMedida = () => getCatalogo('unidades-medida');
export const getImpuestosEspeciales = () => getCatalogo('impuestos-especiales');
export const getMotivosTraslado = () => getCatalogo('motivos-traslado');
export const getTiposTraslado = () => getCatalogo('tipos-traslado');
export const getActividadesEconomicas = () => getCatalogo('actividades-economicas');

// ---------------------------------------------------------------------------
// Clientes xVenta — endpoints del BFF (/bff/api/pos/clientes)
// ---------------------------------------------------------------------------
// ⚠️ Distinto del módulo legacy `getClientes`/`guardarCliente` de más abajo
// (API xCliente de GeneXus) — son APIs paralelas del backend, ambas vigentes.

import type {
  GetClientesXVentaOutput,
  GetClientesXVentaFiltro,
  CrearClienteShellOutput,
  CopiarClienteInput,
  CopiarClienteOutput,
  ActualizarClienteXVentaInput,
} from '../types/clientesXVenta';

/** GET /clientes?filtroRUT=&filtroNombre=&filtroGenerico= */
export async function getClientesXVenta(filtro: GetClientesXVentaFiltro = {}): Promise<GetClientesXVentaOutput> {
  const params = new URLSearchParams();
  if (filtro.filtroRUT) params.set('filtroRUT', filtro.filtroRUT);
  if (filtro.filtroNombre) params.set('filtroNombre', filtro.filtroNombre);
  if (filtro.filtroGenerico) params.set('filtroGenerico', filtro.filtroGenerico);
  const qs = params.size ? `?${params}` : '';
  return bffFetch<GetClientesXVentaOutput>(`${POS}/clientes${qs}`);
}

/** POST /clientes/shell (sin body) — crea shell vacío */
export async function crearClienteShellXVenta(): Promise<CrearClienteShellOutput> {
  return bffFetch<CrearClienteShellOutput>(`${POS}/clientes/shell`, { method: 'POST' });
}

/** POST /clientes/copiar */
export async function copiarClienteXVenta(input: CopiarClienteInput): Promise<CopiarClienteOutput> {
  return bffFetch<CopiarClienteOutput>(`${POS}/clientes/copiar`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** PUT /clientes/:clienteKey */
export async function actualizarClienteXVenta(
  clienteKey: number,
  input: ActualizarClienteXVentaInput,
): Promise<{ ok: true }> {
  return bffFetch<{ ok: true }>(`${POS}/clientes/${clienteKey}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Vendedores — endpoints del BFF (/bff/api/pos/vendedores)
// ---------------------------------------------------------------------------

import type { GetVendedoresOutput, GetVendedoresFiltro } from '../types/vendedores';

/** GET /vendedores?vendedorKey=&vendedorExige=&filtroOmniBox=&filtroGenerico= */
export async function getVendedores(filtro: GetVendedoresFiltro): Promise<GetVendedoresOutput> {
  const params = new URLSearchParams({
    vendedorKey: String(filtro.vendedorKey),
    vendedorExige: String(filtro.vendedorExige),
  });
  if (filtro.filtroOmniBox) params.set('filtroOmniBox', filtro.filtroOmniBox);
  if (filtro.filtroGenerico) params.set('filtroGenerico', filtro.filtroGenerico);
  return bffFetch<GetVendedoresOutput>(`${POS}/vendedores?${params}`);
}

// ---------------------------------------------------------------------------
// Clientes — endpoints del BFF
// ---------------------------------------------------------------------------

import type {
  GetClientesOutput,
  GuardarClienteInput,
  GuardarClienteOutput,
  GetComunasOutput,
  GetCategoriasPrecioClienteOutput,
  GetClienteMatrizOutput,
} from '../types/customer';

/** POST /clientes/lista — búsqueda server-side por texto libre. */
export async function getClientes(filtroBuscador: string): Promise<GetClientesOutput> {
  return bffFetch<GetClientesOutput>(`${BFF}/clientes/lista`, {
    method: 'POST',
    body: JSON.stringify({ filtroBuscador }),
  });
}

/** POST /clientes — crea (clienteKeyIn=0) o actualiza (clienteKeyIn>0). */
export async function guardarCliente(input: GuardarClienteInput): Promise<GuardarClienteOutput> {
  return bffFetch<GuardarClienteOutput>(`${BFF}/clientes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** GET /clientes/comunas?texto= — catálogo de comunas (estable, cachear). */
export async function getComunas(texto?: string): Promise<GetComunasOutput> {
  const qs = texto ? `?texto=${encodeURIComponent(texto)}` : '';
  return bffFetch<GetComunasOutput>(`${BFF}/clientes/comunas${qs}`);
}

/** GET /clientes/categorias-precio — catálogo (estable, cachear). */
export async function getCategoriasPrecioCliente(): Promise<GetCategoriasPrecioClienteOutput> {
  return bffFetch<GetCategoriasPrecioClienteOutput>(`${BFF}/clientes/categorias-precio`);
}

/** GET /clientes/matriz?rut=&sucursalClienteKey= — resuelve matriz para sucursales. */
export async function getClienteMatriz(
  rut: string,
  sucursalClienteKey?: number,
): Promise<GetClienteMatrizOutput> {
  const params = new URLSearchParams({ rut });
  if (sucursalClienteKey !== undefined) {
    params.set('sucursalClienteKey', String(sucursalClienteKey));
  }
  return bffFetch<GetClienteMatrizOutput>(`${BFF}/clientes/matriz?${params}`);
}
