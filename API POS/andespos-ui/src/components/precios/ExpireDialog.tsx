import { AlertTriangle, Loader2 } from 'lucide-react';
import type { SDTPrecios } from '../../types/precios';

interface ExpireDialogProps {
  target: SDTPrecios | null;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ExpireDialog({ target, saving, onConfirm, onClose }: ExpireDialogProps) {
  if (!target) return null;

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return iso; }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(53, 88, 114, 0.3)', backdropFilter: 'blur(4px)' }}
      />

      <div
        role="alertdialog" aria-modal="true" aria-labelledby="expire-title" aria-describedby="expire-desc"
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px',
          backgroundColor: '#ffffff', borderRadius: '16px',
          border: '1px solid #d4d4d4',
          boxShadow: '0 8px 30px rgba(53, 88, 114, 0.12)',
          overflow: 'hidden',
        }}
        className="animate-fade-up"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 28px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fffbeb',
          }}>
            <AlertTriangle style={{ width: '20px', height: '20px', color: '#d97706' }} />
          </div>
          <h2 id="expire-title" style={{ fontSize: '18px', fontWeight: 700, color: '#355872', margin: 0 }}>Caducar precio</h2>
        </div>

        {/* Body */}
        <div id="expire-desc" style={{ padding: '20px 28px' }}>
          <p style={{ fontSize: '14px', color: '#525252', marginBottom: '16px' }}>
            ¿Está seguro de que desea caducar este precio? Esta acción establecerá la fecha de fin como ahora.
          </p>
          <div style={{
            borderRadius: '12px', backgroundColor: '#fafafa', border: '1px solid #e5e5e5',
            padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px',
          }}>
            <Row label="Código" value={target.CodIntValor} />
            <Row label="Producto" value={target.ProductoDescripcion} truncate />
            <Row label="Ubicación" value={target.PrecioUbiCod} />
            <Row label="Vigencia" value={`${fmtDate(target.PrecioTimeInicio)} → ${fmtDate(target.PrecioTimeFin)}`} />
            <Row label="Precio" value={Number(target.PrecioItem).toLocaleString('es', { style: 'currency', currency: 'CLP' })} bold />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
          borderTop: '1px solid #e5e5e5', padding: '20px 28px',
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              borderRadius: '12px', border: 'none', cursor: 'pointer',
              padding: '0 20px', height: '40px', fontSize: '14px', fontWeight: 500,
              color: '#525252', backgroundColor: 'transparent',
              opacity: saving ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              borderRadius: '12px', border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              backgroundColor: '#d97706', padding: '0 20px', height: '40px',
              fontSize: '14px', fontWeight: 600, color: '#ffffff',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving
              ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
              : <AlertTriangle style={{ width: '14px', height: '14px' }} />
            }
            {saving ? 'Caducando…' : 'Caducar ahora'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, truncate, bold }: { label: string; value: string; truncate?: boolean; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
      <span style={{ color: '#737373', flexShrink: 0 }}>{label}:</span>
      <span style={{
        textAlign: 'right',
        fontWeight: bold ? 600 : 500,
        color: bold ? '#355872' : '#262626',
        ...(truncate ? { maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const } : {}),
      }}>
        {value}
      </span>
    </div>
  );
}
