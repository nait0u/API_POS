import { useQuery } from '@tanstack/react-query';
import { getCategoriasMenu } from '@/services/apiClient';
import type { GxCategoriaItem } from '@/types/ventas';

// ---------------------------------------------------------------------------
// Cache key — incluye limit/offset para cuando el BFF exponga paginación
// ---------------------------------------------------------------------------
export const CATEGORIAS_MENU_KEY = 'categoriasMenu' as const;

export interface UseCatalogoVentaParams {
  limit?: number;
  offset?: number;
}

export interface UseCatalogoVentaReturn {
  colClasificadoras: GxCategoriaItem[];
  colBuscadoras: GxCategoriaItem[];
  /** SyncTimeStamp devuelto por el BFF — usar como lastSync en peticiones delta */
  syncTimestamp: string | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCatalogoVenta({
  limit = 100,
  offset = 0,
}: UseCatalogoVentaParams = {}): UseCatalogoVentaReturn {
  const query = useQuery({
    queryKey: [CATEGORIAS_MENU_KEY, limit, offset] as const,
    queryFn: () => getCategoriasMenu(),
    // staleTime y gcTime heredados del QueryClient global (1h / 2h)
  });

  return {
    colClasificadoras: query.data?.ColClasificadoras ?? [],
    colBuscadoras: query.data?.ColBuscadoras ?? [],
    syncTimestamp: query.data?.SyncTimeStamp,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
