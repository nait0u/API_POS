// ---------------------------------------------------------------------------
// API Client – Capa de acceso al backend GeneXus (xListaDePrecios)
// ---------------------------------------------------------------------------
// En modo mock (USE_MOCK=true) retorna datos falsos para desarrollo.
// En modo real, hace fetch al proxy Vite configurado en vite.config.ts.
// ---------------------------------------------------------------------------

import type {
  FiltroPrecios,
  GetPreciosOutput,
  GetBCPrecioOutput,
  MensajeOutput,
  PutBCPrecioInput,
  CaducarPrecioInput,
  UploadPreciosByUrlInput,
  UploadPreciosNativoInput,
  GetNovedadesInput,
  GetNovedadesOutput,
  PrecioPK,
  GetProductosBuscadorOutput,
  CrearPrecioNuevoInput,
  GetUbicacionesOutput,
} from '../types/precios';
import { generateToken } from './tokenService';
import { MOCK_PRECIOS } from '../data/mockPrecios';

// Toggle: true = usa datos mock, false = llama al backend real
const USE_MOCK = false;

const API_BASE = import.meta.env.VITE_API_BASE || '/api/AndesPOSAPI2602N/POS/AI_API';
const PRECIOS_BASE = `${API_BASE}/Precios/xListaDePrecios`;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `Error HTTP: ${response.status}`;
    try {
      // Intentamos parsear la respuesta como JSON
      const errorData = await response.json();
      // Si GeneXus nos mandó la propiedad 'Mensaje', la usamos (nuestra prioridad)
      if (errorData && errorData.Mensaje) {
        errorMsg = errorData.Mensaje;
      } else if (errorData && errorData.error && errorData.error.message) {
        // Fallback genérico
        errorMsg = errorData.error.message;
      }
    } catch {
      // Si falla el parseo JSON, intentamos leer el texto plano
      const body = await response.text().catch(() => '');
      if (body) errorMsg = body;
    }

    // Lanzamos nuestro custom error
    throw new ApiError(errorMsg, response.status);
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// 1) GetPrecios – POST
//    TokenVal StrControl = EmpKey
// ---------------------------------------------------------------------------
export async function getPrecios(filtro: FiltroPrecios): Promise<GetPreciosOutput> {
  if (USE_MOCK) {
    await fakeSleep(400);
    let items = [...MOCK_PRECIOS];
    if (filtro.CodIntValor) {
      items = items.filter(i => i.CodIntValor.toLowerCase().includes(filtro.CodIntValor!.toLowerCase()));
    }
    if (filtro.ProductoDescripcion) {
      items = items.filter(i => i.ProductoDescripcion.toLowerCase().includes(filtro.ProductoDescripcion!.toLowerCase()));
    }
    if (filtro.Ubicacion) {
      items = items.filter(i => i.PrecioUbiCod === filtro.Ubicacion);
    }
    if (filtro.CategoriaPrecioIdl) {
      items = items.filter(i => i.CategoriaPrecioIdl === filtro.CategoriaPrecioIdl);
    }
    return {
      ListaPreciosSDT: items,
      TimeStamp: new Date().toISOString(),
      Messages: [],
    };
  }

  const strControl = String(filtro.EmpKey);
  const token = await generateToken(strControl);
  return apiFetch<GetPreciosOutput>(`${PRECIOS_BASE}/GetPrecios`, {
    method: 'POST',
    body: JSON.stringify({ FiltroPreciosSDT: filtro, Token: token }),
  });
}

