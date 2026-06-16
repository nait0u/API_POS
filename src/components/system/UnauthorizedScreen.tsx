// ---------------------------------------------------------------------------
// UnauthorizedScreen – Pantalla de bloqueo o fallo del bootstrap
// ---------------------------------------------------------------------------
// Dos variantes:
//   • unauthorized → el BFF respondió pero el dispositivo no tiene autorización
//                    válida (EmpKey ausente, etc.). Icono: ShieldAlert.
//   • error        → falla de red / BFF caído / respuesta corrupta.
//                    Icono: ServerCrash. Permite reintentar.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { ShieldAlert, ServerCrash, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DeviceInfo } from '@/context/AppContext';

interface UnauthorizedScreenProps {
  variant: 'unauthorized' | 'error';
  deviceInfo: DeviceInfo | null;
  errorMessage: string | null;
  onRetry: () => void;
}

export function UnauthorizedScreen({
  variant,
  deviceInfo,
  errorMessage,
  onRetry,
}: UnauthorizedScreenProps) {
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  // Foco inicial en "Reintentar" para usuarios de teclado/lectores de pantalla.
  useEffect(() => {
    retryButtonRef.current?.focus();
  }, []);

  const isError = variant === 'error';
  const Icon = isError ? ServerCrash : ShieldAlert;
  const title = isError
    ? 'No fue posible conectar con el middleware'
    : 'Dispositivo no autorizado';
  const description = isError
    ? 'Verifica que el servicio local (BFF) esté en ejecución y vuelve a intentar.'
    : 'Este dispositivo físico no tiene una autorización válida para operar en el local. Contacta al administrador del sistema.';

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-labelledby="unauth-title"
      aria-describedby="unauth-desc"
      className="h-screen w-screen flex items-center justify-center bg-slate-50 font-sans p-6"
    >
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm p-8 space-y-6">
        {/* Icono + título */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            aria-hidden="true"
            className={
              isError
                ? 'w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center'
                : 'w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center'
            }
          >
            <Icon
              className={
                isError
                  ? 'w-8 h-8 text-destructive'
                  : 'w-8 h-8 text-primary'
              }
            />
          </div>

          <div className="space-y-2">
            <h1 id="unauth-title" className="text-xl font-medium text-foreground">
              {title}
            </h1>
            <p id="unauth-desc" className="text-base text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {/* Datos de sucursal (sólo en unauthorized cuando haya info parcial) */}
        {!isError && deviceInfo?.sucursalNombre && (
          <div className="border-t border-border pt-4 space-y-1">
            <dl className="text-sm space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Sucursal</dt>
                <dd className="font-mono text-foreground text-right">
                  {deviceInfo.sucursalNombre}
                </dd>
              </div>
              {deviceInfo.puntoVentaNombre && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Punto de venta</dt>
                  <dd className="font-mono text-foreground text-right">
                    {deviceInfo.puntoVentaNombre}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Detalle técnico del error (sólo variant="error") */}
        {isError && errorMessage && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-mono text-muted-foreground break-words">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Botón de reintento */}
        <div className="flex justify-center pt-2">
          <Button
            ref={retryButtonRef}
            onClick={onRetry}
            variant={isError ? 'default' : 'outline'}
            aria-label="Reintentar conexión con el middleware"
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
