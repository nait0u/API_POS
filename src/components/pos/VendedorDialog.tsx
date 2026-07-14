import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useVendedores } from '@/hooks/useVendedores';
import { useCarrito } from '@/hooks/useCarrito';
import { interpretPosError } from '@/services/apiClient';

interface VendedorDialogProps {
  open: boolean;
  notaVentaKey: number;
  vendedorKeyActual: number;
  vendedorExige: boolean;
  onClose: () => void;
  onAssigned: (vendedorKey: number, apodo: string) => void;
}

export function VendedorDialog({
  open,
  notaVentaKey,
  vendedorKeyActual,
  vendedorExige,
  onClose,
  onAssigned,
}: VendedorDialogProps) {
  const { vendedores, isLoading, fetchVendedores } = useVendedores();
  const { setVendedor } = useCarrito();
  const [filtroGenerico, setFiltroGenerico] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      void fetchVendedores({
        vendedorKey: vendedorKeyActual,
        vendedorExige,
        filtroGenerico: filtroGenerico || undefined,
      });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filtroGenerico]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isAssigning) {
      setFiltroGenerico('');
      onClose();
    }
  };

  const handleAsignar = async (usuarioKey: number, apodo: string) => {
    setIsAssigning(true);
    try {
      await setVendedor({ notaVentaKey, vendedorKey: usuarioKey });
      onAssigned(usuarioKey, apodo);
      toast.success(`Vendedor asignado: ${apodo}`);
      handleOpenChange(false);
    } catch (err) {
      toast.error(interpretPosError(err).message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">Vendedor</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Busca y asigna el vendedor de esta venta.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Buscar por nombre o código..."
          value={filtroGenerico}
          onChange={(e) => setFiltroGenerico(e.target.value)}
        />

        <div className="rounded-md border border-border overflow-hidden">
          <Table containerClassName="overflow-auto max-h-64">
            <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <TableRow>
                <TableHead className="font-semibold text-foreground px-4">APODO</TableHead>
                <TableHead className="font-semibold text-foreground px-4">IDENTIFICADOR</TableHead>
                <TableHead className="font-semibold text-foreground px-4">NOMBRE COMPLETO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && vendedores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Search size={14} /> Sin resultados.
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {vendedores.map((v) => (
                <TableRow
                  key={v.usuarioKey}
                  role="button"
                  tabIndex={isAssigning ? -1 : 0}
                  aria-current={v.usuarioKey === vendedorKeyActual ? 'true' : undefined}
                  onClick={() => { if (!isAssigning) void handleAsignar(v.usuarioKey, v.usuarioApodo); }}
                  onKeyDown={(e) => {
                    if (isAssigning) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleAsignar(v.usuarioKey, v.usuarioApodo);
                    }
                  }}
                  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <TableCell className="px-4 text-sm text-foreground truncate">
                    {v.usuarioApodo}
                    {v.usuarioKey === vendedorKeyActual && (
                      <span className="ml-2 text-[0.65rem] font-bold uppercase text-primary">Actual</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-sm text-foreground truncate">
                    {v.usuarioPIValor || '—'}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-foreground truncate">
                    {v.usuarioNombreCompleto}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isAssigning}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
