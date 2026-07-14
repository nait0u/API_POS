// @refresh reset
// ---------------------------------------------------------------------------
// PosStateContext — Estado operativo del POS
// ---------------------------------------------------------------------------
// Hace fetch a GET /ventas/estado-caja al montar la aplicación y expone las
// banderas necesarias para enrutar el flujo del punto de venta:
//   • accionRequerida ── decide si se renderiza el modal de "Abrir Caja".
//   • requiereClientePreVenta ── decide si "Nueva Venta" va a la vista de
//     selección de clientes o directo a la nota de venta.
//   • alertas ── lista de advertencias mostradas como banner aria-live.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { bffFetch, getProfileHeaders, setProfileHeaders } from '@/services/apiClient';
import { ProfileContext } from '@/context/ProfileContext';
import type {
  PosEstadoCajaPayload,
  PosStateContextValue,
  PosStateStatus,
} from '@/types/pos';

const BFF_ESTADO_CAJA = '/bff/ventas/estado-caja';

// Shape real que devuelve el BFF (camelCase estricto, tal como viene de NestJS).
interface EstadoCajaRaw {
  esCaja: boolean;
  estadoCaja: string;
  requiereClientePreVenta: boolean;
  turnoCajaKey: number;
  usaMesas: boolean;
  accionRequerida?: string;
  alertas?: string[];
}

function mapEstadoCaja(raw: EstadoCajaRaw): PosEstadoCajaPayload {
  const estadoCaja = (raw.estadoCaja ?? '').trim();
  return {
    esCaja: raw.esCaja,
    turnoCajaKey: Number(raw.turnoCajaKey) || 0,
    estadoCaja,
    usaMesas: raw.usaMesas,
    requiereClientePreVenta: raw.requiereClientePreVenta,
    accionRequerida:
      raw.accionRequerida ??
      (raw.esCaja && estadoCaja !== 'Abierta' ? 'ABRIR_CAJA' : 'NINGUNA'),
    alertas: raw.alertas ?? [],
  };
}

export const PosStateContext = createContext<PosStateContextValue | null>(null);

interface PosStateProviderProps {
  children: ReactNode;
}

export function PosStateProvider({ children }: PosStateProviderProps) {
  const [status, setStatus] = useState<PosStateStatus>('loading');
  const [estado, setEstado] = useState<PosEstadoCajaPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Observa el perfil activo para re-consultar cuando el usuario cambia de perfil.
  const profileCtx = useContext(ProfileContext);
  const activeProfileId = profileCtx?.activeProfile.id;

  const refresh = useCallback(async (): Promise<void> => {
    console.log('[PosStateContext] refresh() llamado, perfil activo:', activeProfileId);
    setStatus('loading');
    setError(null);
    try {
      const raw = await bffFetch<EstadoCajaRaw>(BFF_ESTADO_CAJA);
      console.log('[PosStateContext] raw:', JSON.stringify(raw));
      const mapped = mapEstadoCaja(raw);
      console.log('[PosStateContext] mapped:', JSON.stringify(mapped));
      // Propagar turnoCajaKey a los headers globales para todas las llamadas posteriores
      setProfileHeaders({ ...getProfileHeaders(), 'x-pos-turno-caja-key': String(mapped.turnoCajaKey) });
      setEstado(mapped);
      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[PosStateContext] estado-caja falló:', err);
      setEstado(null);
      setError(message);
      setStatus('error');
    }
  }, [activeProfileId]);

  // Re-consulta al montar y cada vez que cambia el perfil activo.
  useEffect(() => {
    console.log('[PosStateContext] effect disparado, activeProfileId:', activeProfileId);
    void refresh();
  }, [refresh, activeProfileId]);

  const resolveNuevaVentaTarget = useCallback<
    PosStateContextValue['resolveNuevaVentaTarget']
  >(() => {
    console.log('[resolveNuevaVentaTarget] estado actual:', JSON.stringify(estado));
    if (!estado) {
      console.warn('[resolveNuevaVentaTarget] → null (sin estado)');
      return null;
    }
    if (estado.estadoCaja !== 'Abierta') {
      console.warn('[resolveNuevaVentaTarget] → null (caja no abierta, estadoCaja:', estado.estadoCaja, ')');
      return null;
    }
    const target = estado.requiereClientePreVenta ? 'customer-selection' : 'nota-de-venta';
    console.log('[resolveNuevaVentaTarget] → target:', target, '| requiereClientePreVenta:', estado.requiereClientePreVenta, '| usaMesas:', estado.usaMesas);
    return target;
  }, [estado]);

  const value = useMemo<PosStateContextValue>(
    () => ({ status, estado, error, refresh, resolveNuevaVentaTarget }),
    [status, estado, error, refresh, resolveNuevaVentaTarget],
  );

  return <PosStateContext.Provider value={value}>{children}</PosStateContext.Provider>;
}
