// ---------------------------------------------------------------------------
// Types del módulo Vendedores — BFF /bff/api/pos/vendedores
// ---------------------------------------------------------------------------

export interface VendedorItem {
  usuarioKey: number;
  usuarioApodo: string;
  usuarioPIValor: string;
  usuarioNombreCompleto: string;
}

export interface GetVendedoresOutput {
  vendedores: VendedorItem[];
}

export interface GetVendedoresFiltro {
  vendedorKey: number;
  vendedorExige: boolean;
  filtroOmniBox?: string;
  filtroGenerico?: string;
}