// ---------------------------------------------------------------------------
// 2) GetBCPrecio – GET
//    TokenVal StrControl = EmpKey + ProductoKey
// ---------------------------------------------------------------------------
export async function getBCPrecio(pk: PrecioPK): Promise<GetBCPrecioOutput> {
  if (USE_MOCK) {
    await fakeSleep(300);
    const found = MOCK_PRECIOS.find(
      p => p.Empkey === pk.Empkey && p.ProductoKey === pk.ProductoKey
    );
    if (!found) throw new ApiError('No encontrado', 404);
    return { PrecioChar: JSON.stringify(found), Messages: [] };
  }

  const strControl = `${pk.Empkey}${pk.ProductoKey}`;
  const token = await generateToken(strControl);
  const params = new URLSearchParams({
    Empkey: String(pk.Empkey),
    Productokey: String(pk.ProductoKey),
    Preciotimeinicio: pk.PrecioTimeInicio,
    Precioubicod: pk.PrecioUbiCod,
    Categoriaprecioidl: pk.CategoriaPrecioIdl,
    Preciocantidad: String(pk.PrecioCantidad),
    Preciohorainicio: pk.PrecioHoraInicio,
    Token: token,
  });
  return apiFetch<GetBCPrecioOutput>(`${PRECIOS_BASE}/GetBCPrecio?${params}`);
}

