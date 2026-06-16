import { useState, useEffect, useRef } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getProductosBuscador } from '@/services/apiClient';
import { useCapturaPrecio } from '@/hooks/useCapturaPrecio';
import type { ProductoSearchSDT, UbicacionItem, GuardarPrecioFormData, CategoriaPrecioItem } from '@/types/precios';
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Loader2,
  PackageSearch,
} from 'lucide-react';

// ── Validation ──────────────────────────────────────────────────────────────

const HORA_REGEX = /^[0-2][0-4]:[0-5][0-9]$/;

interface CreateFieldErrors {
  horaInicio?: string;
  horaFin?: string;
  precioCantidad?: string;
  precioValor?: string;
  descPorcentaje?: string;
  descMax?: string;
  ubiCod?: string;
}

interface CreateForm {
  ubiCod: string;
  categoriaPrecioIdl: string;
  precioCantidad: string;
  precioHoraInicio: string;
  precioHoraFin: string;
  precioTimeFin: string;
  precioValor: string;
  descPorcentaje: string;
  descMax: string;
}

const EMPTY_FORM: CreateForm = {
  ubiCod: '',
  categoriaPrecioIdl: '',
  precioCantidad: '1',
  precioHoraInicio: '00:00',
  precioHoraFin: '24:00',
  precioTimeFin: '',
  precioValor: '',
  descPorcentaje: '',
  descMax: '',
};

