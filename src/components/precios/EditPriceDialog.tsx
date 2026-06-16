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
import { useCapturaPrecio } from '@/hooks/useCapturaPrecio';
import type { SDTPrecios, GuardarPrecioFormData, CategoriaPrecioItem } from '@/types/precios';
import { Loader2, Save } from 'lucide-react';

// ── Validation ──────────────────────────────────────────────────────────────

const HORA_REGEX = /^[0-2][0-4]:[0-5][0-9]$/;

interface FieldErrors {
  horaFin?: string;
  precioItem?: string;
  descPorcentaje?: string;
  descMax?: string;
}

function validateFields(params: {
  horaFin: string;
  precioItemStr: string;
  descPorcentajeStr: string;
  descMaxStr: string;
  showHora: boolean;
  showDescuento: boolean;
  precioFallback: number;
}): FieldErrors {
  const { horaFin, precioItemStr, descPorcentajeStr, descMaxStr, showHora, showDescuento, precioFallback } = params;
  const errors: FieldErrors = {};

  if (showHora && horaFin && !HORA_REGEX.test(horaFin)) {
    errors.horaFin = 'Formato inválido. Use HH:mm entre 00:00 y 24:59.';
  }

  // Precio vacío = conservar el valor original; solo validar si el usuario ingresó algo.
  const precio = precioItemStr !== '' ? parseFloat(precioItemStr) : precioFallback;
  if (precioItemStr !== '' && (isNaN(precio) || precio < 0)) {
    errors.precioItem = 'Ingresa un precio válido (≥ 0).';
  }

  if (showDescuento) {
    const descP = parseFloat(descPorcentajeStr);
    if (!isNaN(descP) && descP < 0) {
      errors.descPorcentaje = 'El descuento no puede ser negativo.';
    }
    const descM = parseFloat(descMaxStr);
    if (!isNaN(descM)) {
      if (descM < 0) {
        errors.descMax = 'El descuento máximo no puede ser negativo.';
      } else if (!isNaN(precio) && precio >= 0 && descM >= precio) {
        errors.descMax = `El descuento máximo debe ser menor al precio ($${precio.toFixed(2)}).`;
      }
    }
  }

  return errors;
}

// ── Component ───────────────────────────────────────────────────────────────

interface EditPriceDialogProps {
  open: boolean;
  item: SDTPrecios | null;
  categorias: CategoriaPrecioItem[];
  saving: boolean;
  onSave: (item: SDTPrecios, formData: GuardarPrecioFormData) => void;
  onClose: () => void;
}

