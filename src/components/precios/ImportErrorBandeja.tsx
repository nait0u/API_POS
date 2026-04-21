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
import { AlertTriangle } from 'lucide-react';

export interface ImportErrorItem {
  Id: string;
  Description: string;
}

interface ImportErrorBandejaProps {
  open: boolean;
  errors: ImportErrorItem[];
  onClose: () => void;
}

export function ImportErrorBandeja({
  open,
  errors,
  onClose,
}: ImportErrorBandejaProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
            Bandeja de Errores
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Se encontraron {errors.length} error{errors.length !== 1 ? 'es' : ''} al
            procesar el archivo de importación.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary">
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
              {errors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-20 text-center text-muted-foreground text-sm"
                  >
                    No hay errores que mostrar.
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((err, index) => (
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

        <DialogFooter>
          <Button variant="default" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
