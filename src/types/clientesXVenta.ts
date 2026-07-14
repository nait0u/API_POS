// ---------------------------------------------------------------------------
// Types del módulo Clientes xVenta — BFF /bff/api/pos/clientes/*
// ---------------------------------------------------------------------------
// ⚠️ Distinto del módulo legacy `clientes` (types/customer.ts), que usa la API
// xCliente de GeneXus — son dos APIs paralelas y ambas vigentes. No compartir
// identificadores entre ambas.
// ---------------------------------------------------------------------------

export interface ClienteXVentaRow {
  clienteKey: number;
  clienteRUT: string;
  clienteNombreCompleto: string;
  clienteGiro: string;
  clienteAddress: string;
}

export interface GetClientesXVentaOutput {
  clientes: ClienteXVentaRow[];
}

export interface GetClientesXVentaFiltro {
  filtroRUT?: string;
  filtroNombre?: string;
  filtroGenerico?: string;
}

export interface CrearClienteShellOutput {
  clienteKey: number;
}

export interface CopiarClienteInput {
  clienteKeyOrigen: number;
  clientePIValorNew: string;
  clienteAddressNew: string;
  clienteComunaIDNew: string;
}

export interface CopiarClienteOutput {
  clienteKeyNew: number;
}

export interface ActualizarClienteXVentaInput {
  clienteRUT?: string;
  clienteGiro?: string;
  clienteAddress?: string;
  clienteComunaId?: string;
  clienteMobilPhone?: string;
  clienteEmail?: string;
  clienteNombre?: string;
  clienteApellidoPaterno?: string;
  clienteApellidoMaterno?: string;
  clienteRazonSocial?: string;
}
