import { useQuery } from '@tanstack/react-query';
import {
  getTratamientoTributario,
  getUnidadesMedida,
  getImpuestosEspeciales,
  getMotivosTraslado,
  getTiposTraslado,
  getActividadesEconomicas,
} from '@/services/apiClient';
import type { CatalogoItem } from '@/types/carrito';

// Catálogos de dominio de baja frecuencia de cambio — staleTime/gcTime heredados
// del QueryClient global (1h / 2h), igual que useCatalogoVenta.ts.

const CATALOGOS_XVENTA_KEY = 'catalogosXVenta' as const;

function useCatalogo(nombre: string, fetcher: () => Promise<{ items: CatalogoItem[] }>) {
  const query = useQuery({
    queryKey: [CATALOGOS_XVENTA_KEY, nombre] as const,
    queryFn: fetcher,
  });
  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

export interface UseCatalogosXVentaReturn {
  tratamientoTributario: ReturnType<typeof useCatalogo>;
  unidadesMedida: ReturnType<typeof useCatalogo>;
  impuestosEspeciales: ReturnType<typeof useCatalogo>;
  motivosTraslado: ReturnType<typeof useCatalogo>;
  tiposTraslado: ReturnType<typeof useCatalogo>;
  actividadesEconomicas: ReturnType<typeof useCatalogo>;
}

export function useCatalogosXVenta(): UseCatalogosXVentaReturn {
  return {
    tratamientoTributario: useCatalogo('tratamiento-tributario', getTratamientoTributario),
    unidadesMedida: useCatalogo('unidades-medida', getUnidadesMedida),
    impuestosEspeciales: useCatalogo('impuestos-especiales', getImpuestosEspeciales),
    motivosTraslado: useCatalogo('motivos-traslado', getMotivosTraslado),
    tiposTraslado: useCatalogo('tipos-traslado', getTiposTraslado),
    actividadesEconomicas: useCatalogo('actividades-economicas', getActividadesEconomicas),
  };
}
