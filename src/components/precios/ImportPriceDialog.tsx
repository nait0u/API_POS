import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileUp, X, Loader2 } from 'lucide-react';

interface FormatOption {
  value: string;
  label: string;
}

interface ImportPriceDialogProps {
  open: boolean;
  onClose: () => void;
  formatOptions: FormatOption[];
  formatLoading: boolean;
  saving: boolean;
  onImport: (format: string, fileName: string, file: File) => void;
}

const ACCEPTED_EXTENSIONS = /\.(csv|xlsx|xls)$/i;

export function ImportPriceDialog({
  open,
  onClose,
  formatOptions,
  formatLoading,
  saving,
  onImport,
}: ImportPriceDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFormat('');
    setFile(null);
    setDragActive(false);
    setFileError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !saving) {
      resetState();
      onClose();
    }
  };

  const validateAndSetFile = (f: File) => {
    if (!ACCEPTED_EXTENSIONS.test(f.name)) {
      setFileError('Solo se aceptan archivos CSV o Excel (.csv, .xlsx, .xls).');
      return;
    }
    setFileError(null);
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
    // Reset so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (!file || !selectedFormat || saving) return;
    onImport(selectedFormat, file.name, file);
  };

  const canSubmit = !!file && !!selectedFormat && !saving;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">
            Importar Precios
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecciona un formato y sube un archivo CSV o Excel con los precios a importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1 overflow-y-auto min-h-0">
          {/* Format selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="import-format"
              className="text-sm font-medium text-foreground"
            >
              Formato de importación
            </label>
            {formatLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Cargando formatos...
              </div>
            ) : (
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger id="import-format" className="w-full">
                  <SelectValue placeholder="Seleccionar formato..." />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      Sin formatos disponibles
                    </SelectItem>
                  ) : (
                    formatOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Drop zone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Archivo
            </label>
            <div
              role="button"
              tabIndex={0}
              aria-label="Zona de carga. Haz clic o arrastra un archivo CSV o Excel aquí."
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setDragActive(false)}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              className={[
                'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors select-none',
                dragActive
                  ? 'border-primary bg-brand-50'
                  : 'border-border hover:border-primary/50 hover:bg-accent',
              ].join(' ')}
            >
              <FileUp
                className="w-8 h-8 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Arrastra un archivo o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV, Excel (.csv, .xlsx, .xls)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileInputChange}
                aria-hidden="true"
              />
            </div>

            {/* Selected file chip */}
            {file && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
                <Upload
                  className="w-4 h-4 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm text-foreground flex-1 truncate font-mono">
                  {file.name}
                </span>
                <button
                  type="button"
                  aria-label={`Quitar archivo ${file.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors rounded focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {fileError && (
              <p role="alert" className="text-sm text-destructive">
                {fileError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { resetState(); onClose(); }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden="true" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
