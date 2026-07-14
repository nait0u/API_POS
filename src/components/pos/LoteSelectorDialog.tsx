import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { LoteProductoDto } from '@/types/carrito';

interface LoteSelectorDialogProps {
  open: boolean;
  productoKey: number | null;
  lotes: LoteProductoDto[];
  /** Cantidad original tipeada/escaneada por el cajero antes del 428 — se reenvía tal cual, nunca un default. */
  cantidadOriginal: string;
  isSubmitting: boolean;
  onSelectLote: (loteKey: number) => void;
  onClose: () => void;
}

export function LoteSelectorDialog({
  open,
  lotes,
  cantidadOriginal,
  isSubmitting,
  onSelectLote,
  onClose,
}: LoteSelectorDialogProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSubmitting) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">
            Seleccionar Lote
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Este producto exige lote. Cantidad a agregar: {cantidadOriginal}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {lotes.map((lote) => (
            <button
              key={lote.loteKey}
              type="button"
              disabled={isSubmitting}
              onClick={() => onSelectLote(lote.loteKey)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors text-left disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{lote.loteCodigo}</p>
                <p className="text-xs text-muted-foreground">
                  Caduca: {lote.loteCaducaFecha || '—'}
                </p>
              </div>
              <p className="text-sm font-tabular text-foreground shrink-0">
                {lote.cantidadInventario}
              </p>
            </button>
          ))}
          {lotes.length === 0 && (
            <p className="text-sm text-muted-foreground px-1 py-2">Sin lotes vigentes.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