export function EditPriceDialog({
  open,
  item,
  categorias,
  saving,
  onSave,
  onClose,
}: EditPriceDialogProps) {
  const flags = useCapturaPrecio();

  const [horaFin, setHoraFin] = useState('');
  const [precioItem, setPrecioItem] = useState('');
  const [descPorcentaje, setDescPorcentaje] = useState('');
  const [descMax, setDescMax] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearError = (field: keyof FieldErrors) =>
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  useEffect(() => {
    if (open && item) {
      const toHHmm = (val: string): string => {
        if (!val) return '24:00';
        return val.length > 5 ? val.slice(0, 5) : val;
      };
      setHoraFin(toHHmm(item.PrecioHoraFin));
      setPrecioItem(Number(item.PrecioItem).toFixed(2));
      setDescPorcentaje(Number(item.PrecioDescuentoPorcentaje).toFixed(2));
      setDescMax(Number(item.PrecioDescuentoMax).toFixed(2));
      setFieldErrors({});
    }
  }, [open, item]);

  useEffect(() => {
    if (!open) {
      setHoraFin('');
      setPrecioItem('');
      setDescPorcentaje('');
      setDescMax('');
      setFieldErrors({});
    }
  }, [open]);

  const handleSave = () => {
    if (!item) return;

    const errors = validateFields({
      horaFin,
      precioItemStr: precioItem,
      descPorcentajeStr: descPorcentaje,
      descMaxStr: descMax,
      showHora: flags.showHora,
      showDescuento: flags.showDescuento,
      precioFallback: Number(item.PrecioItem),
    });

    if (Object.keys(errors).some((k) => errors[k as keyof FieldErrors])) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Campos bloqueados en edit provienen del item original (opaque identity rule)
    const formData: GuardarPrecioFormData = {
      ubiCod: item.PrecioUbiCod,
      categoriaPrecioIdl: item.CategoriaPrecioIdl,
      precioCantidad: item.PrecioCantidad,
      precioHoraInicio: item.PrecioHoraInicio,
      precioHoraFin: flags.showHora ? horaFin : item.PrecioHoraFin,
      precioTimeFin: item.PrecioTimeFin,
      precioValor: precioItem !== '' ? parseFloat(precioItem) : Number(item.PrecioItem),
      precioDescuentoPorcentaje: flags.showDescuento ? (parseFloat(descPorcentaje) || 0) : 0,
      precioDescuentoMax: flags.showDescuento ? (parseFloat(descMax) || 0) : 0,
    };

    onSave(item, formData);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !saving) onClose();
  };

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

        {item ? (
          <div className="space-y-4 overflow-y-auto min-h-0">

            {/* ── Read-only summary panel ─────────────────────────────── */}
            <div className="rounded-lg bg-muted px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">

              {/* Producto — always visible */}
              <div className="col-span-2 space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Producto</p>
                <p className="text-sm text-foreground font-medium truncate">
                  {item.ProductoDescripcion}
                </p>
              </div>

              {/* PrecioUbiCod — siempre oculto en modo edición (spec) */}

              {/* ProductoUnidadMedida — siempre disabled; visible cuando showCantidad */}
              {flags.showCantidad && item.PrecioUnidadMedida && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">U. Medida</p>
                  <p className="text-sm text-foreground">{item.PrecioUnidadMedida}</p>
                </div>
              )}

              {/* PrecioCantidad — bloqueado en edición; visible cuando showCantidad */}
              {flags.showCantidad && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Cantidad</p>
                  <p className="text-sm text-foreground font-mono">{item.PrecioCantidad}</p>
                </div>
              )}

              {/* PrecioTimeInicio — visible cuando showVigenciaIni */}
              {flags.showVigenciaIni && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Inicio Vigencia</p>
                  <p className="text-sm text-foreground font-mono">
                    {item.PrecioTimeInicio
                      ? item.PrecioTimeInicio.slice(0, 16).replace('T', ' ')
                      : '—'}
                  </p>
                </div>
              )}

              {/* PrecioTimeFin — bloqueado en edición; visible cuando showVigenciaFin */}
              {flags.showVigenciaFin && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Fin Vigencia</p>
                  <p className="text-sm text-foreground font-mono">
                    {item.PrecioTimeFin
                      ? item.PrecioTimeFin.slice(0, 16).replace('T', ' ')
                      : '—'}
                  </p>
                </div>
              )}

              {/* CategoriaPrecioIdl — bloqueado en edición; visible cuando showCategoria */}
              {flags.showCategoria && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Categoría Precio</p>
                  <p className="text-sm text-foreground">
                    {categorias.find((c) => c.CategoriaPrecioIdl === item.CategoriaPrecioIdl)
                      ?.CategoriaPrecioDescripcion ?? (item.CategoriaPrecioIdl || '—')}
                  </p>
                </div>
              )}

              {/* PrecioHoraInicio — read-only display; visible cuando showHora */}
              {flags.showHora && (
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Hora Inicio</p>
                  <p className="text-sm text-foreground font-mono">
                    {item.PrecioHoraInicio || '—'}
                  </p>
                </div>
              )}
            </div>

            {/* ── Editable fields ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">

              {/* PrecioHoraFin — editable cuando showHora */}
              {flags.showHora && (
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
                    aria-describedby={fieldErrors.horaFin ? 'err-hora-fin' : undefined}
                    aria-invalid={!!fieldErrors.horaFin}
                    onChange={(e) => { setHoraFin(e.target.value); clearError('horaFin'); }}
                  />
                  {fieldErrors.horaFin && (
                    <p id="err-hora-fin" role="alert" className="text-xs text-destructive font-medium">
                      {fieldErrors.horaFin}
                    </p>
                  )}
                </div>
              )}

              {/* PrecioItem — siempre visible */}
              <div className={flags.showHora ? 'space-y-1.5' : 'col-span-2 space-y-1.5'}>
                <label htmlFor="edit-precio" className="text-sm font-medium text-foreground">
                  Precio Item
                </label>
                <Input
                  id="edit-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  className="font-mono text-base border-2 border-brand-200 focus-visible:border-primary"
                  placeholder="0.00"
                  value={precioItem}
                  aria-describedby={fieldErrors.precioItem ? 'err-precio' : undefined}
                  aria-invalid={!!fieldErrors.precioItem}
                  onChange={(e) => { setPrecioItem(e.target.value); clearError('precioItem'); }}
                />
                {fieldErrors.precioItem && (
                  <p id="err-precio" role="alert" className="text-xs text-destructive font-medium">
                    {fieldErrors.precioItem}
                  </p>
                )}
              </div>

              {/* Descuento % + Descuento Máx. — visibles cuando showDescuento */}
              {flags.showDescuento && (
                <>
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
                      aria-describedby={fieldErrors.descPorcentaje ? 'err-desc-p' : undefined}
                      aria-invalid={!!fieldErrors.descPorcentaje}
                      onChange={(e) => { setDescPorcentaje(e.target.value); clearError('descPorcentaje'); }}
                    />
                    {fieldErrors.descPorcentaje && (
                      <p id="err-desc-p" role="alert" className="text-xs text-destructive font-medium">
                        {fieldErrors.descPorcentaje}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-desc-max" className="text-sm font-medium text-foreground">
                      Descuento Máx.
                    </label>
                    <Input
                      id="edit-desc-max"
                      type="number"
                      step="0.01"
                      min="0"
                      className="font-mono border-2 border-brand-200 focus-visible:border-primary"
                      placeholder="0.00"
                      value={descMax}
                      aria-describedby={fieldErrors.descMax ? 'err-desc-max' : undefined}
                      aria-invalid={!!fieldErrors.descMax}
                      onChange={(e) => { setDescMax(e.target.value); clearError('descMax'); }}
                    />
                    {fieldErrors.descMax && (
                      <p id="err-desc-max" role="alert" className="text-xs text-destructive font-medium">
                        {fieldErrors.descMax}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !item}>
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
