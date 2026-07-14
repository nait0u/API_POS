import { useCallback, useState } from 'react';
import { resolverOmnibox, getLotesProducto, interpretPosError } from '@/services/apiClient';
import type { ProductoResolucionDto, LoteProductoDto } from '@/types/carrito';

// Nota: el flujo principal de agregar-por-código (POST /carrito/omnibox) vive en
// useCarrito().omniboxAgregar, ya que su resultado es un delta de carrito y debe
// consolidarse en carritoStore. Este hook cubre la resolución manual
// (GET /omnibox/resolver, GET /productos/:key/lotes) para casos donde se necesita
// inspeccionar el producto antes de decidir si agregarlo.

export interface UseProductosOmniboxReturn {
  isResolving: boolean;
  resolver: (codigoEscaneado: string) => Promise<ProductoResolucionDto>;
  getLotes: (productoKey: number) => Promise<LoteProductoDto[]>;
}

export function useProductosOmnibox(): UseProductosOmniboxReturn {
  const [isResolving, setIsResolving] = useState(false);

  const resolver = useCallback(async (codigoEscaneado: string): Promise<ProductoResolucionDto> => {
    setIsResolving(true);
    try {
      return await resolverOmnibox(codigoEscaneado);
    } catch (err) {
      throw new Error(interpretPosError(err).message);
    } finally {
      setIsResolving(false);
    }
  }, []);

  const getLotes = useCallback(async (productoKey: number): Promise<LoteProductoDto[]> => {
    const res = await getLotesProducto(productoKey);
    return res.lotes ?? [];
  }, []);

  return { isResolving, resolver, getLotes };
}
