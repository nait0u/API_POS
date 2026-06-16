import { useMemo } from 'react';
import { useAppParameters } from '@/context/useAppContext';

export interface CapturaPrecioFlags {
  showHora: boolean;
  showUbicacion: boolean;
  showCantidad: boolean;
  showCategoria: boolean;
  showDescuento: boolean;
  showVigenciaIni: boolean;
  showVigenciaFin: boolean;
}

/**
 * Parses the CapturaPrecio company parameter (pipe-delimited, e.g. |hora|cantidad|)
 * and returns boolean visibility flags for each optional field group.
 * All flags default to false when the parameter is absent or empty.
 */
export function useCapturaPrecio(): CapturaPrecioFlags {
  const { values } = useAppParameters();

  return useMemo<CapturaPrecioFlags>(() => {
    const raw = values.get('CapturaPrecio') ?? '';
    const normalized = raw.toLowerCase();

    const flags: CapturaPrecioFlags = {
      showHora: normalized.includes('hora'),
      showUbicacion: normalized.includes('ubicacion'),
      showCantidad: normalized.includes('cantidad'),
      showCategoria: normalized.includes('categoriacliente'),
      showDescuento: normalized.includes('descuento'),
      showVigenciaIni: normalized.includes('vigenciaini'),
      showVigenciaFin: normalized.includes('vigenciafin'),
    };

    return flags;
  }, [values]);
}
