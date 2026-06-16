import { useContext } from 'react';
import { PosStateContext } from '@/context/PosStateContext';
import type { PosStateContextValue } from '@/types/pos';

/**
 * Acceso al contexto operativo del POS (estado de caja, banderas y alertas).
 * Debe usarse dentro de <PosStateProvider>.
 */
export function usePosState(): PosStateContextValue {
  const ctx = useContext(PosStateContext);
  if (!ctx) {
    throw new Error('usePosState debe usarse dentro de <PosStateProvider>');
  }
  return ctx;
}
