import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2, Percent, DollarSign, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCarrito } from '@/hooks/useCarrito';
import { interpretPosError } from '@/services/apiClient';

interface DescuentoGlobalDialogProps {
  open: boolean;
  notaVentaKey: number;
  onClose: () => void;
}

export function DescuentoGlobalDialog({ open, notaVentaKey, onClose }: DescuentoGlobalDialogProps) {
  const { setDescuentoGlobal } = useCarrito();
  const [esPorcentaje, setEsPorcentaje] = useState(true);
  const [valor, setValor] = useState('');
  const [glosa, setGlosa] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSaving) {
      setValor('');
      setGlosa('');
      onClose();
    }
  };

  const aplicar = async (descuentoPorcentaje: number, descuentoTotal: number) => {
    setIsSaving(true);
    try {
      // ⚠️ GeneXus recalcula el descuento de forma perezosa: el Delta de esta
      // respuesta puede no reflejar todavía el nuevo total — se refleja recién
      // en la siguiente mutación de carrito. No es un error si el total no cambia aquí.
      await setDescuentoGlobal({
        notaVentaKey,
        descuentoEsPorcentaje: esPorcentaje,
        descuentoPorcentaje,
        descuentoTotal,
        glosaContenido: glosa || undefined,
      });
      toast.success('Descuento aplicado — el total puede tardar en reflejarse hasta el próximo cambio del carrito');
      handleOpenChange(false);
    } catch (err) {
      toast.error(interpretPosError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAplicar = () => {
    const num = parseFloat(valor);
    if (isNaN(num) || num < 0) return;
    void aplicar(esPorcentaje ? num : 0, esPorcentaje ? 0 : num);
  };

  const handleQuitar = () => void aplicar(0, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">Descuento Global</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Aplica un descuento a toda la nota de venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-border/60" role="group" aria-label="Tipo de descuento">
            <button
              type="button"
              onClick={() => setEsPorcentaje(true)}
              aria-pressed={esPorcentaje}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-9 text-sm font-medium',
                esPorcentaje ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <Percent size={14} /> Porcentaje
            </button>
            <button
              type="button"
              onClick={() => setEsPorcentaje(false)}
              aria-pressed={!esPorcentaje}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-9 text-sm font-medium',
                !esPorcentaje ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <DollarSign size={14} /> Monto fijo
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc-valor">{esPorcentaje ? 'Porcentaje (%)' : 'Monto ($)'}</Label>
            <Input
              id="desc-valor"
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc-glosa">Glosa (opcional)</Label>
            <Input id="desc-glosa" value={glosa} onChange={(e) => setGlosa(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <Button type="button" variant="outline" onClick={handleQuitar} disabled={isSaving}>
            <X className="w-4 h-4" /> Quitar descuento
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleAplicar} disabled={isSaving || !valor}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Aplicar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