function validateCreate(
  form: CreateForm,
  flags: ReturnType<typeof useCapturaPrecio>,
  requireUbicacion: boolean,
): CreateFieldErrors {
  const errors: CreateFieldErrors = {};

  if (requireUbicacion && !form.ubiCod) {
    errors.ubiCod = 'Selecciona una ubicación.';
  }

  if (flags.showHora) {
    if (form.precioHoraInicio && !HORA_REGEX.test(form.precioHoraInicio)) {
      errors.horaInicio = 'Formato inválido. Use HH:mm entre 00:00 y 24:59.';
    }
    if (form.precioHoraFin && !HORA_REGEX.test(form.precioHoraFin)) {
      errors.horaFin = 'Formato inválido. Use HH:mm entre 00:00 y 24:59.';
    }
  }

  if (flags.showCantidad) {
    const cant = parseFloat(form.precioCantidad);
    if (form.precioCantidad !== '' && (isNaN(cant) || cant < 0)) {
      errors.precioCantidad = 'La cantidad no puede ser negativa.';
    }
  }

  const valor = parseFloat(form.precioValor);
  if (isNaN(valor) || valor <= 0) {
    errors.precioValor = 'El precio debe ser mayor a $0.';
  }

  if (flags.showDescuento) {
    const descP = parseFloat(form.descPorcentaje);
    if (form.descPorcentaje !== '' && !isNaN(descP) && descP < 0) {
      errors.descPorcentaje = 'El descuento no puede ser negativo.';
    }
    const descM = parseFloat(form.descMax);
    if (form.descMax !== '' && !isNaN(descM)) {
      if (descM < 0) {
        errors.descMax = 'El descuento máximo no puede ser negativo.';
      } else if (!isNaN(valor) && valor > 0 && descM >= valor) {
        errors.descMax = `El descuento máximo debe ser menor al precio ($${valor.toFixed(2)}).`;
      }
    }
  }

  return errors;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface CreatePriceDialogProps {
  open: boolean;
  onClose: () => void;
  ubicaciones: UbicacionItem[];
  categorias: CategoriaPrecioItem[];
  selectedProduct: ProductoSearchSDT | null;
  saving: boolean;
  baseUbiCod: string;
  onSelectProduct: (product: ProductoSearchSDT) => void;
  onClearProduct: () => void;
  onCreatePrecio: (formData: GuardarPrecioFormData) => void;
}

type Step = 1 | 2;

// ── Component ───────────────────────────────────────────────────────────────

export function CreatePriceDialog({
  open,
  onClose,
  ubicaciones,
  categorias,
  selectedProduct,
  saving,
  baseUbiCod,
  onSelectProduct,
  onClearProduct,
  onCreatePrecio,
}: CreatePriceDialogProps) {
  const flags = useCapturaPrecio();
  const validUbicaciones = ubicaciones.filter((u) => u.UbiCod);
  const validCategorias = categorias.filter((c) => c.CategoriaPrecioIdl);
  // Ubicación requerida solo cuando el perfil tiene una ubicación asignada (baseUbiCod !== '').
  // En perfiles de administración (baseUbiCod === ''), enviar vacío significa "todas las ubicaciones".
  const requireUbicacion = flags.showUbicacion && validUbicaciones.length > 0 && baseUbiCod !== '';

  const [step, setStep] = useState<Step>(1);

  // Step 1 — product search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductoSearchSDT[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Step 2 — price form
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<CreateFieldErrors>({});
  const [precioTimeInicio, setPrecioTimeInicio] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof CreateForm>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key === 'precioHoraInicio' ? 'horaInicio' : key === 'precioHoraFin' ? 'horaFin' : key === 'descPorcentaje' ? 'descPorcentaje' : key]: undefined }));
  };

  const clearError = (key: keyof CreateFieldErrors) =>
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));

  // Full reset whenever the dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setQuery('');
      setResults([]);
      setSearching(false);
      setSearchError(null);
      setForm(EMPTY_FORM);
      setFieldErrors({});
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setPrecioTimeInicio(
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}`
      );
      onClearProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-focus search on step 1
  useEffect(() => {
    if (open && step === 1) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open, step]);

  // Debounced product search (300 ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    setSearchError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getProductosBuscador(query.trim());
        setResults(res.ProductoSearchSDT ?? []);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Error al buscar productos.');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelectProduct = (product: ProductoSearchSDT) => {
    onSelectProduct(product);
    setStep(2);
  };

  const handleBack = () => {
    onClearProduct();
    setFieldErrors({});
    setStep(1);
  };

  const handleSubmit = () => {
    const errors = validateCreate(form, flags, requireUbicacion);
    if (Object.keys(errors).some((k) => errors[k as keyof CreateFieldErrors])) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const formData: GuardarPrecioFormData = {
      ubiCod: form.ubiCod,
      categoriaPrecioIdl: flags.showCategoria ? form.categoriaPrecioIdl : '',
      // Capa de traducción UI→Backend: el usuario ve "1 unidad" como precio base,
      // pero GeneXus reserva PrecioCantidad=0 para el precio base (legacy invariant).
      // Cualquier valor <= 1 se envía como 0; valores >= 2 son escalas de volumen.
      precioCantidad: (() => {
        if (!flags.showCantidad) return 0;
        const ui = parseFloat(form.precioCantidad);
        const cant = isNaN(ui) ? 1 : ui;
        return cant < 2 ? 0 : cant;
      })(),
      precioHoraInicio: flags.showHora ? form.precioHoraInicio : '00:00',
      precioHoraFin: flags.showHora ? form.precioHoraFin : '24:00',
      precioTimeFin: flags.showVigenciaFin ? form.precioTimeFin : '',
      precioValor: parseFloat(form.precioValor),
      precioDescuentoPorcentaje: flags.showDescuento ? (parseFloat(form.descPorcentaje) || 0) : 0,
      precioDescuentoMax: flags.showDescuento ? (parseFloat(form.descMax) || 0) : 0,
    };
    onCreatePrecio(formData);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !saving) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                aria-label="Volver al buscador de productos"
                onClick={handleBack}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            Nuevo Precio
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1
              ? 'Busca y selecciona el producto al que deseas asignar un precio.'
              : 'Completa los datos del nuevo precio.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1 ── Product search ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-3 py-1 overflow-y-auto min-h-0">
            <p className="text-xs text-muted-foreground">Paso 1 de 2</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                ref={searchInputRef}
                type="search"
                className="pl-10"
                placeholder="Buscar por código o descripción..."
                aria-label="Buscar producto"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div
              className="min-h-[200px] max-h-[320px] overflow-y-auto rounded-lg border border-border"
              aria-live="polite"
              aria-busy={searching}
            >
              {searching ? (
                <div className="flex items-center justify-center gap-2 h-24 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span className="text-sm">Buscando...</span>
                </div>
              ) : searchError ? (
                <div className="m-3 px-4 py-3 bg-danger-50 border border-destructive rounded-lg">
                  <p className="text-destructive text-sm">{searchError}</p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 h-24 text-muted-foreground">
                  <PackageSearch className="w-6 h-6" aria-hidden="true" />
                  <span className="text-sm">
                    {query.trim() ? 'Sin resultados para esa búsqueda' : 'Escribe para buscar productos'}
                  </span>
                </div>
              ) : (
                <ul role="listbox" aria-label="Resultados de búsqueda de productos">
                  {results.map((product, idx) => (
                    <li key={`${product.ProductoKey}-${product.MItemCodVal}-${idx}`} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-accent"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.ProductoDescripcion}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.TipoCodDes}: {product.MItemCodVal}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {results.length === 50 && (
              <p className="text-xs text-muted-foreground text-center">
                Se muestran los primeros 50 resultados. Refina tu búsqueda para ver más.
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2 ── Price form ──────────────────────────────────────── */}
        {step === 2 && selectedProduct && (
          <div className="space-y-4 py-1 overflow-y-auto min-h-0">
            <p className="text-xs text-muted-foreground">Paso 2 de 2</p>

            {/* Product summary */}
            <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{selectedProduct.ProductoDescripcion}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedProduct.TipoCodDes}: {selectedProduct.MItemCodVal}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* PrecioTimeInicio — display only */}
              {flags.showVigenciaIni && (
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="new-inicio" className="text-sm font-medium text-foreground">
                    Inicio Vigencia
                  </label>
                  <Input
                    id="new-inicio"
                    disabled
                    readOnly
                    aria-label="Inicio de vigencia (calculado automáticamente)"
                    className="font-mono bg-muted text-muted-foreground cursor-not-allowed"
                    value={precioTimeInicio}
                  />
                </div>
              )}

              {/* PrecioTimeFin */}
              {flags.showVigenciaFin && (
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="new-fin" className="text-sm font-medium text-foreground">
                    Fin Vigencia
                  </label>
                  <Input
                    id="new-fin"
                    type="datetime-local"
                    className="font-mono"
                    value={form.precioTimeFin}
                    onChange={(e) => setField('precioTimeFin', e.target.value)}
                  />
                </div>
              )}

              {/* PrecioHoraInicio + PrecioHoraFin */}
              {flags.showHora && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="new-hora-ini" className="text-sm font-medium text-foreground">
                      Hora Inicio
                    </label>
                    <Input
                      id="new-hora-ini"
                      type="text"
                      inputMode="numeric"
                      className="font-mono"
                      placeholder="HH:mm"
                      maxLength={5}
                      value={form.precioHoraInicio}
                      aria-describedby={fieldErrors.horaInicio ? 'err-hora-ini' : undefined}
                      aria-invalid={!!fieldErrors.horaInicio}
                      onChange={(e) => { setField('precioHoraInicio', e.target.value); clearError('horaInicio'); }}
                    />
                    {fieldErrors.horaInicio && (
                      <p id="err-hora-ini" role="alert" className="text-xs text-destructive font-medium">{fieldErrors.horaInicio}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="new-hora-fin" className="text-sm font-medium text-foreground">
                      Hora Fin
                    </label>
                    <Input
                      id="new-hora-fin"
                      type="text"
                      inputMode="numeric"
                      className="font-mono"
                      placeholder="HH:mm"
                      maxLength={5}
                      value={form.precioHoraFin}
                      aria-describedby={fieldErrors.horaFin ? 'err-hora-fin' : undefined}
                      aria-invalid={!!fieldErrors.horaFin}
                      onChange={(e) => { setField('precioHoraFin', e.target.value); clearError('horaFin'); }}
                    />
                    {fieldErrors.horaFin && (
                      <p id="err-hora-fin" role="alert" className="text-xs text-destructive font-medium">{fieldErrors.horaFin}</p>
                    )}
                  </div>
                </>
              )}

              {/* UbiCod */}
              {flags.showUbicacion && validUbicaciones.length > 0 && (
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="new-ubicacion" className="text-sm font-medium text-foreground">
                    Ubicación{requireUbicacion && <span className="text-destructive" aria-hidden="true"> *</span>}
                  </label>
                  <Select
                    value={form.ubiCod}
                    onValueChange={(v) => { setField('ubiCod', v); clearError('ubiCod'); }}
                  >
                    <SelectTrigger
                      id="new-ubicacion"
                      className="w-full"
                      aria-describedby={fieldErrors.ubiCod ? 'err-ubicacion' : undefined}
                      aria-invalid={!!fieldErrors.ubiCod}
                    >
                      <SelectValue placeholder="Seleccionar ubicación..." />
                    </SelectTrigger>
                    <SelectContent>
                      {validUbicaciones.map((u) => (
                        <SelectItem key={u.UbiCod} value={u.UbiCod}>
                          {u.UbiNom} ({u.UbiCod})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.ubiCod && (
                    <p id="err-ubicacion" role="alert" className="text-xs text-destructive font-medium">{fieldErrors.ubiCod}</p>
                  )}
                </div>
              )}

              {/* CategoriaPrecioIdl */}
              {flags.showCategoria && (
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="new-categoria" className="text-sm font-medium text-foreground">
                    Categoría Precio
                  </label>
                  <Select
                    value={form.categoriaPrecioIdl || '__none__'}
                    onValueChange={(v) => setField('categoriaPrecioIdl', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger id="new-categoria" className="w-full">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin categoría</SelectItem>
                      {validCategorias.map((cat) => (
                        <SelectItem key={cat.CategoriaPrecioIdl} value={cat.CategoriaPrecioIdl}>
                          {cat.CategoriaPrecioDescripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* PrecioCantidad */}
              {flags.showCantidad && (
                <div className="space-y-1.5">
                  <label htmlFor="new-cantidad" className="text-sm font-medium text-foreground">
                    Cantidad
                  </label>
                  <Input
                    id="new-cantidad"
                    type="number"
                    min="0"
                    step="1"
                    className="font-mono"
                    placeholder="0"
                    value={form.precioCantidad}
                    aria-describedby={fieldErrors.precioCantidad ? 'err-cantidad' : undefined}
                    aria-invalid={!!fieldErrors.precioCantidad}
                    onChange={(e) => { setField('precioCantidad', e.target.value); clearError('precioCantidad'); }}
                  />
                  {fieldErrors.precioCantidad && (
                    <p id="err-cantidad" role="alert" className="text-xs text-destructive font-medium">{fieldErrors.precioCantidad}</p>
                  )}
                </div>
              )}

              {/* PrecioValor */}
              <div className={flags.showCantidad ? 'space-y-1.5' : 'col-span-2 space-y-1.5'}>
                <label htmlFor="new-precio" className="text-sm font-medium text-foreground">
                  Precio unitario <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Input
                  id="new-precio"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="font-mono text-base"
                  placeholder="0.00"
                  value={form.precioValor}
                  aria-describedby={fieldErrors.precioValor ? 'err-precio' : undefined}
                  aria-invalid={!!fieldErrors.precioValor}
                  onChange={(e) => { setField('precioValor', e.target.value); clearError('precioValor'); }}
                />
                {fieldErrors.precioValor && (
                  <p id="err-precio" role="alert" className="text-xs text-destructive font-medium">{fieldErrors.precioValor}</p>
                )}
              </div>

              {/* Descuento % + Descuento Máx. */}
              {flags.showDescuento && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="new-desc-p" className="text-sm font-medium text-foreground">
                      Descuento %
                    </label>
                    <Input
                      id="new-desc-p"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="font-mono"
                      placeholder="0.00"
                      value={form.descPorcentaje}
                      aria-describedby={fieldErrors.descPorcentaje ? 'err-desc-p' : undefined}
                      aria-invalid={!!fieldErrors.descPorcentaje}
                      onChange={(e) => { setField('descPorcentaje', e.target.value); clearError('descPorcentaje'); }}
                    />
                    {fieldErrors.descPorcentaje && (
                      <p id="err-desc-p" role="alert" className="text-xs text-destructive font-medium">{fieldErrors.descPorcentaje}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="new-desc-max" className="text-sm font-medium text-foreground">
                      Descuento Máx.
                    </label>
                    <Input
                      id="new-desc-max"
                      type="number"
                      step="0.01"
                      min="0"
                      className="font-mono"
                      placeholder="0.00"
                      value={form.descMax}
                      aria-describedby={fieldErrors.descMax ? 'err-desc-max' : undefined}
                      aria-invalid={!!fieldErrors.descMax}
                      onChange={(e) => { setField('descMax', e.target.value); clearError('descMax'); }}
                    />
                    {fieldErrors.descMax && (
                      <p id="err-desc-max" role="alert" className="text-xs text-destructive font-medium">{fieldErrors.descMax}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          {step === 2 && (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                'Crear Precio'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
