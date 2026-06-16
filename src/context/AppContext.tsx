// @refresh reset
// ---------------------------------------------------------------------------
// AppContext – Contexto inicial del POS
// ---------------------------------------------------------------------------
// Al montar, el provider hace dos peticiones paralelas al BFF (NestJS):
//   • /bff/device/info            → identidad + autorización del dispositivo
//   • /bff/parameter/values?app=ServidorPOS → parámetros corporativos (EmpKey,
//     RazonSocial, configs de K2BTools, etc.)
//
// Ambas respuestas llegan ya "aplanadas" por TransformInterceptor del BFF.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setApiKey, bffFetch } from '../services/apiClient';

// ── DTOs que expone el BFF ────────────────────────────────────────────────

/** Shape que devuelve GET /device/info (tras TransformInterceptor). */
interface DeviceInfoResponse {
  ok: boolean;
  dispositivoId: string | null;
  informacion: DispositivoInformacionDTO | null;
}

/**
 * Shape real del SDT GeneXus que persiste el BFF para información de dispositivo.
 * NOTA: EmpKey no está a nivel raíz — viene dentro de EnEmpresa[].EmpKey.
 * Los strings traen padding de espacios de GeneXus; se hace .trim() en toDeviceInfo.
 */
interface EnEmpresaDTO {
  EmpKey: number;
  DispositivoEnEmpresaEstado: string;   // 'VIGENTE             ' etc.
  DispositivoEnEmpresaNombre: string;
  EmpRutEmi: string;
  DispositivoEnEmpresaFechaInicio: string;
  DispositivoEnEmpresaFechaFin: string;
  DispositivoEnEmpresaFechaFinEf: string;
}

interface DispositivoInformacionDTO {
  DispositivoId: string;
  DispositivoNombre: string;
  DispositivoType: string;
  DispositivoEstado: string;
  AmbienteId: string;
  DispositivoServerName: string;
  EnEmpresa: EnEmpresaDTO[];
}

/**
 * Shape real que devuelve GET /parameter/values.
 * ParametrosValuesApp es un array plano — cada elemento es un parámetro.
 * ValorInstanciado === false indica que no hay valor configurado para esta
 * empresa/ambiente; ValorParametroValor vendrá vacío y no se carga en el Map.
 */
export interface GxParametroValue {
  ParametroId: string;
  ValorParametroValor: string;
  ValorParametroIni: string;
  ValorParametroFin: string;
  ParametroJerarquia?: string;
  Persistencia?: string;
  ValorInstanciado?: boolean;
  ValorJerarquia?: string;
}

interface ParameterValuesResponse {
  ok: boolean;
  resultado: {
    Ok: boolean;
    Messages?: Array<{ Id: string; Type: number; Description: string }>;
    ParametrosValuesApp: GxParametroValue[];
  } | null;
}

interface SessionContextResponse {
  ok: boolean;
  Contexto: {
    TokenSeguridad: string;
    Ambiente: string;
    EmpKey: number;
    Configuracion: Record<string, unknown>;
  } | null;
}

// ── Tipos expuestos al resto de la app ───────────────────────────────────

export interface DeviceInfo {
  dispositivoId: string;
  empKey: number;
  ambienteId: string;
  dispositivoNombre: string;
  sucursalId: string;
  sucursalNombre: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  /**
   * Heurística local mientras el BFF no exponga un flag "autorizado" explícito:
   * el dispositivo se considera autorizado si el servicio respondió ok y se
   * pudo resolver una EmpKey válida (> 0) en la información persistida.
   */
  autorizado: boolean;
}

export interface AppParameters {
  /** Nombre de la aplicación corporativa consultada (fijo por ahora: ServidorPOS). */
  aplicacionIdl: string;
  /** Acceso O(1) a un parámetro por su ParametroId. */
  values: ReadonlyMap<string, string>;
  /** Lista cruda por si una vista necesita fechas de vigencia. */
  raw: readonly GxParametroValue[];
}

export type AppContextStatus = 'loading' | 'ready' | 'unauthorized' | 'error';

export interface AppContextState {
  status: AppContextStatus;
  deviceInfo: DeviceInfo | null;
  parameters: AppParameters | null;
  /** Mensaje humano para pantalla de error. `null` cuando status !== 'error'. */
  error: string | null;
  /** Reintentar el bootstrap (útil para el botón "Reintentar" del error). */
  reload: () => Promise<void>;
}

