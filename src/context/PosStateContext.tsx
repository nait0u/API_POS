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
import { bffFetch } from '@/services/apiClient';
import { ProfileContext } from '@/context/ProfileContext';
import type {
  PosEstadoCajaPayload,
  PosStateContextValue,
  PosStateStatus,
} from '@/types/pos';

const BFF_ESTADO_CAJA = '/bff/ventas/estado-caja';

// Shape real que devuelve el BFF (PascalCase, tal como viene de GeneXus).
interface EstadoCajaRaw {
  EsCaja: boolean;
  EstadoCaja: string;
  RequiereClientePreVenta: boolean;
  TurnoCajaKey: string | number;
  UsaMesas: boolean;
  AccionRequerida?: string;
  Alertas?: string[];
}

function mapEstadoCaja(raw: EstadoCajaRaw): PosEstadoCajaPayload {
  const estadoCaja = (raw.EstadoCaja ?? '').trim();
  return {
    esCaja: raw.EsCaja,
    turnoCajaKey: Number(raw.TurnoCajaKey) || 0,
    estadoCaja,
    usaMesas: raw.UsaMesas,
    requiereClientePreVenta: raw.RequiereClientePreVenta,
    accionRequerida:
      raw.AccionRequerida ??
      (raw.EsCaja && estadoCaja !== 'Abierta' ? 'ABRIR_CAJA' : 'NINGUNA'),
    alertas: raw.Alertas ?? [],
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
    if (!estado) return null;
    if (estado.estadoCaja !== 'Abierta') return null;
    return estado.requiereClientePreVenta ? 'customer-selection' : 'nota-de-venta';
  }, [estado]);

  const value = useMemo<PosStateContextValue>(
    () => ({ status, estado, error, refresh, resolveNuevaVentaTarget }),
    [status, estado, error, refresh, resolveNuevaVentaTarget],
  );

  return <PosStateContext.Provider value={value}>{children}</PosStateContext.Provider>;
}
