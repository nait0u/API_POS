import { useState, useCallback, useRef } from 'react';
import {
  ApiError,
  getVentas as apiGetVentas,
  crearVenta as apiCrearVenta,
  anularVenta as apiAnularVenta,
} from '@/services/apiClient';
import type { SDTVenta, FiltroVentas } from '@/types/ventas';

export interface UseVentasReturn {
  // Data
  ventas: SDTVenta[];
  // Loading flags
  isLoading: boolean;
  isCreating: boolean;
  isAnulando: boolean;
  // Actions
  fetchVentas: (filtro?: FiltroVentas) => Promise<void>;
  crearVenta: (clienteKey?: number) => Promise<number>;
  anularVenta: (notaVentaKey: number) => Promise<void>;
  resetSync: () => void;
}

export function useVentas(): UseVentasReturn {
  const [ventas, setVentas] = useState<SDTVenta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAnulando, setIsAnulando] = useState(false);
  const syncTimestampRef = useRef<string | undefined>(undefined);

  const resetSync = useCallback(() => {
    syncTimestampRef.current = undefined;
  }, []);

  const fetchVentas = useCallback(async (filtro: FiltroVentas = {}): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await apiGetVentas({ ...filtro, lastSync: syncTimestampRef.current });
      // GeneXus rellena strings con espacios — normalizar NotaVentaEstado en un solo lugar
      setVentas(
        (result.ventas ?? []).map((v) => ({
          ...v,
          notaVentaEstado: v.notaVentaEstado.trim() as typeof v.notaVentaEstado,
        })),
      );
      syncTimestampRef.current = result.timeStamp ?? undefined;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al obtener las ventas';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const crearVenta = useCallback(async (clienteKey: number = 0): Promise<number> => {
    setIsCreating(true);
    try {
      const result = await apiCrearVenta(clienteKey);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear la venta';
      throw new Error(message);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const anularVenta = useCallback(async (notaVentaKey: number): Promise<void> => {
    setIsAnulando(true);
    try {
      await apiAnularVenta(notaVentaKey);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al anular la venta';
      throw new Error(message);
    } finally {
      setIsAnulando(false);
    }
  }, []);

  return { ventas, isLoading, isCreating, isAnulando, fetchVentas, crearVenta, anularVenta, resetSync };
}
