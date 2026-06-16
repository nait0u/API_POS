import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useVentas } from '@/hooks/useVentas';
import { useClientes } from '@/hooks/useClientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  UserPlus,
  Edit,
  ChevronRight,
  Home,
} from 'lucide-react';
import type { Customer, CustomerFormData } from '@/types/customer';
import { EMPTY_CUSTOMER_FORM } from '@/types/customer';

type DialogMode = 'create' | 'edit';

interface CustomerSelectionViewProps {
  onBack?: () => void;
  /** Notifica al shell que se creó la venta; padre decide la navegación. */
  onSaleCreated?: (notaVentaKey: number) => void;
}

export function CustomerSelectionView({
  onBack,
  onSaleCreated,
}: CustomerSelectionViewProps) {
  const { crearVenta, isCreating } = useVentas();
  const {
    clientes,
    comunas,
    categorias,
    isSearching,
    isSaving,
    catalogosReady,
    searchText,
    setSearchText,
    guardarCliente,
  } = useClientes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [editingKey, setEditingKey] = useState<number>(0);
  const [formData, setFormData] = useState<CustomerFormData>(EMPTY_CUSTOMER_FORM);

  // Cuando los catálogos llegan, reemplazamos el valor por defecto del select
  // de categorías si el form sigue en estado inicial.
  useEffect(() => {
    if (catalogosReady && !formData.categoriaPrecios && categorias[0]) {
      setFormData((prev) =>
        prev.categoriaPrecios ? prev : { ...prev, categoriaPrecios: categorias[0].categoriaPrecioIdl },
      );
    }
  }, [catalogosReady, categorias, formData.categoriaPrecios]);

  const updateField = <K extends keyof CustomerFormData>(
    key: K,
    value: CustomerFormData[K],
  ) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleRutChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      rut: value,
      tipoPersona: tipoPersonaDesdeRut(value),
    }));
  };

  const handleComunaChange = (comunaId: string) => {
    const c = comunas.find((x) => x.comunaId === comunaId);
    setFormData((prev) => ({
      ...prev,
      codigoComuna: comunaId,
      comuna: c?.comunaNombre ?? '',
      region: c?.comunaCiudad ?? '',
    }));
  };

  const handleNewCustomer = () => {
    setDialogMode('create');
    setEditingKey(0);
    setFormData(EMPTY_CUSTOMER_FORM);
    setDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    const { id: _id, clienteKey: _ck, ...rest } = customer;
    setDialogMode('edit');
    setEditingKey(customer.clienteKey);
    setFormData({ ...rest, tipoPersona: tipoPersonaDesdeRut(customer.rut) });
    setDialogOpen(true);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    if (!customer.clienteKey) {
      toast.error('Cliente sin clienteKey persistido — no se puede crear la venta.');
      return;
    }
    try {
      const notaVentaKey = await crearVenta(customer.clienteKey);
      toast.success(`Venta ${notaVentaKey} creada para "${customer.fullName}"`);
      onSaleCreated?.(notaVentaKey);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la venta');
    }
  };

  const handleSubmitForm = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!formData.rut.trim()) errors.push('RUT');
    if (!formData.giro.trim()) errors.push('Giro');
    if (!formData.address.trim()) errors.push('Dirección');
    if (!formData.codigoComuna.trim()) errors.push('Comuna');
    if (formData.tipoPersona === 'Jurídica' && !formData.fullName.trim()) {
      errors.push('Razón Social');
    }
    if (formData.tipoPersona === 'Natural' && !formData.nombre.trim()) {
      errors.push('Nombre');
    }
    if (errors.length) {
      toast.error(`Campos requeridos: ${errors.join(', ')}`);
      return;
    }

    try {
      const clienteKey = await guardarCliente(formData, editingKey);
      toast.success(
        dialogMode === 'create'
          ? `Cliente creado (clienteKey: ${clienteKey})`
          : 'Cliente actualizado',
      );
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el cliente');
    }
  };

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-y-auto">

        {/* PAGE HEADER */}
        <div className="px-6 pt-8 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-foreground text-3xl tracking-tight">Clientes</h1>
            <p className="text-muted-foreground text-base">
              Selecciona o crea un cliente para iniciar la venta
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* TOP BAR */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                aria-label="Buscar por RUT, nombre o email"
                placeholder="Buscar por RUT, nombre..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 text-base"
              />
              {isSearching && (
                <Loader2
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin"
                  aria-hidden="true"
                />
              )}
            </div>
            <Button
              size="default"
              className="gap-2 shadow-md shadow-primary/20"
              onClick={handleNewCustomer}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              Nuevo Cliente
            </Button>
          </div>

          {/* BREADCRUMB */}
          <nav
            aria-label="Ruta de navegación"
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors disabled:cursor-default"
              disabled={!onBack}
            >
              <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Inicio</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="font-medium text-foreground" aria-current="page">
              Clientes
            </span>
          </nav>

          {/* DATA TABLE */}
          <Card>
            <CardContent className="p-0">
              <Table containerClassName="overflow-auto max-h-[calc(100vh-22rem)]">
                <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground px-4">CÓDIGO</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">RUT</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">TELÉFONO</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">EMAIL</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">NOMBRE COMPLETO</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">DIRECCIÓN</TableHead>
                    <TableHead className="font-semibold text-foreground px-4 text-center">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSearching && clientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                          <span className="text-base">Buscando clientes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : clientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-base">
                        No se encontraron clientes que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="px-4 font-mono text-sm text-foreground whitespace-nowrap">
                          {customer.clienteKey || '—'}
                        </TableCell>
                        <TableCell className="px-4 font-mono text-sm text-foreground whitespace-nowrap">
                          {customer.rut || '—'}
                        </TableCell>
                        <TableCell className="px-4 font-mono text-sm text-foreground whitespace-nowrap">
                          {customer.phone || '—'}
                        </TableCell>
                        <TableCell className="px-4 text-sm text-foreground">
                          {customer.email || '—'}
                        </TableCell>
                        <TableCell className="px-4 text-sm text-foreground">
                          {customer.fullName || '—'}
                        </TableCell>
                        <TableCell className="px-4 text-sm text-foreground">
                          {customer.address || '—'}
                        </TableCell>
                        <TableCell className="px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCustomer(customer)}
                                  className="text-primary hover:bg-brand-50 hover:text-primary"
                                  aria-label={`Editar cliente ${customer.fullName}`}
                                >
                                  <Edit className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar Cliente</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => void handleSelectCustomer(customer)}
                                  disabled={isCreating}
                                  className="text-success hover:bg-success/10 hover:text-success"
                                  aria-label={`Seleccionar cliente ${customer.fullName}`}
                                >
                                  {isCreating
                                    ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                    : <ChevronRight className="w-5 h-5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Seleccionar Cliente</p></TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* CUSTOMER FORM DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!isSaving) setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
            </DialogTitle>
            <DialogDescription>
              Los campos marcados con <span className="text-destructive">*</span> son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <form
            id="customer-form"
            onSubmit={(e) => void handleSubmitForm(e)}
            className="overflow-y-auto min-h-0 space-y-6 pr-1"
          >
            {/* Identificación */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Identificación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field id="f-rut" label="RUT" required>
                  <Input
                    id="f-rut"
                    value={formData.rut}
                    onChange={(e) => handleRutChange(e.target.value)}
                    className="font-mono border-2 border-brand-200 focus-visible:border-primary"
                    required
                  />
                </Field>
                <Field id="f-tipoId" label="Tipo de Identificador">
                  <Select
                    value={formData.tipoIdentificador}
                    onValueChange={(v) => updateField('tipoIdentificador', v)}
                  >
                    <SelectTrigger id="f-tipoId" className="w-full border-2 border-brand-200 focus-visible:border-primary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUT">RUT</SelectItem>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="f-tipoPersona" label="Tipo de Persona">
                  <div
                    id="f-tipoPersona"
                    className="flex h-9 w-full items-center rounded-md border-2 border-border bg-muted px-3 text-sm text-muted-foreground select-none"
                    title="Se determina automáticamente según el RUT ingresado"
                  >
                    {formData.tipoPersona || 'Ingrese un RUT'}
                  </div>
                </Field>
              </div>
            </section>

            {/* Nombre */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Nombre</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.tipoPersona === 'Jurídica' ? (
                  <div className="md:col-span-2">
                    <Field id="f-fullName" label="Razón Social" required>
                      <Input
                        id="f-fullName"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className="border-2 border-brand-200 focus-visible:border-primary"
                        required
                      />
                    </Field>
                  </div>
                ) : (
                  <>
                    <Field id="f-nombre" label="Nombre" required>
                      <Input
                        id="f-nombre"
                        value={formData.nombre}
                        onChange={(e) => updateField('nombre', e.target.value)}
                        className="border-2 border-brand-200 focus-visible:border-primary"
                        required
                      />
                    </Field>
                    <Field id="f-paterno" label="Apellido Paterno">
                      <Input
                        id="f-paterno"
                        value={formData.paterno}
                        onChange={(e) => updateField('paterno', e.target.value)}
                        className="border-2 border-brand-200 focus-visible:border-primary"
                      />
                    </Field>
                    <Field id="f-materno" label="Apellido Materno">
                      <Input
                        id="f-materno"
                        value={formData.materno}
                        onChange={(e) => updateField('materno', e.target.value)}
                        className="border-2 border-brand-200 focus-visible:border-primary"
                      />
                    </Field>
                  </>
                )}
              </div>
            </section>

            {/* Contacto */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field id="f-email" label="Email">
                  <Input
                    id="f-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="border-2 border-brand-200 focus-visible:border-primary"
                  />
                </Field>
                <Field id="f-movil" label="Teléfono Móvil">
                  <Input
                    id="f-movil"
                    value={formData.telefonoMovil}
                    onChange={(e) => updateField('telefonoMovil', e.target.value)}
                    className="font-mono border-2 border-brand-200 focus-visible:border-primary"
                  />
                </Field>
                <Field id="f-fijo" label="Teléfono Fijo">
                  <Input
                    id="f-fijo"
                    value={formData.telefonoFijo}
                    onChange={(e) => updateField('telefonoFijo', e.target.value)}
                    className="font-mono border-2 border-brand-200 focus-visible:border-primary"
                  />
                </Field>
              </div>
            </section>

            {/* Dirección */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Dirección</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Field id="f-address" label="Dirección" required>
                    <Input
                      id="f-address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="border-2 border-brand-200 focus-visible:border-primary"
                      required
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field id="f-comuna" label="Comuna" required>
                    <Select
                      value={formData.codigoComuna}
                      onValueChange={handleComunaChange}
                    >
                      <SelectTrigger id="f-comuna" className="w-full border-2 border-brand-200 focus-visible:border-primary">
                        <SelectValue placeholder={catalogosReady ? 'Seleccionar comuna...' : 'Cargando comunas...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {comunas.filter((c) => !!c.comunaId).map((c) => (
                          <SelectItem key={c.comunaId} value={c.comunaId}>
                            {c.comunaNombre} — {c.comunaCiudad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </section>

            {/* Comercial */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Comercial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field id="f-giro" label="Giro" required>
                  <Input
                    id="f-giro"
                    value={formData.giro}
                    onChange={(e) => updateField('giro', e.target.value)}
                    className="border-2 border-brand-200 focus-visible:border-primary"
                    required
                  />
                </Field>
                <Field id="f-categoria" label="Categoría de Precios">
                  <Select
                    value={formData.categoriaPrecios}
                    onValueChange={(v) => updateField('categoriaPrecios', v)}
                  >
                    <SelectTrigger id="f-categoria" className="w-full border-2 border-brand-200 focus-visible:border-primary">
                      <SelectValue placeholder={catalogosReady ? 'Seleccionar...' : 'Cargando...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.filter((c) => !!c.categoriaPrecioIdl).map((c) => (
                        <SelectItem key={c.categoriaPrecioIdl} value={c.categoriaPrecioIdl}>
                          {c.categoriaPrecioIdl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="md:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    id="f-retiene"
                    type="checkbox"
                    checked={formData.retieneImpuestos}
                    onChange={(e) => updateField('retieneImpuestos', e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary focus:outline-none focus:ring-4 focus:ring-ring/20"
                  />
                  <Label htmlFor="f-retiene" className="text-sm text-foreground">
                    Retiene impuestos
                  </Label>
                </div>
              </div>
            </section>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" form="customer-form" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />}
              {dialogMode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function tipoPersonaDesdeRut(rut: string): 'Natural' | 'Jurídica' {
  const num = parseInt(rut.replace(/\./g, '').replace(/-.*$/, '').replace(/\D/g, ''), 10);
  return !isNaN(num) && num >= 45_000_000 ? 'Jurídica' : 'Natural';
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}
function Field({ id, label, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
