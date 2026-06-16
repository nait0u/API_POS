import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, LockKeyhole } from 'lucide-react';
import { usePosState } from '@/hooks/usePosState';

/**
 * Renderiza la UI bloqueante derivada del estado del POS:
 *  - Modal "Abrir Caja" cuando accionRequerida === 'ABRIR_CAJA'.
 *  - Toast aria-live="polite" por cada alerta recibida del BFF.
 *
 * Debe montarse una sola vez, dentro de <PosStateProvider>.
 */
export function PosStateGate() {
  const { status, estado } = usePosState();

  // Banner de alertas — se emite vía Sonner para mantener un único sistema
  // de notificaciones; aria-live="polite" es responsabilidad del <Toaster/>.
  useEffect(() => {
    if (!estado?.alertas?.length) return;
    estado.alertas.forEach((mensaje) =>
      toast.warning(mensaje, {
        icon: <AlertTriangle className="w-4 h-4" aria-hidden="true" />,
      }),
    );
  }, [estado?.alertas]);

  const mustOpenCaja =
    status === 'ready' && estado?.accionRequerida === 'ABRIR_CAJA';

  return (
    <Dialog open={mustOpenCaja}>
      <DialogContent
        className="sm:max-w-md"
        // Evita cerrar el modal por Esc o click-outside: la acción es obligatoria.
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        aria-describedby="abrir-caja-desc"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-primary shrink-0">
              <LockKeyhole className="w-5 h-5" aria-hidden="true" />
            </div>
            <DialogTitle>Caja cerrada</DialogTitle>
          </div>
          <DialogDescription id="abrir-caja-desc">
            Para comenzar a operar el punto de venta debes abrir la caja del
            turno actual. No es posible realizar ninguna acción hasta que la
            caja esté en estado <strong className="text-foreground">Abierta</strong>.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
