import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { getProductoDetalles, interpretPosError } from '@/services/apiClient';
import type { GxDetalleProductoVenta } from '@/types/ventas';

interface ProductoDetalleDialogProps {
  open: boolean;
  productoKey: number | null;
  productoDescripcion?: string;
  onClose: () => void;
}

/**
 * Etapa 9 — modal de detalle extendido del producto: no altera el carro,
 * solo consulta GET /ventas/pantalla/producto-detalles (getProductoDetalles)
 * para mostrar stock por sucursal y la glosa técnica ("información adicional").
 */
export function ProductoDetalleDialog({ open, productoKey, productoDescripcion, onClose }: ProductoDetalleDialogProps) {
  const [detalle, setDetalle] = useState<GxDetalleProductoVenta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || productoKey == null) return;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getProductoDetalles(productoKey);
        if (!cancelled) setDetalle(res);
      } catch (err) {
        if (!cancelled) setError(interpretPosError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, productoKey]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">
            Información del producto — {detalle?.mItemNom || productoDescripcion || ''}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Stock por sucursal e información adicional del producto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto min-h-0">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-md" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-destructive text-sm break-words">{error}</p>
            </div>
          )}

          {!isLoading && !error && detalle && (
            <>
              <section>
                <h3 className="text-foreground text-sm font-bold uppercase tracking-[0.05em] mb-2">Stock</h3>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table containerClassName="overflow-auto max-h-56">
                    <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground px-4">SUCURSAL</TableHead>
                        <TableHead className="font-semibold text-foreground px-4 text-right">STOCK</TableHead>
                        <TableHead className="font-semibold text-foreground px-4">LOCALIZACIÓN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalle.stockXLocalizacion.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-20 text-center text-muted-foreground text-sm">
                            Sin información de stock.
                          </TableCell>
                        </TableRow>
                      )}
                      {detalle.stockXLocalizacion.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="px-4 text-sm text-foreground truncate">
                            {row.puntoAccesoDescripcion}
                          </TableCell>
                          <TableCell className="px-4 font-tabular text-sm text-foreground text-right">
                            {row.productoStockCantidadInventario.toLocaleString('es-CL')}
                          </TableCell>
                          <TableCell className="px-4 text-sm text-foreground truncate">
                            {row.puntoAccesoStockLocalizacion || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h3 className="text-foreground text-sm font-bold uppercase tracking-[0.05em] mb-2">
                  Información Adicional
                </h3>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table containerClassName="overflow-auto max-h-56">
                    <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
                      <TableRow>
                        <TableHead className="font-semibold text-foreground px-4 w-[35%]">CATEGORÍA</TableHead>
                        <TableHead className="font-semibold text-foreground px-4">VALOR DE PROPIEDAD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalle.glosaTecnica.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="h-20 text-center text-muted-foreground text-sm">
                            Sin información adicional.
                          </TableCell>
                        </TableRow>
                      )}
                      {detalle.glosaTecnica.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="px-4 text-sm text-foreground truncate">
                            {row.categoriaNombre}
                          </TableCell>
                          <TableCell className="px-4 text-sm text-foreground truncate">
                            {row.propiedadDescripcion}: {row.propiedadValor}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
