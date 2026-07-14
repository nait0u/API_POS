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
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCarrito } from '@/hooks/useCarrito';
import { interpretPosError } from '@/services/apiClient';

interface GlosaCabeceraDialogProps {
  open: boolean;
  notaVentaKey: number;
  glosaActual: string;
  isLoadingGlosa?: boolean;
  onClose: () => void;
  onSaved?: (glosa: string) => void;
}

export function GlosaCabeceraDialog({
  open,
  notaVentaKey,
  glosaActual,
  isLoadingGlosa = false,
  onClose,
  onSaved,
}: GlosaCabeceraDialogProps) {
  const { setGlosaCabecera } = useCarrito();
  const [glosa, setGlosa] = useState(glosaActual);
  const [isSaving, setIsSaving] = useState(false);

  // Se inicializa con el valor persistido en el estado global de la nota de
  // venta cada vez que el modal se abre — nunca sobreescribe con blanco si
  // isLoadingGlosa todavía está resolviendo la carga desde el backend.
  useEffect(() => {
    if (open && !isLoadingGlosa) setGlosa(glosaActual);
  }, [open, isLoadingGlosa, glosaActual]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSaving) onClose();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setGlosaCabecera({ notaVentaKey, notaVentaGlosa: glosa });
      onSaved?.(glosa);
      toast.success('Glosa guardada');
      onClose();
    } catch (err) {
      toast.error(interpretPosError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">Glosa</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Comentario general de la nota de venta (no por línea de producto).
          </DialogDescription>
        </DialogHeader>

        {isLoadingGlosa ? (
          <div className="w-full h-[92px] rounded-md border border-border/60 bg-card flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <textarea
            value={glosa}
            onChange={(e) => setGlosa(e.target.value)}
            rows={4}
            placeholder="Escribe un comentario..."
            aria-label="Glosa de la nota de venta"
            className="w-full rounded-md border border-border/60 bg-card text-foreground text-sm p-3 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 resize-none"
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving || isLoadingGlosa}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
