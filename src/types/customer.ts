// ---------------------------------------------------------------------------
// Modelo de Cliente — front display + DTOs del BFF (/bff/clientes/*)
// ---------------------------------------------------------------------------

// ── Front display model ──────────────────────────────────────────────────────

/**
 * Modelo del cliente como lo consume la UI. Es una proyección "aplanada" de
 * SDTCliente del BFF, con campos derivados (`fullName`, `tipoPersona`, `phone`,
 * `comuna`, `region`) que la grilla y el formulario usan directamente.
 */
export interface Customer {
  /** Stable React key. Para clientes persistidos = `cli-${clienteKey}`. */
  id: string;
  /** Identidad autoritativa del cliente en el BFF. 0 = no persistido. */
  clienteKey: number;
  rut: string;
  phone: string;
  email: string;
  fullName: string;
  address: string;
  tipoIdentificador: string;
  tipoPersona: 'Natural' | 'Jurídica';
  nombre: string;
  paterno: string;
  materno: string;
  telefonoMovil: string;
  telefonoFijo: string;
  giro: string;
  categoriaPrecios: string;
  retieneImpuestos: boolean;
  codigoComuna: string;
  /** Nombre de la comuna resuelto desde el catálogo (no viene del SDT). */
  comuna: string;
  /** Región resuelta desde el catálogo (ComunaCiudad). */
  region: string;
  /** Cliente matriz al que está subordinado (0 = no aplica). */
  clienteMatrizKey: number;
}

/** Payload del formulario. `id` y `clienteKey` los asigna el BFF al persistir. */
export type CustomerFormData = Omit<Customer, 'id' | 'clienteKey'>;

export const EMPTY_CUSTOMER_FORM: CustomerFormData = {
  rut: '',
  phone: '',
  email: '',
  fullName: '',
  address: '',
  tipoIdentificador: 'RUT',
  tipoPersona: 'Natural',
  nombre: '',
  paterno: '',
  materno: '',
  telefonoMovil: '',
  telefonoFijo: '',
  giro: '',
  categoriaPrecios: '',
  retieneImpuestos: false,
  codigoComuna: '',
  comuna: '',
  region: '',
  clienteMatrizKey: 0,
};

// ── DTOs del BFF ─────────────────────────────────────────────────────────────

/** Fila devuelta por POST /bff/clientes/lista. */
export interface SDTClienteRow {
  clienteKey: number;
  clientePITipo?: string;
  clientePIValor?: string;
  clienteRUT?: string;
  /** Campo combinado que devuelve el endpoint /lista (SDTListaClientes). */
  clienteNombreCompleto?: string;
  clienteRazonSocial?: string;
  clienteNombre?: string;
  clienteApellidoPaterno?: string;
  clienteApellidoMaterno?: string;
  clienteGiro?: string;
  clienteEmail?: string;
  clienteHomePhone?: string;
  clienteMobilPhone?: string;
  clienteAddress?: string;
  clienteComunaId?: string;
  clienteRetieneImpuestos?: boolean;
  categoriaPrecioIdl?: string;
  clienteMatrizKey?: number;
}

export interface GetClientesOutput {
  clientes: SDTClienteRow[];
}

/** Body de POST /bff/clientes. clienteKeyIn=0 (o ausente) crea; >0 actualiza. */
export interface GuardarClienteInput {
  clienteKeyIn?: number;
  clienteRUT: string;
  clienteGiro: string;
  clienteAddress: string;
  clienteComunaID: string; // ojo: ID con D mayúscula (spec del BFF)
  clientePITipo?: string;
  clientePIValor?: string;
  clienteRazonSocial?: string;
  clienteNombre?: string;
  clienteApellidoPaterno?: string;
  clienteApellidoMaterno?: string;
  categoriaPrecioIdl?: string;
  clienteEmail?: string;
  clienteHomePhone?: string;
  clienteMobilPhone?: string;
  clienteRetieneImpuestos?: boolean;
  clienteMatrizKey?: number;
}

export interface GuardarClienteOutput {
  clienteKey: number;
  mensaje: string;
}

export interface ComunaItem {
  comunaId: string;
  comunaNombre: string;
  comunaCiudad: string;
}

export interface GetComunasOutput {
  comunas: ComunaItem[];
}

