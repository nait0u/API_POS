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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCarrito } from '@/hooks/useCarrito';
import { useCatalogosXVenta } from '@/hooks/useCatalogosXVenta';
import { interpretPosError } from '@/services/apiClient';
import type { SDTTransportista } from '@/types/carrito';

interface TransportistaDialogProps {
  open: boolean;
  notaVentaKey: number;
  onClose: () => void;
}

const EMPTY_FORM: Partial<SDTTransportista> = {};

export function TransportistaDialog({ open, notaVentaKey, onClose }: TransportistaDialogProps) {
  const { setTransportista } = useCarrito();
  const { motivosTraslado, tiposTraslado } = useCatalogosXVenta();
  const [form, setForm] = useState<Partial<SDTTransportista>>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof SDTTransportista>(key: K, value: SDTTransportista[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSaving) {
      setForm(EMPTY_FORM);
      setError(null);
      onClose();
    }
  };

  const handleSave = async () => {
    if (form.motivoTraslado == null || form.tipoTraslado == null) {
      setError('Motivo y Tipo de traslado son obligatorios.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const sdtTransportista: SDTTransportista = {
        motivoTraslado: form.motivoTraslado,
        tipoTraslado: form.tipoTraslado,
        rutChofer: form.rutChofer || undefined,
        nombreChofer: form.nombreChofer || undefined,
        patente: form.patente || undefined,
        carroPatente: form.carroPatente || undefined,
        salidaFecha: form.salidaFecha || undefined,
        salidaHora: form.salidaHora || undefined,
        llegadaFecha: form.llegadaFecha || undefined,
        llegadaHora: form.llegadaHora,
      };
      await setTransportista({ notaVentaKey, sdtTransportista });
      toast.success('Datos de transportista guardados');
      handleOpenChange(false);
    } catch (err) {
      toast.error(interpretPosError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">Transportista</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Datos de traslado para guía de despacho.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="col-span-2 space-y-1.5">
            <Label>Motivo de traslado *</Label>
            <Select
              value={form.motivoTraslado != null ? String(form.motivoTraslado) : ''}
              onValueChange={(v) => setField('motivoTraslado', parseInt(v, 10))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                {motivosTraslado.items.map((item) => (
                  <SelectItem key={item.codigo} value={item.codigo}>
                    {item.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label>Tipo de traslado *</Label>
            <Select
              value={form.tipoTraslado != null ? String(form.tipoTraslado) : ''}
              onValueChange={(v) => setField('tipoTraslado', parseInt(v, 10))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {tiposTraslado.items.map((item) => (
                  <SelectItem key={item.codigo} value={item.codigo}>
                    {item.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tr-rut">RUT Chofer</Label>
            <Input id="tr-rut" value={form.rutChofer ?? ''} onChange={(e) => setField('rutChofer', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-nombre">Nombre Chofer</Label>
            <Input id="tr-nombre" value={form.nombreChofer ?? ''} onChange={(e) => setField('nombreChofer', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-patente">Patente</Label>
            <Input id="tr-patente" value={form.patente ?? ''} onChange={(e) => setField('patente', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-carro-patente">Patente Carro/Remolque</Label>
            <Input id="tr-carro-patente" value={form.carroPatente ?? ''} onChange={(e) => setField('carroPatente', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-salida-fecha">Fecha Salida</Label>
            <Input id="tr-salida-fecha" type="date" value={form.salidaFecha ?? ''} onChange={(e) => setField('salidaFecha', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-salida-hora">Hora Salida</Label>
            <Input id="tr-salida-hora" type="time" value={form.salidaHora ?? ''} onChange={(e) => setField('salidaHora', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-llegada-fecha">Fecha Llegada</Label>
            <Input id="tr-llegada-fecha" type="date" value={form.llegadaFecha ?? ''} onChange={(e) => setField('llegadaFecha', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            {/* ⚠️ llegadaHora es number en el DTO (a diferencia de salidaHora, que es string) —
                formato exacto sin confirmar contra un caso real de GeneXus. Input numérico
                simple por ahora; no asumir HHMM u otro formato sin validarlo. */}
            <Label htmlFor="tr-llegada-hora">Hora Llegada (numérico, formato sin confirmar)</Label>
            <Input
              id="tr-llegada-hora"
              type="number"
              value={form.llegadaHora ?? ''}
              onChange={(e) => setField('llegadaHora', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>

        {error && <p role="alert" className="text-xs text-destructive font-medium">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
