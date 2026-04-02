import { useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { FiltroPrecios } from '../../types/precios';
import type { UbicacionItem } from '../../types/precios';

interface FiltersBarProps {
  filters: FiltroPrecios;
  ubicaciones: UbicacionItem[];
  onFiltersChange: (partial: Partial<FiltroPrecios>) => void;
  onSearch: (filters: FiltroPrecios) => void;
  onClear: () => void;
}

export function FiltersBar({ filters, ubicaciones, onFiltersChange, onSearch, onClear }: FiltersBarProps) {
  const [expanded, setExpanded] = useState(false);

  const handleSearch = () => {
    onSearch({ ...filters });
  };

  const handleClear = () => {
    onFiltersChange({ CodIntValor: '', ProductoDescripcion: '', Ubicacion: '', CategoriaPrecioIdl: '' });
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const hasActiveFilters =
    !!filters.CodIntValor ||
    !!filters.ProductoDescripcion ||
    !!filters.Ubicacion ||
    !!filters.CategoriaPrecioIdl;

  // Count active filters for the badge
  const activeCount = [
    filters.CodIntValor,
    filters.ProductoDescripcion,
    filters.Ubicacion,
    filters.CategoriaPrecioIdl,
  ].filter(Boolean).length;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #d4d4d4',
      borderRadius: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Collapsible header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '16px 28px',
          border: 'none', cursor: 'pointer',
          backgroundColor: 'transparent',
          borderBottom: expanded ? '1px solid #e5e5e5' : 'none',
          transition: 'border-color 0.2s',
        }}
        aria-expanded={expanded}
        aria-controls="filters-panel"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SlidersHorizontal style={{ width: '16px', height: '16px', color: '#7AAACE' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#355872' }}>Filtros</span>
          {activeCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '22px', height: '22px',
              borderRadius: '11px', padding: '0 7px',
              backgroundColor: '#355872', fontSize: '11px', fontWeight: 700, color: '#ffffff',
            }}>
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown style={{
          width: '18px', height: '18px', color: '#a3a3a3',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease',
        }} />
      </button>

      {/* Collapsible panel */}
      <div
        id="filters-panel"
        style={{
          maxHeight: expanded ? '500px' : '0',
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.25s ease',
          padding: expanded ? '20px 28px 24px' : '0 28px',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {/* Código */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '6px' }} htmlFor="filter-codigo">
              Código
            </label>
            <input
              id="filter-codigo"
              type="text"
              placeholder="Ej: 7790001"
              value={filters.CodIntValor || ''}
              onChange={e => onFiltersChange({ CodIntValor: e.target.value })}
              onKeyDown={handleKeyDown}
              className="filter-input"
            />
          </div>

          {/* Descripción */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '6px' }} htmlFor="filter-descripcion">
              Descripción
            </label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input
                id="filter-descripcion"
                type="text"
                placeholder="Ej: Coca-Cola"
                value={filters.ProductoDescripcion || ''}
                onChange={e => onFiltersChange({ ProductoDescripcion: e.target.value })}
                onKeyDown={handleKeyDown}
                className="filter-input"
                style={{ paddingLeft: '36px' }}
              />
              {filters.ProductoDescripcion && (
                <button
                  onClick={() => onFiltersChange({ ProductoDescripcion: '' })}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#a3a3a3' }}
                  aria-label="Limpiar descripción"
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          </div>

          {/* EmpKey */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '6px' }} htmlFor="filter-empkey">
              Empresa
            </label>
            <input
              id="filter-empkey"
              type="number"
              value={filters.EmpKey}
              onChange={e => onFiltersChange({ EmpKey: Number(e.target.value) || 0 })}
              onKeyDown={handleKeyDown}
              className="filter-input"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '6px' }} htmlFor="filter-ubicacion">
              Ubicación
            </label>
            <select
              id="filter-ubicacion"
              value={filters.Ubicacion || ''}
              onChange={e => onFiltersChange({ Ubicacion: e.target.value })}
              onKeyDown={handleKeyDown}
              className="filter-input"
              style={{ appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
            >
              <option value="">Todas</option>
              {ubicaciones.map(u => (
                <option key={u.UbiCod} value={u.UbiCod}>
                  {u.UbiNom}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '6px' }} htmlFor="filter-categoria">
              Categoría Precio
            </label>
            <input
              id="filter-categoria"
              type="text"
              placeholder="Ej: GENERAL"
              value={filters.CategoriaPrecioIdl || ''}
              onChange={e => onFiltersChange({ CategoriaPrecioIdl: e.target.value })}
              onKeyDown={handleKeyDown}
              className="filter-input"
            />
          </div>

          {/* Fecha Filtro */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '6px' }} htmlFor="filter-fecha">
              Fecha Filtro
            </label>
            <input
              id="filter-fecha"
              type="date"
              value={filters.FechaFiltro || ''}
              onChange={e => onFiltersChange({ FechaFiltro: e.target.value })}
              onKeyDown={handleKeyDown}
              className="filter-input"
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <button
            onClick={handleSearch}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              borderRadius: '12px', border: 'none', cursor: 'pointer',
              backgroundColor: '#355872', padding: '0 20px', height: '40px',
              fontSize: '14px', fontWeight: 600, color: '#ffffff',
            }}
          >
            <Search style={{ width: '14px', height: '14px' }} />
            Buscar
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                borderRadius: '12px', border: 'none', cursor: 'pointer',
                backgroundColor: 'transparent', padding: '0 16px', height: '40px',
                fontSize: '14px', fontWeight: 500, color: '#525252',
              }}
            >
              <X style={{ width: '14px', height: '14px' }} />
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}