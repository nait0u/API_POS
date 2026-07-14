import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, UserPlus, Pencil, Copy, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useClientesXVenta } from '@/hooks/useClientesXVenta';
import { useCarrito } from '@/hooks/useCarrito';
import { interpretPosError } from '@/services/apiClient';
import type { ClienteXVentaRow, ActualizarClienteXVentaInput } from '@/types/clientesXVenta';
import type { ComunaItem } from '@/types/customer';

type Modo = 'lista' | { tipo: 'editar'; row: ClienteXVentaRow } | { tipo: 'duplicar'; row: ClienteXVentaRow };

interface ClienteXVentaDialogProps {
  open: boolean;
  notaVentaKey: number;
  onClose: () => void;
  onAssigned: (clienteKey: number, nombre: string) => void;
}

export function ClienteXVentaDialog({ open, notaVentaKey, onClose, onAssigned }: ClienteXVentaDialogProps) {
  const {
    clientes,
    isSearching,
    isSaving,
    filtro,
    setFiltro,
    crearShell,
    copiarCliente,
    actualizarCliente,
    addClienteLocal,
    patchClienteLocal,
    comunas,
  } = useClientesXVenta();
  const { setCliente } = useCarrito();

  const [modo, setModo] = useState<Modo>('lista');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSaving && !isAssigning) {
      setModo('lista');
      onClose();
    }
  };

  const handleAsignar = async (row: ClienteXVentaRow) => {
    setIsAssigning(true);
    try {
      await setCliente({ notaVentaKey, clienteKey: row.clienteKey });
      onAssigned(row.clienteKey, row.clienteNombreCompleto);
      toast.success(`Cliente asignado: ${row.clienteNombreCompleto}`);
      handleOpenChange(false);
    } catch (err) {
      toast.error(interpretPosError(err).message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleQuitar = async () => {
    setIsAssigning(true);
    try {
      await setCliente({ notaVentaKey, clienteKey: 0 });
      onAssigned(0, '');
      toast.success('Cliente desasignado');
      handleOpenChange(false);
    } catch (err) {
      toast.error(interpretPosError(err).message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleNuevoCliente = async () => {
    setIsAssigning(true);
    try {
      const clienteKey = await crearShell();
      await setCliente({ notaVentaKey, clienteKey });
      const shellRow: ClienteXVentaRow = {
        clienteKey,
        clienteRUT: '',
        clienteNombreCompleto: `Cliente #${clienteKey} (sin datos)`,
        clienteGiro: '',
        clienteAddress: '',
      };
      addClienteLocal(shellRow);
      onAssigned(clienteKey, shellRow.clienteNombreCompleto);
      toast.success('Cliente nuevo asignado — complete sus datos');
      setModo({ tipo: 'editar', row: shellRow });
    } catch (err) {
      toast.error(interpretPosError(err).message);
    } finally {
      setIsAssigning(false);
    }
  };

  if (modo !== 'lista' && modo.tipo === 'editar') {
    return (
      <EditarClienteForm
        row={modo.row}
        isSaving={isSaving}
        comunas={comunas}
        onCancel={() => setModo('lista')}
        onSubmit={async (input) => {
          await actualizarCliente(modo.row.clienteKey, input);
          patchClienteLocal(modo.row.clienteKey, {
            clienteRUT: input.clienteRUT ?? modo.row.clienteRUT,
            clienteGiro: input.clienteGiro ?? modo.row.clienteGiro,
            clienteAddress: input.clienteAddress ?? modo.row.clienteAddress,
            clienteNombreCompleto:
              input.clienteRazonSocial ||
              [input.clienteNombre, input.clienteApellidoPaterno, input.clienteApellidoMaterno]
                .filter(Boolean)
                .join(' ') ||
              modo.row.clienteNombreCompleto,
          });
          toast.success('Cliente actualizado');
          setModo('lista');
        }}
      />
    );
  }

  if (modo !== 'lista' && modo.tipo === 'duplicar') {
    return (
      <DuplicarClienteForm
        row={modo.row}
        isSaving={isSaving}
        comunas={comunas}
        onCancel={() => setModo('lista')}
        onSubmit={async (input) => {
          const clienteKeyNew = await copiarCliente({ clienteKeyOrigen: modo.row.clienteKey, ...input });
          addClienteLocal({
            clienteKey: clienteKeyNew,
            clienteRUT: input.clientePIValorNew,
            clienteNombreCompleto: `${modo.row.clienteNombreCompleto} (copia)`,
            clienteGiro: modo.row.clienteGiro,
            clienteAddress: input.clienteAddressNew,
          });
          toast.success('Cliente duplicado');
          setModo('lista');
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">Cliente</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Busca un cliente existente o crea uno nuevo para esta venta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void handleQuitar()} disabled={isAssigning}>
            <UserX className="w-4 h-4" /> Quitar cliente
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleNuevoCliente()} disabled={isAssigning}>
            <UserPlus className="w-4 h-4" /> Nuevo cliente
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="RUT"
            value={filtro.filtroRUT ?? ''}
            onChange={(e) => setFiltro({ ...filtro, filtroRUT: e.target.value || undefined })}
          />
          <Input
            placeholder="Nombre"
            value={filtro.filtroNombre ?? ''}
            onChange={(e) => setFiltro({ ...filtro, filtroNombre: e.target.value || undefined })}
          />
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <Table containerClassName="overflow-auto max-h-72" className="table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
              <TableRow>
                <TableHead className="font-semibold text-foreground px-4 w-[9%]">CÓDIGO</TableHead>
                <TableHead className="font-semibold text-foreground px-4 w-[13%]">RUT</TableHead>
                <TableHead className="font-semibold text-foreground px-4 w-[24%]">NOMBRE</TableHead>
                <TableHead className="font-semibold text-foreground px-4 w-[18%]">GIRO</TableHead>
                <TableHead className="font-semibold text-foreground px-4 w-[26%]">DIRECCIÓN</TableHead>
                <TableHead className="font-semibold text-foreground px-4 w-[10%] text-center">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSearching && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isSearching && clientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Search size={14} /> Sin resultados.
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {clientes.map((row) => (
                <TableRow
                  key={row.clienteKey}
                  role="button"
                  tabIndex={isAssigning ? -1 : 0}
                  aria-label={`Seleccionar ${row.clienteNombreCompleto}`}
                  onClick={() => { if (!isAssigning) void handleAsignar(row); }}
                  onKeyDown={(e) => {
                    if (isAssigning) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleAsignar(row);
                    }
                  }}
                  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <TableCell className="px-4 font-mono text-sm text-foreground truncate">
                    {row.clienteKey}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-sm text-foreground truncate">
                    {row.clienteRUT || '—'}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-foreground truncate" title={row.clienteNombreCompleto}>
                    {row.clienteNombreCompleto}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-foreground truncate" title={row.clienteGiro}>
                    {row.clienteGiro || '—'}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-foreground truncate" title={row.clienteAddress}>
                    {row.clienteAddress || '—'}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        aria-label={`Editar ${row.clienteNombreCompleto}`}
                        onClick={(e) => { e.stopPropagation(); setModo({ tipo: 'editar', row }); }}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-primary hover:bg-brand-50"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Duplicar ${row.clienteNombreCompleto}`}
                        onClick={(e) => { e.stopPropagation(); setModo({ tipo: 'duplicar', row }); }}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Formulario editar ────────────────────────────────────────────────────────

function EditarClienteForm({
  row,
  isSaving,
  comunas,
  onCancel,
  onSubmit,
}: {
  row: ClienteXVentaRow;
  isSaving: boolean;
  comunas: ComunaItem[];
  onCancel: () => void;
  onSubmit: (input: ActualizarClienteXVentaInput) => Promise<void>;
}) {
  const [form, setForm] = useState<ActualizarClienteXVentaInput>({
    clienteRUT: row.clienteRUT,
    clienteGiro: row.clienteGiro,
    clienteAddress: row.clienteAddress,
  });

  const handleSubmit = async () => {
    try {
      await onSubmit(form);
    } catch (err) {
      toast.error(interpretPosError(err).message);
    }
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && !isSaving && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">Editar Cliente</DialogTitle>
          <DialogDescription className="text-muted-foreground">{row.clienteNombreCompleto}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cli-rut">RUT</Label>
            <Input id="cli-rut" value={form.clienteRUT ?? ''} onChange={(e) => setForm({ ...form, clienteRUT: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-nombre">Nombre</Label>
            <Input id="cli-nombre" value={form.clienteNombre ?? ''} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cli-paterno">Apellido Paterno</Label>
              <Input id="cli-paterno" value={form.clienteApellidoPaterno ?? ''} onChange={(e) => setForm({ ...form, clienteApellidoPaterno: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cli-materno">Apellido Materno</Label>
              <Input id="cli-materno" value={form.clienteApellidoMaterno ?? ''} onChange={(e) => setForm({ ...form, clienteApellidoMaterno: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-razon">Razón Social (persona jurídica)</Label>
            <Input id="cli-razon" value={form.clienteRazonSocial ?? ''} onChange={(e) => setForm({ ...form, clienteRazonSocial: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-giro">Giro</Label>
            <Input id="cli-giro" value={form.clienteGiro ?? ''} onChange={(e) => setForm({ ...form, clienteGiro: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-direccion">Dirección</Label>
            <Input id="cli-direccion" value={form.clienteAddress ?? ''} onChange={(e) => setForm({ ...form, clienteAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cli-comuna">Comuna</Label>
              <Select
                value={form.clienteComunaId ?? ''}
                onValueChange={(value) => setForm({ ...form, clienteComunaId: value })}
              >
                <SelectTrigger id="cli-comuna" className="w-full">
                  <SelectValue placeholder="Seleccionar comuna..." />
                </SelectTrigger>
                <SelectContent>
                  {comunas.filter((c) => !!c.comunaId).map((c) => (
                    <SelectItem key={c.comunaId} value={c.comunaId}>
                      {c.comunaNombre} — {c.comunaCiudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cli-movil">Celular</Label>
              <Input id="cli-movil" value={form.clienteMobilPhone ?? ''} onChange={(e) => setForm({ ...form, clienteMobilPhone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cli-email">Email</Label>
            <Input id="cli-email" type="email" value={form.clienteEmail ?? ''} onChange={(e) => setForm({ ...form, clienteEmail: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Formulario duplicar ──────────────────────────────────────────────────────

function DuplicarClienteForm({
  row,
  isSaving,
  comunas,
  onCancel,
  onSubmit,
}: {
  row: ClienteXVentaRow;
  isSaving: boolean;
  comunas: ComunaItem[];
  onCancel: () => void;
  onSubmit: (input: { clientePIValorNew: string; clienteAddressNew: string; clienteComunaIDNew: string }) => Promise<void>;
}) {
  const [piValor, setPiValor] = useState('');
  const [address, setAddress] = useState('');
  const [comunaId, setComunaId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!piValor.trim() || !address.trim() || !comunaId.trim()) {
      setError('Completa RUT/PI, Dirección y Comuna.');
      return;
    }
    setError(null);
    try {
      await onSubmit({ clientePIValorNew: piValor.trim(), clienteAddressNew: address.trim(), clienteComunaIDNew: comunaId.trim() });
    } catch (err) {
      toast.error(interpretPosError(err).message);
    }
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && !isSaving && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground font-semibold text-lg">Duplicar Cliente</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Origen: {row.clienteNombreCompleto}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dup-pi">RUT / PI del nuevo cliente</Label>
            <Input id="dup-pi" value={piValor} onChange={(e) => setPiValor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dup-address">Dirección</Label>
            <Input id="dup-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dup-comuna">Comuna</Label>
            <Select value={comunaId} onValueChange={setComunaId}>
              <SelectTrigger id="dup-comuna" className="w-full">
                <SelectValue placeholder="Seleccionar comuna..." />
              </SelectTrigger>
              <SelectContent>
                {comunas.filter((c) => !!c.comunaId).map((c) => (
                  <SelectItem key={c.comunaId} value={c.comunaId}>
                    {c.comunaNombre} — {c.comunaCiudad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p role="alert" className="text-xs text-destructive font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Duplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
