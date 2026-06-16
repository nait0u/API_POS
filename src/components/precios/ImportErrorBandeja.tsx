import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export interface ImportErrorItem {
  Id: string;
  Description: string;
}

interface ImportErrorBandejaProps {
  open: boolean;
  errors: ImportErrorItem[];
  onClose: () => void;
}

const MAX_VISIBLE = 5;

export function ImportErrorBandeja({ open, errors, onClose }: ImportErrorBandejaProps) {
  const visibleErrors = errors.slice(0, MAX_VISIBLE);
  const hasMore = errors.length > MAX_VISIBLE;

  const openFullLog = () => {
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const rows = errors
      .map(
        (e, i) =>
          `<tr>
            <td class="cell-line">${i + 1}</td>
            <td class="cell-code">${esc(e.Id)}</td>
            <td class="cell-desc">${esc(e.Description)}</td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Log de Errores — AndesPOS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F8FAFC;
      color: #0F172A;
      min-height: 100vh;
    }

    /* ── Header institucional (bg-primary) ── */
    .header {
      background: #505daa;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.18);
    }
    .header-logo {
      width: 2.5rem; height: 2.5rem;
      background: rgba(255,255,255,0.15);
      border-radius: 0.75rem;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700; color: #fff;
      flex-shrink: 0;
    }
    .header-app   { color: #fff; font-weight: 600; font-size: 0.9375rem; line-height: 1.25; }
    .header-sub   { color: #c5cae9; font-size: 0.75rem; margin-top: 0.125rem; }

    /* ── Contenido principal ── */
    .main { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }

    /* ── Card (bg-card + border-border + shadow-sm) ── */
    .card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #E2E8F0;
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    }
    .card-title {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 1rem; font-weight: 600; color: #0F172A; line-height: 1.4;
    }
    .icon-warn { color: #DC2626; flex-shrink: 0; }
    .card-desc  { color: #475569; font-size: 0.8125rem; margin-top: 0.25rem; line-height: 1.5; }

    /* ── Badge de conteo ── */
    .badge {
      display: inline-flex; align-items: center;
      background: #FEE2E2; color: #DC2626;
      font-size: 0.75rem; font-weight: 600;
      padding: 0.25rem 0.75rem; border-radius: 9999px;
      white-space: nowrap; flex-shrink: 0;
    }

    /* ── Tabla ── */
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #505daa; }
    th {
      padding: 0.625rem 1rem;
      text-align: left;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #fff;
      white-space: nowrap;
    }
    td {
      padding: 0.625rem 1rem;
      border-bottom: 1px solid #E2E8F0;
      font-size: 0.8125rem;
      vertical-align: top;
      color: #0F172A;
      line-height: 1.5;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:nth-child(even) td { background: #F8FAFC; }
    tbody tr:hover td { background: #e8eaf6; transition: background 0.15s; }

    .cell-line { width: 60px; text-align: center; font-family: 'Roboto Mono', monospace; font-size: 0.75rem; }
    .cell-code { width: 180px; font-family: 'Roboto Mono', monospace; font-weight: 500; font-size: 0.75rem; }
    td.cell-line { color: #475569; }
    td.cell-code { color: #DC2626; }

    /* ── Card footer ── */
    .card-footer {
      padding: 0.625rem 1.5rem;
      border-top: 1px solid #E2E8F0;
      background: #F8FAFC;
      font-size: 0.75rem;
      color: #475569;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-logo">A</div>
    <div>
      <div class="header-app">AndesPOS</div>
      <div class="header-sub">Log de Errores de Importación</div>
    </div>
  </header>

  <main class="main">
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">
            <svg class="icon-warn" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            Bandeja de Errores
          </div>
          <div class="card-desc">Revisa cada línea antes de corregir el archivo y reintentar la importación.</div>
        </div>
        <span class="badge">${errors.length} error${errors.length !== 1 ? 'es' : ''}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th class="cell-line">Línea</th>
            <th class="cell-code">Código</th>
            <th class="cell-desc">Descripción del error</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="card-footer">
        ${errors.length} error${errors.length !== 1 ? 'es' : ''} encontrado${errors.length !== 1 ? 's' : ''} · AndesPOS
      </div>
    </div>
  </main>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
            Bandeja de Errores
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Se encontraron {errors.length} error{errors.length !== 1 ? 'es' : ''} al procesar el archivo de importación.
            {hasMore && ` Se muestran los primeros ${MAX_VISIBLE}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border border-border rounded-lg min-h-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary">
                <TableHead className="text-primary-foreground font-semibold px-4 w-16">
                  Línea
                </TableHead>
                <TableHead className="text-primary-foreground font-semibold px-4 w-40">
                  Código Error
                </TableHead>
                <TableHead className="text-primary-foreground font-semibold px-4">
                  Descripción Error
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleErrors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-20 text-center text-muted-foreground text-sm"
                  >
                    No hay errores que mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                visibleErrors.map((err, index) => (
                  <TableRow key={`${index}-${err.Id}`}>
                    <TableCell className="px-4 font-mono text-sm text-foreground text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-destructive font-medium">
                      {err.Id}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-foreground whitespace-normal">
                      {err.Description}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2 flex-wrap pt-2">
          {hasMore && (
            <p className="text-xs text-muted-foreground">
              Mostrando {MAX_VISIBLE} de {errors.length} errores
            </p>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={openFullLog}>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Ver log completo...
            </Button>
            <Button variant="default" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
