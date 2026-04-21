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
import { MOCK_PRECIOS } from '../../../API_POS/API POS/andespos-ui/src/data/mockPrecios';

// Toggle: true = usa datos mock, false = llama al backend real
const USE_MOCK = false;

const API_BASE = import.meta.env.VITE_API_BASE || '/api/AndesPOSAPI2602N/POS/AI_API';
const PRECIOS_BASE = `${API_BASE}/Precios/xListaDePrecios`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fakeSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Intenta extraer mensajes estructurados desde una respuesta XML de GeneXus.
 * GeneXus devuelve errores de procesamiento de archivos como texto plano seguido
 * de un bloque <MessageList>, p.ej.:
 *   "ERROR: Falló FromFileGenerico. <MessageList xmlns="AndesPOSAPI"><Lista>..."
 * Mapea <Code> → Id  y  <Text> → Description para que sea compatible con GxMessage.
 */
/**
 * Extrae mensajes estructurados desde una respuesta XML de GeneXus usando regex.
 * DOMParser + querySelectorAll no funciona porque el XML usa xmlns="AndesPOSAPI",
 * lo que hace que los elementos queden en ese namespace y querySelectorAll retorne
 * NodeList vacío en modo text/xml. Regex ignora namespaces por completo.
 */
function parseGeneXusXmlMessages(body: string): { Id: string; Description: string }[] {
  if (!body.includes('<MessageList')) return [];
  const results: { Id: string; Description: string }[] = [];
  const itemRegex = /<ListaItem>([\s\S]*?)<\/ListaItem>/gi;
  const codeRegex = /<Code>([\s\S]*?)<\/Code>/i;
  const textRegex = /<Text>([\s\S]*?)<\/Text>/i;
  let match;
  while ((match = itemRegex.exec(body)) !== null) {
    const chunk = match[1];
    results.push({
      Id:          codeRegex.exec(chunk)?.[1]?.trim() || 'N/A',
      Description: textRegex.exec(chunk)?.[1]?.trim() || 'Error desconocido',
    });
  }
  return results;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  console.log('[apiFetch] >>>', options.method || 'GET', url);
  if (options.body) console.log('[apiFetch] BODY:', options.body);

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });

  console.log('[apiFetch] <<< status:', response.status, response.statusText);

  if (!response.ok) {
    // Leemos el body UNA SOLA VEZ como texto para no agotar el stream
    const body = await response.text().catch(() => '');
    console.log('[apiFetch] ERROR body:', body);
    let errorMsg = `Error HTTP: ${response.status}`;
    let capturedMessages: any[] | undefined = undefined;

    try {
      // Intentamos interpretar el body como JSON
      const errorData = JSON.parse(body);
      if (errorData?.Mensaje) {
        errorMsg = errorData.Mensaje;
      } else if (errorData?.error?.message) {
        errorMsg = errorData.error.message;
      }
      if (Array.isArray(errorData?.Messages)) {
        capturedMessages = errorData.Messages;
      }
    } catch {
      // No es JSON — el body completo puede ser XML directo
      if (body) errorMsg = body;
    }

    // GeneXus a veces embebe el XML de error como string dentro del campo Mensaje
    // del JSON (e.g. { "Mensaje": "ERROR: ... <MessageList>..." }).
    // Intentamos extraer mensajes estructurados tanto del errorMsg como del body raw.
    if (!capturedMessages?.length) {
      const xmlMessages = parseGeneXusXmlMessages(errorMsg) || parseGeneXusXmlMessages(body);
      if (xmlMessages.length > 0) {
        throw new ApiError('Error de procesamiento', response.status, xmlMessages);
      }
    }

    throw new ApiError(errorMsg, response.status, capturedMessages);
  }

  // Leemos como texto primero para loggear la respuesta cruda
  const rawText = await response.text();
  console.log('[apiFetch] OK raw response:', rawText);

  try {
    return JSON.parse(rawText) as T;
  } catch (e) {
    console.error('[apiFetch] JSON parse failed on OK response:', e);
    throw new ApiError('Respuesta del servidor no es JSON válido', response.status);
  }
}

export class ApiError extends Error {
  status: number;
  messages?: any[];
  constructor(message: string, status: number, messages?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
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

  console.log('[caducarPrecio] PK recibida:', JSON.stringify(pk));
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
  console.log('[caducarPrecio] Payload final:', JSON.stringify(payload));
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

  const strControl = String(empKey);
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

  console.log("🚀 [PASO 1] Subiendo archivo a gxobject...");

  // ── PASO 1: Subir el binario a /gxobject ──
  const uploadResponse = await fetch(`${PRECIOS_BASE}/gxobject`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  // Leemos como texto puro para ver la respuesta bruta de GeneXus
  const responseText = await uploadResponse.text();
  console.log("📦 [RESPUESTA BRUTA DE GXOBJECT]:", responseText);

  if (!uploadResponse.ok) {
    const xmlMessages = parseGeneXusXmlMessages(responseText);
    if (xmlMessages.length > 0) {
      throw new ApiError('Error de procesamiento', uploadResponse.status, xmlMessages);
    }
    throw new ApiError(responseText || `Error al subir archivo (${uploadResponse.status})`, uploadResponse.status);
  }

  let objectId = "";
  try {
    const uploadResult = JSON.parse(responseText);
    // Búsqueda robusta: cubrimos todas las variaciones de GeneXus
    objectId = uploadResult.object_id || uploadResult.ObjectId || uploadResult.object_ID || "";
  } catch (e) {
    // Si falla el parseo JSON, asumimos que GeneXus devolvió el ID en texto plano
    objectId = responseText.trim();
  }

  console.log("🔑 [ID EXTRAÍDO]:", objectId ? objectId : "¡ESTÁ VACÍO!");

  if (!objectId) {
    throw new ApiError('El servidor no devolvió un object_id válido. Respuesta: ' + responseText, 500);
  }

  // ── PASO 2: Llamar a UploadPreciosNativo con el object_id ──
  console.log("🚀 [PASO 2] Enviando ID al endpoint final...");
  const strControl = String(empKey);
  const token = await generateToken(strControl);
  const payload: UploadPreciosNativoInput = {
    EmpKey: empKey,
    ParmTransConf: parmTransConf,
    FileBlobFile: objectId,
    FileName: file.name,
    Token: token,
  };
  
  console.log("📄 [PAYLOAD A ENVIAR]:", payload);

  return apiFetch<MensajeOutput>(`${PRECIOS_BASE}/UploadPreciosNativo`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface FormatoUpload {
  Id: string;
  Descripcion: string;
}

export async function getFormatosUpload(empKey: number, parmTransConf: string): Promise<FormatoUpload[]> {
  const strControl = String(empKey);
  const token = await generateToken(strControl);

  // GeneXus requiere que los query parameters tengan solo la primera letra en mayúscula
  const params = new URLSearchParams({
    Empkey: String(empKey),       // <-- k minúscula obligatoria
    Parmtransconf: parmTransConf, // <-- todo en minúscula excepto la P
    Token: token
  });
  
  const response = await apiFetch<{ FormatosList: FormatoUpload[] }>(`${PRECIOS_BASE}/GetFormatosUpload?${params}`);
  return response.FormatosList || [];
}