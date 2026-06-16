// ---------------------------------------------------------------------------
// useApi – Hooks de acceso al BFF
// ---------------------------------------------------------------------------
// useBff()    → cliente genérico del middleware NestJS (/bff/*).
// usePosApi() → wrappers de los endpoints de negocio (/bff/precios/*).
//               El BFF deduce EmpKey y Token por su cuenta; el frontend
//               solo envía datos de negocio.
// ---------------------------------------------------------------------------

import { useMemo } from 'react';
import {
  bffFetch,
  getPrecios as apiGetPrecios,
  caducarPrecio as apiCaducarPrecio,
  getNovedades as apiGetNovedades,
  getProductosBuscador as apiGetProductosBuscador,
  crearPrecioNuevo as apiCrearPrecioNuevo,
  getUbicaciones as apiGetUbicaciones,
  uploadPreciosNativo as apiUploadPreciosNativo,
  getFormatosUpload as apiGetFormatosUpload,
  guardarPrecioAPI as apiGuardarPrecioAPI,
  getCategoriasPrecio as apiGetCategoriasPrecio,
  type FormatoUpload,
} from '@/services/apiClient';
import type {
  FiltroPrecios,
  PrecioPK,
  GetPreciosOutput,
  MensajeOutput,
  GetNovedadesOutput,
  GetProductosBuscadorOutput,
  GetUbicacionesOutput,
  GuardarPrecioFormData,
  GetCategoriasPrecioOutput,
} from '@/types/precios';

// ---------------------------------------------------------------------------
// useBff – Cliente genérico de consulta al middleware
// ---------------------------------------------------------------------------

export interface BffClient {
  get: <T>(path: string) => Promise<T>;
}

export function useBff(): BffClient {
  return useMemo<BffClient>(
    () => ({
      get: (path) => bffFetch(path, { method: 'GET' }),
    }),
    [],
  );
}

// ---------------------------------------------------------------------------
// usePosApi – Wrappers de los endpoints de negocio del BFF
// ---------------------------------------------------------------------------

export interface PosApiClient {
  getPrecios: (filtro: FiltroPrecios) => Promise<GetPreciosOutput>;
  caducarPrecio: (pk: PrecioPK) => Promise<MensajeOutput>;
  getNovedades: (ubiCod: string, lastSync: string) => Promise<GetNovedadesOutput>;
  getProductosBuscador: (textoBusqueda: string) => Promise<GetProductosBuscadorOutput>;
  crearPrecioNuevo: (productoKey: number, ubiCod: string, precioValor: number) => Promise<MensajeOutput>;
  getUbicaciones: () => Promise<GetUbicacionesOutput>;
  uploadPreciosNativo: (parmTransConf: string, file: File) => Promise<MensajeOutput>;
  getFormatosUpload: (parmTransConf: string) => Promise<FormatoUpload[]>;
  guardarPrecioAPI: (productoKey: number, formData: GuardarPrecioFormData) => Promise<MensajeOutput>;
  getCategoriasPrecio: () => Promise<GetCategoriasPrecioOutput>;
}

export function usePosApi(): PosApiClient {
  return useMemo<PosApiClient>(
    () => ({
      getPrecios: apiGetPrecios,
      caducarPrecio: apiCaducarPrecio,
      getNovedades: apiGetNovedades,
      getProductosBuscador: apiGetProductosBuscador,
      crearPrecioNuevo: apiCrearPrecioNuevo,
      getUbicaciones: apiGetUbicaciones,
      uploadPreciosNativo: apiUploadPreciosNativo,
      getFormatosUpload: apiGetFormatosUpload,
      guardarPrecioAPI: apiGuardarPrecioAPI,
      getCategoriasPrecio: apiGetCategoriasPrecio,
    }),
    [],
  );
}

// ---------------------------------------------------------------------------
// readBaseUbiCodFromQuery – Lectura del query param con semántica explícita
// ---------------------------------------------------------------------------
// Distinguimos tres estados:
//   • provided=false           → el parámetro no vino en la URL
//   • provided=true, value=''  → vino explícitamente vacío (todas las ubic.)
//   • provided=true, value='X' → vino con un código concreto

export type BaseUbiCod =
  | { provided: false; value: '' }
  | { provided: true; value: string };

export function readBaseUbiCodFromQuery(): BaseUbiCod {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('ubicod');
  if (raw === null) {
    return { provided: false, value: '' };
  }
  return { provided: true, value: raw };
}