// ── Contexto ─────────────────────────────────────────────────────────────

export const AppContext = createContext<AppContextState | null>(null);

// ── Constantes de endpoints ──────────────────────────────────────────────

const BFF_DEVICE_INFO = '/bff/device/info';
const BFF_SESSION_CONTEXT = '/bff/session/context';
const BFF_APP_IDL = 'ServidorPOS';
const BFF_PARAMETER_VALUES = `/bff/parameter/values?app=${encodeURIComponent(BFF_APP_IDL)}`;

function toDeviceInfo(res: DeviceInfoResponse): DeviceInfo | null {
  if (!res.informacion) return null;
  const info = res.informacion;

  // Buscar primera entrada VIGENTE en EnEmpresa (EmpKey=0 es válido en desarrollo).
  const vigente = (info.EnEmpresa ?? []).find(
    (e) => e.DispositivoEnEmpresaEstado.trim() === 'VIGENTE',
  );
  const autorizado = res.ok === true && vigente !== undefined;

  // VITE_DEV_EMP_KEY permite forzar una empresa de prueba desde .env.local
  // sin tocar el registro del dispositivo en GeneXus. Si está seteado,
  // toma precedencia sobre cualquier EmpKey que devuelva el dispositivo.
  const empKeyFromDevice = vigente?.EmpKey ?? 0;
  const devOverride = Number(import.meta.env.VITE_DEV_EMP_KEY) || 0;
  const empKey = devOverride > 0 ? devOverride : empKeyFromDevice;

  return {
    dispositivoId: info.DispositivoId.trim(),
    empKey,
    ambienteId: info.AmbienteId.trim(),
    dispositivoNombre: info.DispositivoNombre.trim(),
    // SucursalId/Nombre y PuntoVentaId/Nombre no están en este SDT de GeneXus.
    // Se incluyen como strings vacíos para no romper el tipo DeviceInfo.
    sucursalId: '',
    sucursalNombre: '',
    puntoVentaId: '',
    puntoVentaNombre: '',
    autorizado,
  };
}

function toAppParameters(res: ParameterValuesResponse): AppParameters {
  const gxItems = res.resultado?.ParametrosValuesApp ?? [];
  const map = new Map<string, string>();
  for (const item of gxItems) {
    // ValorInstanciado === false significa sin configurar para esta empresa/ambiente
    if (item.ValorInstanciado !== false) {
      map.set(item.ParametroId, item.ValorParametroValor);
    }
  }
  return {
    aplicacionIdl: BFF_APP_IDL,
    values: map,
    raw: gxItems,
  };
}

// ── Provider ─────────────────────────────────────────────────────────────

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [status, setStatus] = useState<AppContextStatus>('loading');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [parameters, setParameters] = useState<AppParameters | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bootstrap = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setError(null);
    try {
      // 1. Dispositivo primero — el EmpKey que devuelve es necesario para que
      //    el BFF construya el token correcto al llamar a la API de parámetros.
      const deviceRes = await bffFetch<DeviceInfoResponse>(BFF_DEVICE_INFO);
      const device = toDeviceInfo(deviceRes);
      setDeviceInfo(device);

      if (!device || !device.autorizado) {
        setStatus('unauthorized');
        return;
      }

      // 2. Token de sesión — el BFF genera el TokenSeguridad usando EmpKey como
      //    strControl. Se adjunta a todas las peticiones guardadas por PosContextGuard.
      const sessionRes = await bffFetch<SessionContextResponse>(BFF_SESSION_CONTEXT);
      const token = sessionRes.Contexto?.TokenSeguridad ?? null;
      setApiKey(token);

      // 3. Parámetros — se pasa empkey para que ParameterService lo incluya en
      //    el strControl del token; sin él la API externa responde 403.
      const parametersRes = await bffFetch<ParameterValuesResponse>(
        `${BFF_PARAMETER_VALUES}&empkey=${device.empKey}`,
      );
      const params = toAppParameters(parametersRes);
      setParameters(params);

      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[AppContext] bootstrap falló:', err);
      setDeviceInfo(null);
      setParameters(null);
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const value = useMemo<AppContextState>(
    () => ({ status, deviceInfo, parameters, error, reload: bootstrap }),
    [status, deviceInfo, parameters, error, bootstrap],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

