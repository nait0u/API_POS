// ---------------------------------------------------------------------------
// BootScreen – Pantalla de carga del bootstrap del POS
// ---------------------------------------------------------------------------
// Se muestra mientras AppProvider resuelve /bff/device/info y /bff/parameter/*.
// ---------------------------------------------------------------------------

import { Loader2 } from 'lucide-react';

export function BootScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando aplicación"
      className="h-screen w-screen flex items-center justify-center bg-slate-50 font-sans"
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div
          aria-hidden="true"
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-medium text-foreground">
            Iniciando AndesPOS
          </h1>
          <p className="text-base text-muted-foreground max-w-xs">
            Conectando con el dispositivo y cargando parámetros corporativos…
          </p>
        </div>
      </div>
    </div>
  );
}
