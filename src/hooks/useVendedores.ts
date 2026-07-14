import { useCallback, useState } from 'react';
import { getVendedores as apiGetVendedores, interpretPosError } from '@/services/apiClient';
import type { VendedorItem, GetVendedoresFiltro } from '@/types/vendedores';

export interface UseVendedoresReturn {
  vendedores: VendedorItem[];
  isLoading: boolean;
  fetchVendedores: (filtro: GetVendedoresFiltro) => Promise<void>;
}

export function useVendedores(): UseVendedoresReturn {
  const [vendedores, setVendedores] = useState<VendedorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVendedores = useCallback(async (filtro: GetVendedoresFiltro): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await apiGetVendedores(filtro);
      setVendedores(res.vendedores ?? []);
    } catch (err) {
      throw new Error(interpretPosError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { vendedores, isLoading, fetchVendedores };
}
