import { useState, useEffect } from 'react';
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
import type { SDTPrecios } from '@/types/precios';
import { Loader2, Save } from 'lucide-react';

interface EditPriceDialogProps {
  open: boolean;
  item: SDTPrecios | null;
  precioChar: string | null;
  loading: boolean;
  saving: boolean;
  onSave: (precioChar: string, empKey: number, productoKey: number) => void;
  onClose: () => void;
}

export function EditPriceDialog({
  open,
  item,
  precioChar,
  loading,
  saving,
  onSave,
  onClose,
}: EditPriceDialogProps) {
  const [bc, setBc] = useState<Record<string, unknown> | null>(null);

  // Editable fields (mutable — not part of the PK)
  const [horaFin, setHoraFin] = useState('');
  const [precioItem, setPrecioItem] = useState('');
  const [descPorcentaje, setDescPorcentaje] = useState('');
  const [descMax, setDescMax] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Parse PrecioChar when it arrives
  useEffect(() => {
    if (precioChar) {
      try {
        const parsed = JSON.parse(precioChar) as Record<string, unknown>;
        setBc(parsed);

        // Strip seconds (HH:mm:ss → HH:mm), default if empty
        const toHHmm = (val: unknown, fallback: string): string => {
          const s = String(val ?? '').trim();
          if (!s) return fallback;
          return s.length > 5 ? s.slice(0, 5) : s;
        };
        setHoraFin(toHHmm(parsed.PrecioHoraFin, '24:00'));

        // Format numbers to 2 decimal places
        const toFixed2 = (val: unknown): string => {
          const n = typeof val === 'string' ? parseFloat(val) : Number(val);
          return isNaN(n) ? '' : n.toFixed(2);
        };
        setPrecioItem(toFixed2(parsed.PrecioItem));
        setDescPorcentaje(toFixed2(parsed.PrecioDescuentoPorcentaje));
        setDescMax(toFixed2(parsed.PrecioDescuentoMax));
        setFormError(null);
      } catch {
        setFormError('Error al parsear los datos del precio.');
        setBc(null);
      }
    }
  }, [precioChar]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setBc(null);
      setHoraFin('');
      setPrecioItem('');
      setDescPorcentaje('');
      setDescMax('');
      setFormError(null);
    }
  }, [open]);

  const handleSave = () => {
    if (!bc || !item) return;

    const precio = parseFloat(precioItem);
    if (isNaN(precio) || precio < 0) {
      setFormError('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }

    const descP = parseFloat(descPorcentaje) || 0;
    const descM = parseFloat(descMax) || 0;

    const updatedBc = {
      ...bc,
      PrecioHoraFin: horaFin,
      PrecioItem: precio,
      PrecioDescuentoPorcentaje: descP,
      PrecioDescuentoMax: descM,
    };

    setFormError(null);
    onSave(JSON.stringify(updatedBc), item.Empkey, item.ProductoKey);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !saving) onClose();
  };

  // Try to extract U. Medida from the BC (GeneXus field name varies)
  const unidadMedida = bc
    ? String(
        bc.UnidadMedida ??
          bc.ProductoUnidadMedida ??
          bc.UMed ??
          bc.ProductoUMed ??
          ''
      )
    : '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">
            Editar Precio
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Modifica los campos editables del precio seleccionado.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="text-base">Cargando datos del precio...</span>
          </div>
        ) : bc && item ? (
          <div className="space-y-4 overflow-y-auto min-h-0">
            {/* Read-only fields */}
            <div className="rounded-lg bg-muted px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Producto</p>
                <p className="text-sm text-foreground font-medium truncate">
                  {item.ProductoDescripcion}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Ubicación</p>
                <p className="text-sm text-foreground">
                  {item.Ubinom || item.PrecioUbiCod || '—'}
                </p>
              </div>
              {unidadMedida && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">U. Medida</p>
                  <p className="text-sm text-foreground">{unidadMedida}</p>
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Cantidad</p>
                <p className="text-sm text-foreground font-mono">{item.PrecioCantidad}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Inicio Vigencia</p>
                <p className="text-sm text-foreground font-mono">
                  {item.PrecioTimeInicio ? item.PrecioTimeInicio.slice(0, 16).replace('T', ' ') : '—'}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Categoría Precio</p>
                <p className="text-sm text-foreground font-mono">
                  {item.CategoriaPrecioIdl || '—'}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Hora Inicio</p>
                <p className="text-sm text-foreground font-mono">
                  {item.PrecioHoraInicio || '—'}
                </p>
              </div>
            </div>

            {/* Editable fields — border-2 border-brand-200 to signal editability */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-hora-fin" className="text-sm font-medium text-foreground">
                  Hora Fin
                </label>
                <Input
                  id="edit-hora-fin"
                  type="text"
                  inputMode="numeric"
                  className="font-mono border-2 border-brand-200 focus-visible:border-primary"
                  placeholder="HH:mm"
                  maxLength={5}
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-precio" className="text-sm font-medium text-foreground">
                  Precio Item <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Input
                  id="edit-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  className="font-mono text-base border-2 border-brand-200 focus-visible:border-primary"
                  placeholder="0.00"
                  value={precioItem}
                  onChange={(e) => {
                    setPrecioItem(e.target.value);
                    setFormError(null);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-desc-porcentaje" className="text-sm font-medium text-foreground">
                  Descuento %
                </label>
                <Input
                  id="edit-desc-porcentaje"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="font-mono border-2 border-brand-200 focus-visible:border-primary"
                  placeholder="0.00"
                  value={descPorcentaje}
                  onChange={(e) => setDescPorcentaje(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-desc-max" className="text-sm font-medium text-foreground">
                  Descuento Máx. %
                </label>
                <Input
                  id="edit-desc-max"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="font-mono border-2 border-brand-200 focus-visible:border-primary"
                  placeholder="0.00"
                  value={descMax}
                  onChange={(e) => setDescMax(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <div role="alert" className="px-4 py-3 bg-danger-50 border border-destructive rounded-lg">
                <p className="text-destructive text-sm font-medium">{formError}</p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving || loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !bc}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
