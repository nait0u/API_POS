import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { IMPORT_FORMATS } from '../../types/precios';
import type { ImportFormat } from '../../types/precios';

interface ImportDialogProps {
  open: boolean;
  saving: boolean;
  onImport: (format: string, fileName: string, file: File) => void;
  onClose: () => void;
}

export function ImportDialog({ open, saving, onImport, onClose }: ImportDialogProps) {
  const [format, setFormat] = useState<ImportFormat>('PRECIO01');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => { setFile(f); setError(''); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = () => {
    if (!file) { setError('Seleccione un archivo'); return; }
    onImport(format, file.name, file);
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(53, 88, 114, 0.3)', backdropFilter: 'blur(4px)' }}
      />

      {/* Dialog */}
      <div
        role="dialog" aria-modal="true" aria-labelledby="import-title"
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: '540px',
          backgroundColor: '#ffffff', borderRadius: '16px',
          border: '1px solid #d4d4d4',
          boxShadow: '0 8px 30px rgba(53, 88, 114, 0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa',
          padding: '20px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eef7ff',
            }}>
              <FileSpreadsheet style={{ width: '20px', height: '20px', color: '#7AAACE' }} />
            </div>
            <h2 id="import-title" style={{ fontSize: '18px', fontWeight: 700, color: '#355872', margin: 0 }}>Importar Precios</h2>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '12px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#a3a3a3' }}
            aria-label="Cerrar"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Body — GENEROUS padding */}
        <div style={{ padding: '28px 28px 24px' }}>
          {/* Format selector */}
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="import-format" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '8px' }}>
              Formato de importación
            </label>
            <select
              id="import-format"
              value={format}
              onChange={e => setFormat(e.target.value as ImportFormat)}
              className="filter-input"
            >
              {IMPORT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#737373', marginBottom: '8px' }}>Archivo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              role="button" tabIndex={0} aria-label="Arrastra un archivo o haz clic para seleccionar"
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              style={{
                borderRadius: '16px',
                border: `2px dashed ${file ? 'rgba(34, 197, 94, 0.5)' : dragOver ? '#7AAACE' : '#d4d4d4'}`,
                backgroundColor: file ? '#f0fdf4' : dragOver ? '#eef7ff' : '#fafafa',
                padding: '40px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".csv,.xlsx,.xls,.txt"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle style={{ width: '32px', height: '32px', color: '#22c55e' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#262626' }}>{file.name}</p>
                  <p style={{ fontSize: '12px', color: '#737373' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload style={{ width: '32px', height: '32px', color: '#a3a3a3' }} />
                  <p style={{ fontSize: '14px', color: '#525252' }}>
                    Arrastra un archivo o <span style={{ color: '#7AAACE', fontWeight: 600 }}>busca en tu equipo</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#a3a3a3' }}>CSV, XLSX, XLS o TXT</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px',
              borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2',
              padding: '12px 16px', fontSize: '14px', color: '#dc2626',
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px',
          borderTop: '1px solid #e5e5e5',
          padding: '20px 28px',
        }}>
          <button
            onClick={onClose} disabled={saving}
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
            onClick={handleSubmit} disabled={saving || !file}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              borderRadius: '12px', border: 'none',
              cursor: saving || !file ? 'not-allowed' : 'pointer',
              backgroundColor: '#355872', padding: '0 20px', height: '40px',
              fontSize: '14px', fontWeight: 600, color: '#ffffff',
              opacity: saving || !file ? 0.5 : 1,
            }}
          >
            {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: '14px', height: '14px' }} />}
            {saving ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
