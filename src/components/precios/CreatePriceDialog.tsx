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
import type { ProductoSearchSDT, UbicacionItem } from '@/types/precios';
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Loader2,
  PackageSearch,
} from 'lucide-react';

interface CreatePriceDialogProps {
  open: boolean;
  onClose: () => void;
  empKey: number;
  ubicaciones: UbicacionItem[];
  selectedProduct: ProductoSearchSDT | null;
  saving: boolean;
  onSelectProduct: (product: ProductoSearchSDT) => void;
  onClearProduct: () => void;
  onCreatePrecio: (precioValor: number, ubiCod: string) => void;
}

type Step = 1 | 2;

export function CreatePriceDialog({
  open,
  onClose,
  empKey,
  ubicaciones,
  selectedProduct,
  saving,
  onSelectProduct,
  onClearProduct,
  onCreatePrecio,
}: CreatePriceDialogProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 — product search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductoSearchSDT[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Step 2 — price form
  const [precioValor, setPrecioValor] = useState('');
  const [ubiCod, setUbiCod] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Full reset whenever the dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setQuery('');
      setResults([]);
      setSearching(false);
      setSearchError(null);
      setPrecioValor('');
      setUbiCod('');
      setFormError(null);
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

    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getProductosBuscador(empKey, query.trim());
        setResults(res.ProductoSearchSDT ?? []);
      } catch (err) {
        setSearchError(
          err instanceof Error ? err.message : 'Error al buscar productos.'
        );
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, empKey]);

  const handleSelectProduct = (product: ProductoSearchSDT) => {
    onSelectProduct(product);
    setStep(2);
  };

  const handleBack = () => {
    onClearProduct();
    setFormError(null);
    setStep(1);
  };

  const handleSubmit = () => {
    const valor = parseFloat(precioValor);
    if (isNaN(valor) || valor <= 0) {
      setFormError('El precio debe ser mayor a $0.');
      return;
    }
    if (ubicaciones.length > 0 && !ubiCod) {
      setFormError('Selecciona una ubicación.');
      return;
    }
    setFormError(null);
    onCreatePrecio(valor, ubiCod);
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
            {step === 1
              ? 'Nuevo Precio — Buscar Producto'
              : 'Nuevo Precio — Datos del Precio'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1
              ? 'Busca y selecciona el producto al que deseas asignar un precio.'
              : 'Completa los datos del nuevo precio.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1 ── Product search ───────────────────────────── */}
        {step === 1 && (
          <div className="space-y-3 py-1 overflow-y-auto min-h-0">
            <p className="text-xs text-muted-foreground">Paso 1 de 2</p>

            {/* Search input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
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

            {/* Results list */}
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
                    {query.trim()
                      ? 'Sin resultados para esa búsqueda'
                      : 'Escribe para buscar productos'}
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
                          <p className="text-sm font-medium text-foreground truncate">
                            {product.ProductoDescripcion}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {product.TipoCodDes}: {product.MItemCodVal}
                          </p>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 text-muted-foreground shrink-0 ml-3"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {results.length === 50 && (
              <p className="text-xs text-muted-foreground text-center">
                Se muestran los primeros 50 resultados. Refina tu búsqueda para
                ver más.
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2 ── Price form ───────────────────────────────── */}
        {step === 2 && selectedProduct && (
          <div className="space-y-4 py-1 overflow-y-auto min-h-0">
            <p className="text-xs text-muted-foreground">Paso 2 de 2</p>

            {/* Selected product summary */}
            <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {selectedProduct.ProductoDescripcion}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {selectedProduct.TipoCodDes}: {selectedProduct.MItemCodVal}
              </p>
            </div>

            {/* Ubicacion — only shown when there are valid options */}
            {ubicaciones.filter((u) => u.UbiCod).length > 0 && (
              <div className="space-y-1.5">
                <label
                  htmlFor="new-ubicacion"
                  className="text-sm font-medium text-foreground"
                >
                  Ubicación <span className="text-destructive" aria-hidden="true">*</span>
                </label>
                <Select value={ubiCod} onValueChange={setUbiCod}>
                  <SelectTrigger id="new-ubicacion" className="w-full">
                    <SelectValue placeholder="Seleccionar ubicación..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ubicaciones
                      .filter((u) => u.UbiCod)
                      .map((u) => (
                        <SelectItem key={u.UbiCod} value={u.UbiCod}>
                          {u.UbiNom} ({u.UbiCod})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* PrecioValor */}
            <div className="space-y-1.5">
              <label
                htmlFor="new-precio"
                className="text-sm font-medium text-foreground"
              >
                Precio unitario <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <Input
                id="new-precio"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="font-mono text-base"
                value={precioValor}
                onChange={(e) => {
                  setPrecioValor(e.target.value);
                  setFormError(null);
                }}
              />
            </div>

            {/* Validation error */}
            {formError && (
              <div
                role="alert"
                className="px-4 py-3 bg-danger-50 border border-destructive rounded-lg"
              >
                <p className="text-destructive text-sm font-medium">{formError}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
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