// ---------------------------------------------------------------------------
// 3) PutBCPrecio – PUT
//    TokenVal StrControl = EmpKey + ProductoKey (from PrecioChar)
// ---------------------------------------------------------------------------
export async function putBCPrecio(precioChar: string, empKey: number, productoKey: number): Promise<MensajeOutput> {
  if (USE_MOCK) {
    await fakeSleep(500);
    return { Mensaje: 'OK', Messages: [] };
  }

  const strControl = `${empKey}${productoKey}`;
  const token = await generateToken(strControl);
  const payload: PutBCPrecioInput = { PrecioChar: precioChar, Token: token };
  return apiFetch<MensajeOutput>(`${PRECIOS_BASE}/PutBCPrecio`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// 4) CaducarPrecio – POST
//    TokenVal StrControl = EmpKey + ProductoKey
// ---------------------------------------------------------------------------
export async function caducarPrecio(pk: PrecioPK): Promise<MensajeOutput> {
  if (USE_MOCK) {
    await fakeSleep(400);
    return { Mensaje: 'OK', Messages: [] };
  }

  const strControl = `${pk.Empkey}${pk.ProductoKey}`;
  const token = await generateToken(strControl);
  const payload: CaducarPrecioInput = {
    EmpKey: pk.Empkey,
    ProductoKey: pk.ProductoKey,
    PrecioTimeInicio: pk.PrecioTimeInicio,
    PrecioUbiCod: pk.PrecioUbiCod,
    CategoriaPrecioIdl: pk.CategoriaPrecioIdl,
    PrecioCantidad: pk.PrecioCantidad,
    PrecioHoraInicio: pk.PrecioHoraInicio,
    Token: token,
  };
  return apiFetch<MensajeOutput>(`${PRECIOS_BASE}/CaducarPrecio`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// 5) GetNovedades – POST
//    TokenVal StrControl = EmpKey + TimeStampIn
// ---------------------------------------------------------------------------
export async function getNovedades(empKey: number, ubiCod: string, timeStampIn: string): Promise<GetNovedadesOutput> {
  if (USE_MOCK) {
    await fakeSleep(300);
    return { ListaPreciosSDT: [], TimeStampOut: new Date().toISOString(), Messages: [] };
  }

  const strControl = `${empKey}${timeStampIn}`;
  const token = await generateToken(strControl);
  const payload: GetNovedadesInput = {
    EmpKey: empKey,
    UbiCod: ubiCod,
    TimeStampIn: timeStampIn,
    Token: token,
  };
  return apiFetch<GetNovedadesOutput>(`${PRECIOS_BASE}/GetNovedades`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// 6) UploadPreciosByUrl – POST  (YAML: UploadPreciosByUrl)
//    TokenVal StrControl = EmpKey
// ---------------------------------------------------------------------------
export async function uploadPreciosByUrl(
  empKey: number,
  parmTransConf: string,
  fileUrl: string,
  fileName: string,
): Promise<MensajeOutput> {
  if (USE_MOCK) {
    await fakeSleep(1500);
    return { Mensaje: 'OK - 20 precios importados', Messages: [] };
  }

  const strControl = String(empKey);
  const token = await generateToken(strControl);
  const payload: UploadPreciosByUrlInput = {
    EmpKey: empKey,
    ParmTransConf: parmTransConf,
    FileUrl: fileUrl,
    FileName: fileName,
    Token: token,
  };
  return apiFetch<MensajeOutput>(`${PRECIOS_BASE}/UploadPreciosByUrl`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// 7) GetProductosBuscador – GET
//    TokenVal StrControl = EmpKey
// ---------------------------------------------------------------------------
export async function getProductosBuscador(empKey: number, textoBusqueda: string): Promise<GetProductosBuscadorOutput> {
  if (USE_MOCK) {
    await fakeSleep(300);
    return { ProductoSearchSDT: [], Messages: [] };
  }

  const strControl = String(empKey);
  const token = await generateToken(strControl);
  const params = new URLSearchParams({
    Empkey: String(empKey),
    Textobusqueda: textoBusqueda,
    Token: token,
  });
  return apiFetch<GetProductosBuscadorOutput>(`${PRECIOS_BASE}/GetProductosBuscador?${params}`);
}

// ---------------------------------------------------------------------------
// 8) CrearPrecioNuevo – POST
//    TokenVal StrControl = EmpKey + ProductoKey
// ---------------------------------------------------------------------------
export async function crearPrecioNuevo(
  empKey: number,
  productoKey: number,
  ubiCod: string,
  precioValor: number,
): Promise<MensajeOutput> {
  if (USE_MOCK) {
    await fakeSleep(500);
    return { Mensaje: 'OK', Messages: [] };
  }

  const strControl = `${empKey}${productoKey}`;
  const token = await generateToken(strControl);
  const payload: CrearPrecioNuevoInput = {
    EmpKey: empKey,
    ProductoKey: productoKey,
    UbiCod: ubiCod,
    PrecioValor: precioValor,
    Token: token,
  };
  return apiFetch<MensajeOutput>(`${PRECIOS_BASE}/CrearPrecioNuevo`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// 9) GetUbicaciones – GET
//    TokenVal StrControl = EmpKey
// ---------------------------------------------------------------------------
export async function getUbicaciones(empKey: number): Promise<GetUbicacionesOutput> {
  if (USE_MOCK) {
    await fakeSleep(300);
    return { UbicacionesComboSDT: [], Messages: [] };
  }

  const strControl = String(empKey);
  const token = await generateToken(strControl);
  const params = new URLSearchParams({
    Empkey: String(empKey),
    Token: token,
  });
  return apiFetch<GetUbicacionesOutput>(`${PRECIOS_BASE}/GetUbicaciones?${params}`);
}

// ---------------------------------------------------------------------------
// 10) UploadPreciosNativo – Two-step native file upload
//     PASO 1: POST file raw body → /gxobject → returns object_id
//     PASO 2: POST JSON → /UploadPreciosNativo with { FileBlobFile: object_id }
//     TokenVal StrControl = EmpKey
// ---------------------------------------------------------------------------
export async function uploadPreciosNativo(
  empKey: number,
  parmTransConf: string,
  file: File,
): Promise<MensajeOutput> {
  if (USE_MOCK) {
    await fakeSleep(1500);
    return { Mensaje: 'OK - 20 precios importados', Messages: [] };
  }

  // ── PASO 1: Subir el binario a /gxobject ──
  const uploadResponse = await fetch(`${PRECIOS_BASE}/gxobject`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => '');
    throw new ApiError(body || `Error al subir archivo (${uploadResponse.status})`, uploadResponse.status);
  }

  const uploadResult = await uploadResponse.json() as { object_id: string };
  const objectId = uploadResult.object_id;

  if (!objectId) {
    throw new ApiError('El servidor no devolvió un object_id válido', 500);
  }

  // ── PASO 2: Llamar a UploadPreciosNativo con el object_id ──
  const strControl = String(empKey);
  const token = await generateToken(strControl);
  const payload: UploadPreciosNativoInput = {
    EmpKey: empKey,
    ParmTransConf: parmTransConf,
    FileBlobFile: objectId,
    FileName: file.name,
    Token: token,
  };
  return apiFetch<MensajeOutput>(`${PRECIOS_BASE}/UploadPreciosNativo`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------
function fakeSleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
