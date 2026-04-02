import { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2, Search, ArrowLeft, Plus } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { getProductosBuscador } from '../../services/apiClient';
import type { ProductoSearchSDT, UbicacionItem } from '../../types/precios';

interface EditPriceDrawerProps {
  open: boolean;
  loading: boolean;
  saving: boolean;
  precioChar: string | null;
  isNewMode: boolean;
  selectedProduct: ProductoSearchSDT | null;
  empKey: number;
  ubicaciones: UbicacionItem[];
  onClose: () => void;
  onSave: (precioChar: string, empKey: number, productoKey: number) => void;
  onSelectProduct: (producto: ProductoSearchSDT) => void;
  onClearProduct: () => void;
  onCreatePrecio: (precioValor: number, ubiCod: string) => void;
}

export function EditPriceDrawer({
  open, loading, saving, precioChar,
  isNewMode, selectedProduct, empKey, ubicaciones,
  onClose, onSave, onSelectProduct, onClearProduct, onCreatePrecio,
}: EditPriceDrawerProps) {

  // ── Edit-mode state ──
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── New-mode search state ──
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<ProductoSearchSDT[]>([]);
  const [searching, setSearching] = useState(false);
  const [newPrecioValor, setNewPrecioValor] = useState('');
  const [newUbiCod, setNewUbiCod] = useState('');
  const [newPrecioError, setNewPrecioError] = useState('');

  const debouncedSearch = useDebounce(searchText, 300);

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setSearchText('');
      setSearchResults([]);
      setNewPrecioValor('');
      setNewUbiCod('');
      setNewPrecioError('');
    }
  }, [open]);

  // Fetch products on debounced search
  useEffect(() => {
    if (!isNewMode || !debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const result = await getProductosBuscador(empKey, debouncedSearch);
        if (!cancelled) setSearchResults(result.ProductoSearchSDT || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSearch, isNewMode, empKey]);

  // ── Edit mode: parse precioChar ──
  useEffect(() => {
    if (precioChar) {
      try {
        const parsed = JSON.parse(precioChar);
        // Default hora fin to 24:00 if empty
        if (!parsed.PrecioHoraFin) parsed.PrecioHoraFin = '24:00';
        // Limit precio to 2 decimals
        if (parsed.PrecioItem !== undefined && parsed.PrecioItem !== '') {
          parsed.PrecioItem = Math.round(Number(parsed.PrecioItem) * 100) / 100;
        }
        setFormData(parsed);
        setErrors({});
      } catch { setFormData({}); }
    }
  }, [precioChar]);

  const setField = useCallback((key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (formData.PrecioItem === undefined || formData.PrecioItem === '' || Number(formData.PrecioItem) < 0) errs.PrecioItem = 'Precio debe ser ≥ 0';
    const desc = Number(formData.PrecioDescuentoPorcentaje);
    if (isNaN(desc) || desc < 0 || desc > 100) errs.PrecioDescuentoPorcentaje = 'Debe ser entre 0 y 100';
    const descMax = Number(formData.PrecioDescuentoMax);
    if (isNaN(descMax) || descMax < 0 || descMax > 100) errs.PrecioDescuentoMax = 'Debe ser entre 0 y 100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(JSON.stringify(formData), Number(formData.Empkey) || 0, Number(formData.ProductoKey) || 0);
  };

  const handleCreatePrecio = () => {
    const val = Number(newPrecioValor);
    if (!newPrecioValor || isNaN(val) || val < 0) {
      setNewPrecioError('Ingrese un precio válido (≥ 0)');
      return;
    }
    setNewPrecioError('');
    onCreatePrecio(val, newUbiCod);
  };

  // ── Read-only info fields (matching old screen) ──
  const INFO_FIELDS: { key: string; label: string }[] = [
    { key: 'ProductoDescripcion', label: 'Descripción' },
    { key: 'Ubinom', label: 'Ubicación' },
    { key: 'CategoriaPrecioIdl', label: 'Categoría Precio' },
    { key: 'PrecioCantidad', label: 'Cantidad' },
  ];

  // ── Editable fields (matching old screen) ──
  const EDIT_FIELDS: { key: string; label: string; type: string }[] = [
    { key: 'PrecioHoraInicio', label: 'Hora Inicio', type: 'time' },
    { key: 'PrecioHoraFin', label: 'Hora Fin', type: 'time' },
    { key: 'PrecioItem', label: 'Precio', type: 'number' },
    { key: 'PrecioDescuentoPorcentaje', label: 'Descuento %', type: 'number' },
    { key: 'PrecioDescuentoMax', label: 'Descuento Máx. %', type: 'number' },
  ];

  const fmtVal = (key: string, value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (key.includes('Time') && typeof value === 'string' && value.includes('T')) return value.slice(0, 16);
    return String(value);
  };

  const fmtDisplay = (value: unknown): string => {
    if (value === undefined || value === null || value === '') return '—';
    return String(value);
  };

  // ── Determine what to show ──
  const showSearchStep = isNewMode && !selectedProduct;
  const showNewPriceStep = isNewMode && !!selectedProduct;
  const showEditForm = !isNewMode;

  // ── Title ──
  const drawerTitle = showSearchStep
    ? 'Buscar Producto'
    : showNewPriceStep
      ? 'Nuevo Precio'
      : 'Editar Precio';

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(53, 88, 114, 0.3)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, zIndex: 50,
          height: '100%', width: '100%', maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #d4d4d4',
          boxShadow: '-8px 0 30px rgba(53, 88, 114, 0.1)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-out',
          display: 'flex', flexDirection: 'column',
        }}
        role="dialog" aria-modal="true" aria-label={drawerTitle}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa',
          padding: '20px 32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {showNewPriceStep && (
              <button
                onClick={onClearProduct}
                style={{
                  padding: '6px', borderRadius: '8px', border: 'none',
                  cursor: 'pointer', backgroundColor: 'transparent', color: '#737373',
                  display: 'inline-flex', alignItems: 'center',
                }}
                aria-label="Volver a búsqueda"
              >
                <ArrowLeft style={{ width: '18px', height: '18px' }} />
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#355872', margin: 0 }}>
                {drawerTitle}
              </h2>
              {showNewPriceStep && selectedProduct && (
                <p style={{ fontSize: '14px', color: '#737373', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedProduct.ProductoDescripcion}
                </p>
              )}
              {showEditForm && Boolean(formData.ProductoDescripcion) && (
                <p style={{ fontSize: '14px', color: '#737373', marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {String(formData.ProductoDescripcion)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#a3a3a3' }}
            aria-label="Cerrar panel"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* Body */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

          {/* ── SEARCH STEP ── */}
          {showSearchStep && (
            <div>
              {/* Omnibox */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  width: '16px', height: '16px', color: '#a3a3a3', pointerEvents: 'none',
                }} />
                <input
                  id="product-search-input"
                  type="text"
                  placeholder="Buscar por código o descripción…"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="drawer-input"
                  style={{ paddingLeft: '40px' }}
                  autoFocus
                />
              </div>

              {/* Searching indicator */}
              {searching && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', color: '#737373', fontSize: '14px' }}>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Buscando…
                </div>
              )}

              {/* No results */}
              {!searching && debouncedSearch.trim() && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#a3a3a3', fontSize: '14px' }}>
                  <Search style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>No se encontraron productos para "<strong style={{ color: '#525252' }}>{debouncedSearch}</strong>"</p>
                </div>
              )}

              {/* Empty state */}
              {!searching && !debouncedSearch.trim() && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#a3a3a3', fontSize: '14px' }}>
                  <Search style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>Ingrese un código o descripción para buscar</p>
                </div>
              )}

              {/* Results table */}
              {searchResults.length > 0 && (
                <div style={{ border: '1px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 1.5fr',
                    backgroundColor: '#f5f5f5', borderBottom: '1px solid #e5e5e5',
                    padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: '#525252',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    <span>Tipo</span>
                    <span>Código</span>
                    <span>Descripción</span>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {searchResults.map((p, idx) => (
                      <button
                        key={`${p.ProductoKey}-${p.MItemCodVal}-${idx}`}
                        onClick={() => onSelectProduct(p)}
                        style={{
                          display: 'grid', gridTemplateColumns: '100px 1fr 1.5fr',
                          width: '100%', padding: '12px 16px',
                          border: 'none', borderBottom: idx < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none',
                          backgroundColor: 'transparent', cursor: 'pointer',
                          textAlign: 'left', fontSize: '14px', color: '#262626',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#eef7ff')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <span style={{ color: '#737373', fontSize: '13px' }}>{p.TipoCodDes}</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 500, color: '#355872' }}>{p.MItemCodVal}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.ProductoDescripcion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NEW PRICE STEP ── */}
          {showNewPriceStep && selectedProduct && (
            <div>
              {/* Product info card */}
              <div style={{
                backgroundColor: '#eef7ff', borderRadius: '12px', padding: '20px',
                border: '1px solid #bde3ff', marginBottom: '28px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#4a7798', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Producto seleccionado
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#737373' }}>Descripción</span>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#262626', margin: '2px 0 0' }}>{selectedProduct.ProductoDescripcion}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#737373' }}>Código</span>
                      <p style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace', color: '#355872', margin: '2px 0 0' }}>{selectedProduct.MItemCodVal}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#737373' }}>Tipo</span>
                      <p style={{ fontSize: '14px', color: '#525252', margin: '2px 0 0' }}>{selectedProduct.TipoCodDes}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación selector */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="new-ubicacion"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#355872', marginBottom: '10px' }}
                >
                  Ubicación
                </label>
                <select
                  id="new-ubicacion"
                  value={newUbiCod}
                  onChange={e => setNewUbiCod(e.target.value)}
                  className="drawer-input"
                  style={{ appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                >
                  <option value="">Sin ubicación</option>
                  {ubicaciones.map(u => (
                    <option key={u.UbiCod} value={u.UbiCod}>
                      {u.UbiNom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price input */}
              <div>
                <label
                  htmlFor="new-precio-valor"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#355872', marginBottom: '10px' }}
                >
                  Precio del producto
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '16px', fontWeight: 600, color: '#a3a3a3', pointerEvents: 'none',
                  }}>$</span>
                  <input
                    id="new-precio-valor"
                    type="number"
                    min="0"
                    step="any"
                    value={newPrecioValor}
                    onChange={e => { setNewPrecioValor(e.target.value); setNewPrecioError(''); }}
                    placeholder="0.00"
                    className={`drawer-input ${newPrecioError ? 'error' : ''}`}
                    style={{ paddingLeft: '32px', fontSize: '18px', fontWeight: 600, height: '48px' }}
                    autoFocus
                  />
                </div>
                {newPrecioError && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>{newPrecioError}</p>
                )}
              </div>
            </div>
          )}

          {/* ── EDIT FORM ── */}
          {showEditForm && (
            <>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
                  <Loader2 style={{ width: '32px', height: '32px', color: '#7AAACE', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px', color: '#737373', marginTop: '12px' }}>Cargando datos del precio…</p>
                </div>
              ) : (
                <div>
                  {/* ── Read-only info section ── */}
                  <div style={{
                    backgroundColor: '#fafafa', borderRadius: '12px', padding: '20px',
                    border: '1px solid #e5e5e5', marginBottom: '24px',
                  }}>
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {INFO_FIELDS.map(f => (
                        <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#737373', whiteSpace: 'nowrap', minWidth: '120px' }}>
                            {f.label}
                          </span>
                          <span style={{ fontSize: '14px', color: '#262626', textAlign: 'right', wordBreak: 'break-word' }}>
                            {fmtDisplay(formData[f.key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Editable fields ── */}
                  <div style={{ display: 'grid', gap: '18px' }}>
                    {EDIT_FIELDS.map(f => (
                      <div key={f.key}>
                        <label
                          htmlFor={`edit-${f.key}`}
                          style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '8px' }}
                        >
                          {f.label}
                        </label>
                        <input
                          id={`edit-${f.key}`}
                          type={f.type}
                          value={fmtVal(f.key, formData[f.key])}
                          onChange={e => {
                            const val = f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                            setField(f.key, val);
                          }}
                          className={`drawer-input ${errors[f.key] ? 'error' : ''}`}
                          aria-invalid={!!errors[f.key]}
                        />
                        {errors[f.key] && (
                          <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>{errors[f.key]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* Footer */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
          borderTop: '1px solid #e5e5e5', backgroundColor: '#ffffff',
          padding: '20px 32px',
        }}>
          {showSearchStep && (
            <button
              onClick={onClose}
              style={{
                borderRadius: '12px', border: 'none', cursor: 'pointer',
                padding: '0 20px', height: '40px', fontSize: '14px', fontWeight: 500,
                color: '#525252', backgroundColor: 'transparent',
              }}
            >
              Cancelar
            </button>
          )}

          {showNewPriceStep && (
            <>
              <button
                onClick={onClearProduct}
                style={{
                  borderRadius: '12px', border: 'none', cursor: 'pointer',
                  padding: '0 20px', height: '40px', fontSize: '14px', fontWeight: 500,
                  color: '#525252', backgroundColor: 'transparent',
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                <ArrowLeft style={{ width: '14px', height: '14px' }} />
                Volver
              </button>
              <button
                onClick={handleCreatePrecio}
                disabled={saving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  borderRadius: '12px', border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  backgroundColor: '#16a34a', padding: '0 20px', height: '40px',
                  fontSize: '14px', fontWeight: 600, color: '#ffffff',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving
                  ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  : <Plus style={{ width: '14px', height: '14px' }} />
                }
                {saving ? 'Creando…' : 'Crear Precio'}
              </button>
            </>
          )}

          {showEditForm && (
            <>
              <button
                onClick={onClose}
                style={{
                  borderRadius: '12px', border: 'none', cursor: 'pointer',
                  padding: '0 20px', height: '40px', fontSize: '14px', fontWeight: 500,
                  color: '#525252', backgroundColor: 'transparent',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  borderRadius: '12px', border: 'none', cursor: saving || loading ? 'not-allowed' : 'pointer',
                  backgroundColor: '#355872', padding: '0 20px', height: '40px',
                  fontSize: '14px', fontWeight: 600, color: '#ffffff',
                  opacity: saving || loading ? 0.5 : 1,
                }}
              >
                {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '14px', height: '14px' }} />}
                {saving ? 'Guardando…' : 'Confirmar'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
