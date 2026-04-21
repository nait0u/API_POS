import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { SDTPrecios } from '@/types/precios';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ExpirePriceAlertProps {
  open: boolean;
  item: SDTPrecios | null;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ExpirePriceAlert({
  open,
  item,
  saving,
  onConfirm,
  onClose,
}: ExpirePriceAlertProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !saving) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-50">
            <AlertTriangle className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Caducar este precio?</AlertDialogTitle>
          <AlertDialogDescription>
            {item ? (
              <>
                Se caducará el precio de{' '}
                <strong className="text-foreground">{item.ProductoDescripcion}</strong>
                {item.Ubinom && (
                  <>
                    {' '}en <strong className="text-foreground">{item.Ubinom}</strong>
                  </>
                )}
                {' '}(${Number(item.PrecioItem).toFixed(2)}). Esta acción no se puede deshacer.
              </>
            ) : (
              'Esta acción no se puede deshacer.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={saving}
            onClick={onConfirm}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Procesando...
              </>
            ) : (
              'Caducar Precio'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