export interface CategoriaPrecioClienteItem {
  categoriaPrecioIdl: string;
  categoriaPrecioTipo: string;
}

export interface GetCategoriasPrecioClienteOutput {
  categorias: CategoriaPrecioClienteItem[];
}

export interface GetClienteMatrizOutput {
  requiereSubordinacionOk: boolean;
  clienteMatrizKey: number;
}

// ── Mapeos BFF ↔ UI ──────────────────────────────────────────────────────────

/**
 * Convierte una fila del BFF en el `Customer` que consume la UI.
 * `comuna` y `region` se resuelven del catálogo (`comunasIndex`); si no hay
 * match, se dejan en blanco (la UI muestra "—").
 */
export function sdtToCustomer(
  row: SDTClienteRow,
  comunasIndex: ReadonlyMap<string, ComunaItem>,
): Customer {
  // clienteNombreCompleto viene del endpoint /lista; los campos individuales
  // vienen del endpoint de detalle. Usar el que esté disponible.
  const esJuridica = !!row.clienteRazonSocial?.trim();
  const fullName =
    row.clienteNombreCompleto?.trim() ||
    row.clienteRazonSocial?.trim() ||
    [row.clienteNombre, row.clienteApellidoPaterno, row.clienteApellidoMaterno]
      .map((s) => (s ?? '').trim())
      .filter(Boolean)
      .join(' ');

  const comunaId = row.clienteComunaId ?? '';
  const comunaInfo = comunasIndex.get(comunaId);

  return {
    id: `cli-${row.clienteKey}`,
    clienteKey: row.clienteKey,
    rut: (row.clienteRUT ?? '').trim(),
    phone: (row.clienteMobilPhone ?? row.clienteHomePhone ?? '').trim(),
    email: (row.clienteEmail ?? '').trim(),
    fullName,
    address: (row.clienteAddress ?? '').trim(),
    tipoIdentificador: row.clientePITipo ?? 'RUT',
    tipoPersona: esJuridica ? 'Jurídica' : 'Natural',
    nombre: row.clienteNombre ?? '',
    paterno: row.clienteApellidoPaterno ?? '',
    materno: row.clienteApellidoMaterno ?? '',
    telefonoMovil: row.clienteMobilPhone ?? '',
    telefonoFijo: row.clienteHomePhone ?? '',
    giro: row.clienteGiro ?? '',
    categoriaPrecios: row.categoriaPrecioIdl ?? '',
    retieneImpuestos: row.clienteRetieneImpuestos ?? false,
    codigoComuna: comunaId,
    comuna: comunaInfo?.comunaNombre ?? '',
    region: comunaInfo?.comunaCiudad ?? '',
    clienteMatrizKey: row.clienteMatrizKey ?? 0,
  };
}

/**
 * Convierte el form a payload del BFF. Para personas jurídicas usa
 * `clienteRazonSocial = fullName`; para naturales arma nombre + apellidos.
 */
export function formToGuardarPayload(
  form: CustomerFormData,
  clienteKeyIn: number,
): GuardarClienteInput {
  const esJuridica = form.tipoPersona === 'Jurídica';
  return {
    clienteKeyIn: clienteKeyIn || 0,
    clienteRUT: form.rut.trim(),
    clienteGiro: form.giro.trim(),
    clienteAddress: form.address.trim(),
    clienteComunaID: form.codigoComuna.trim(),
    clientePITipo: form.tipoIdentificador || undefined,
    clientePIValor: form.rut.trim() || undefined,
    clienteRazonSocial: esJuridica ? form.fullName.trim() : undefined,
    clienteNombre: esJuridica ? undefined : form.nombre.trim() || undefined,
    clienteApellidoPaterno: esJuridica ? undefined : form.paterno.trim() || undefined,
    clienteApellidoMaterno: esJuridica ? undefined : form.materno.trim() || undefined,
    categoriaPrecioIdl: form.categoriaPrecios || undefined,
    clienteEmail: form.email.trim() || undefined,
    clienteHomePhone: form.telefonoFijo.trim() || undefined,
    clienteMobilPhone: form.telefonoMovil.trim() || form.phone.trim() || undefined,
    clienteRetieneImpuestos: form.retieneImpuestos,
    clienteMatrizKey: form.clienteMatrizKey || undefined,
  };
}
