# Integración BFF xVenta — Carrito, Productos/OmniBox, Catálogos, Clientes, Vendedores, Balanza

Cobertura de endpoints nuevos del BFF (`andespos-middleware`), reglas de negocio no
obvias, y estado de la integración en el frontend. Referencia para continuar esta
integración en una sesión futura sin tener que re-descubrir lo de abajo.

## 1. Prefijo y transporte

Todos los endpoints de este documento viven en el BFF bajo `/api/pos/...`, pero se
llaman desde el frontend como `` `${BFF}/api/pos/...` `` (es decir `/bff/api/pos/...`),
vía el mismo `bffFetch` que el resto de la app. `/api` (sin `/bff`) sigue reservado
para la API legacy de GeneXus (`tokenService.ts`) — no reutilizar ese prefijo.

## 2. Headers de contexto — regla de oro

**No agregar headers por-llamada.** `bffFetch` (`src/services/apiClient.ts`) ya
inyecta automáticamente todo lo que hay en `_profileHeaders` (poblado por
`ProfileContext`/`PosStateContext`) en cada request. Ningún servicio/hook nuevo debe
construir o pasar `x-pos-*` manualmente.

**Lo que realmente valida el BFF para mutaciones de carrito** (`PosContextGuard` +
`assertContextoCompleto`, auditado contra `andespos-middleware` en esta sesión):
- `x-pos-emp-key` y `x-pos-punto-acceso-key` deben ser no-cero — es lo único que el
  BFF verifica antes de mutar.
- El `perfil` embebido en `x-pos-user` (dev) debe ser una clave válida de
  `PERFIL_CONFIG` en el BFF (hoy: `posadmcert` o `CAJERAADMINISTRATIVA`) — selecciona
  qué `PuntoAccesoKey`/`EstacionIdl` usa GeneXus al abrir la sesión Tomcat. Los dos
  perfiles dev existentes (`ProfileContext.tsx`) ya usan estos valores correctamente.
- `x-pos-turno-caja-key` y `x-pos-vendedor-key` se parsean y quedan en el contexto,
  pero **no se envían a GeneXus en ninguna mutación de carrito actual** — no sirven
  para "seleccionar" un turno abierto. No perder tiempo ajustándolos si una mutación
  falla; no es la causa.
- Lo que sí puede causar un 500 con FK violation (`viola la llave foránea
  «inotaventa2»`) al mutar el carrito es que GeneXus, del lado del servidor, no tenga
  un turno de caja realmente abierto para el `PuntoAccesoKey`/`EstacionIdl` que resolvió
  el `perfil` activo. Esto es una condición del entorno GeneXus (dev/test), no algo que
  el frontend pueda corregir enviando otro header — si una mutación de carrito falla así
  en el ambiente de pruebas, es una señal para abrir un turno en GeneXus, no para tocar
  `ProfileContext.tsx`.

## 3. Contrato de errores — `interpretPosError`

Todo catch de un hook de este módulo debe pasar el error por
`interpretPosError(err)` (`src/services/apiClient.ts`) en vez de repetir un switch de
status. Devuelve `{ kind, message, status, body }`:

| status | kind | Significado | UI esperada |
|---|---|---|---|
| 401 | `auth` | Token inválido/expirado | Redirigir a login |
| 404 | `not-found` | Producto/cliente/lote sin match | Mensaje claro, no reintentar |
| 409 | `not-editable` | NotaVenta no está en estado EDITANDO (ya emitida/cerrada) | Mensaje claro, no reintentar — **probablemente el error más común en producción** |
| 412 | `contexto-incompleto` | Faltan EmpKey/PuntoAccesoKey | Error de configuración de sesión, no de usuario |
| 428 | `lote-requerido` | El producto exige lote (flujo OmniBox) | Abrir `LoteSelectorDialog` con `body.lotes` |
| 422 | `negocio` | Regla de negocio/matemática fallida | Mensaje del BFF tal cual |

`ApiError` (`apiClient.ts`) ahora incluye `body?: unknown` con el JSON parseado del
error — necesario para el 428, cuyo body trae `{ code: 'LOTE_REQUERIDO', productoKey,
lotes }` (tipo `LoteRequeridoErrorBody` en `types/carrito.ts`).

## 4. Reglas de negocio — carrito

- **Cantidad aditiva vs absoluta**: `agregarProductoCarrito`/`omniboxAgregar` (POST) es
  SIEMPRE aditivo — usar solo para "+1" (escanear, tocar un producto).
  `fijarCantidadCarrito` (PUT `/producto/cantidad`) fija la cantidad ABSOLUTA — usar
  solo para inputs donde el usuario edita la cantidad directamente. Mezclarlos produce
  bugs de cantidad difíciles de rastrear.
- **Serialización de mutaciones de cantidad**: `useCarrito().fijarCantidad` encola
  llamadas mediante un mutex interno (`cantidadMutexRef`) — GeneXus encadena dos
  llamadas sobre un estado server-side compartido por `NotaVentaKey`; llamadas
  concurrentes sobre la misma "línea activa" pueden pisarse entre sí.
- **Dedupe por `linea`**: toda mutación de carrito devuelve `DeltaCarritoResponseDto`,
  consolidado en `usePosVentaStore.mergeCarrito` (mismo store que ya usa
  `PantallaVentaView` para el carrito de solo lectura — no se creó un store paralelo,
  ver §6). `itemsActualizados` puede traer entradas duplicadas para la misma `linea`
  (ej. la línea sintética `99999` de descuento global) — el merge hace upsert por
  `linea`, último valor gana.
- **Descuento global — recálculo perezoso (ejemplo real que confundió a la sesión
  anterior)**: al aplicar `PUT /carrito/descuento-global` con 10%, la respuesta
  inmediata de esa llamada — e incluso un `GET /pantalla/totales` disparado justo
  después — puede seguir mostrando `totalBruto` **sin el descuento aplicado**. Esto NO
  es un bug: GeneXus recalcula el descuento de forma perezosa y solo lo refleja en la
  **siguiente** mutación de carrito. Quien construya el panel de descuento (pasada
  futura, ver §7) no debe re-diagnosticar esto como "el descuento no se aplicó" — hay
  que esperar a la próxima acción del usuario, o mostrar un estado "recalculando..." en
  vez de bloquear la UI.
- **`precioPicture`/`cantidadPicture` nunca se castean a número** — son strings
  pre-formateados por GeneXus (`GET /ventas/pantalla/selector-general`). Renderizar tal
  cual. `precioItem`/`stock` de `POST /ventas/pantalla/filtro-categorias` sí son
  numéricos reales — no confundir los dos shapes, son endpoints con contratos distintos
  a pesar de sonar similares.

## 5. Migración selector-general / filtro-categorias

`PantallaVentaView.tsx` consumía `getFiltroCategoriasVenta` con un shape PascalCase
obsoleto (`ProductoKey`, `ProductoPrecio` numérico) que ya no corresponde al contrato
real del BFF. Se migró (autorizado explícitamente, excepción puntual a "no tocar
integraciones existentes"):
- `types/ventas.ts`: `GetSelectorGeneralOutput`/`GxSelectorProductoGeneralItem` ahora
  camelCase (`productoKey`, `precioPicture: string`, etc.). `GetFiltroCategoriasOutput`
  ya NO es alias de `GetSelectorGeneralOutput` — tiene su propio shape
  (`GxFiltroCategoriaProductoItem`: `mItemKey`, `mItemNom`, `codigo`, `categoria`,
  `precioItem: number`, `stock`), porque el BFF los devuelve distintos.
- `PantallaVentaView.tsx`: `resultadosFiltro` y su render migrados al nuevo shape.
- El botón "Agregar" de esos resultados sigue sin handler — no se modificó su
  comportamiento; conectarlo es parte del carrito completo (§7).

## 6. Decisión de arquitectura — sin store de carrito paralelo

El carrito ya se renderiza en `PantallaVentaView.tsx` desde `usePosVentaStore`
(poblado originalmente por `GET /ventas/pantalla/carrito`). `DeltaCarritoResponseDto`
(la respuesta de toda mutación nueva) tiene exactamente la misma forma en
`.carrito`/`.totales` que `GetPantallaVentaCarritoOutput`/`GetPantallaVentaTotalesOutput`.
Por eso `useCarrito()` (`src/hooks/useCarrito.ts`) llama
`usePosVentaStore().mergeCarrito(delta.carrito)` +
`setTotalesData(delta.totales)` directamente — no existe un `carritoStore.ts`
separado. Crear uno hubiera dejado dos fuentes de verdad del carrito
desincronizadas (el carrito visible no se habría actualizado con las mutaciones
nuevas). Si una sesión futura necesita desacoplar esto, hacerlo reemplazando
`posVentaStore`, no agregando un segundo store en paralelo.

## 7. Estado de la integración — qué quedó wireado y qué no

**Wireado en esta pasada:**
- Servicios tipados completos para carrito, productos/omnibox, catálogos, clientes
  xVenta y vendedores (`src/services/apiClient.ts`).
- `useCarrito`, `useProductosOmnibox`, `useCatalogosXVenta`, `useClientesXVenta`,
  `useVendedores`.
- **Corrección de flujo (revisión posterior)**: el input de búsqueda de
  `PantallaVentaView.tsx` ("Código o descripción...") originalmente disparaba
  `POST /carrito/omnibox` en cada Enter/Buscar, tratando toda entrada como un código
  escaneado. Esto era el endpoint equivocado para búsqueda de texto libre —
  `omnibox/resolver`/`agregarProductoPorOmnibox` hacen resolución 1:1 código→producto,
  no matching parcial por descripción, y por diseño devuelven 404 ante texto libre (ej.
  "coca"). Corregido a:
  - El input principal llama siempre a `GET /ventas/pantalla/selector-general` (función
    `handleBuscarProductos`) y muestra la lista de resultados (`resultadosBusqueda`)
    debajo de la barra de búsqueda, sea que devuelva 0, 1 o varios productos.
  - Al hacer clic en un resultado (`handleAgregarResultadoBusqueda`), el `productoKey`
    ya está resuelto — se agrega directo con `POST /carrito/producto`
    (`useCarrito().agregarProducto`), sin volver a llamar a omnibox/resolver. Si el ítem
    trae `productoVendeLote: true`, primero se resuelve la lista de lotes
    (`GET /productos/:productoKey/lotes`, vía `useProductosOmnibox().getLotes`) y se abre
    `LoteSelectorDialog` antes de agregar; si GeneXus de todas formas rechaza por lote
    obligatorio (condición de carrera), el catch defensivo detecta el 428
    (`interpretPosError`) y abre el mismo selector con la lista que trae el error.
  - `agregarProductoPorOmnibox` (`useCarrito().omniboxAgregar`, ya construido en la capa
    de servicios) queda **sin usar en esta vista** — reservado para el popup dedicado del
    botón "ESCÁNER" (`usaLectorQR`), que el usuario indicó explícitamente que aún no está
    implementado y debe ignorarse por ahora. No se eliminó del código porque sigue siendo
    la función correcta para ese futuro flujo de escaneo.
  - `LoteSelectorDialog` y `handleSelectLote` (selección de lote → `POST /carrito/producto`
    con `loteKey`) se reutilizaron sin cambios — ya estaban desacoplados de omnibox.

**Wireado en la pasada siguiente (botones CLIENTE/VENDEDOR/GLOSA/TRANSPORTISTA/DESCUENTO
de la toolbar de acciones — ver §9):**
- Los 5 diálogos y sus botones disparadores en `PantallaVentaView.tsx`.

**Deliberadamente NO wireado todavía:**
- Steppers de cantidad, botón eliminar línea, edición de glosa por línea (`setGlosaLinea`),
  referencias (`setReferencias`) — siguen sin control de UI; requieren una línea de
  carrito seleccionable, que hoy no existe (cart-line UI diferido).
- El botón "Agregar" de los resultados de filtro-categorias.
- **Balanza**: `src/services/balanzaSocket.ts` + `src/hooks/useBalanza.ts` son
  scaffolding intencionalmente NO conectado a ninguna vista — no había hardware de
  balanza disponible para validar end-to-end en esta sesión. `useBalanza().connect()`
  debe invocarse explícitamente desde una vista cuando haya hardware para probarlo; no
  es un cabo suelto, es una decisión deliberada de alcance.

## 8. Dependencias añadidas

- `socket.io-client` (solo consumido por `balanzaSocket.ts`).

## 9. Wiring de UI — Cliente, Glosa, Transportista, Descuento, Vendedor

Los botones `CLIENTE`, `VENDEDOR`, `GLOSA`, `TRANSPORTISTA`, `DESCUENTO` de la toolbar de
acciones en `PantallaVentaView.tsx` ahora abren un diálogo propio cada uno, todos
siguiendo el patrón de `EditPriceDialog.tsx`/`LoteSelectorDialog.tsx`
(`Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter` de `@/components/ui/dialog`).

**Regla de merge — solo Descuento toca el carrito.** De los 5 flujos, únicamente
`PUT /carrito/descuento-global` devuelve `DeltaCarritoResponseDto` — `DescuentoGlobalDialog`
alimenta `useCarrito().setDescuentoGlobal`, que ya hace el merge en `posVentaStore`
(igual que `agregarProducto`/`eliminarLinea`). Cliente (`{ categoriaIdl }`), Vendedor/
Glosa/Transportista (`{ ok: true }`) **no** tocan carrito ni totales — su único efecto en
la UI es local:
- Cliente/Vendedor: `usePosVentaStore().patchActores(...)` (nueva acción del store, ver
  abajo) actualiza `initData.actores.clienteNombreCompleto`/`vendedorApodo` con el dato
  ya disponible en la fila que el usuario clickeó — sin refetch de `GetPantallaVentaInit`.
  Esto además actualiza el banner (`PosBanner.tsx`, que lee `selectBannerTransaccion`)
  sin cambios en ese componente.
- Glosa/Transportista: solo cierran el diálogo y muestran un toast de confirmación.

**`patchActores`** (`src/store/posVentaStore.ts`): merge parcial sobre `initData.actores`,
no-op si `initData` es `null`. Se agregó porque no existía ningún setter granular para
actualizar cliente/vendedor sin reemplazar todo `initData`.

**CLIENTE** (`src/components/pos/ClienteXVentaDialog.tsx`): buscador de 3 campos
(`filtroRUT`/`filtroNombre`/`filtroGenerico`, debounced vía `useClientesXVenta`, que se
extendió de un `searchText` de un solo campo a un objeto `filtro` con los 3 — no tenía
otros consumidores, no rompe nada). Incluye asignar, quitar (`clienteKey: 0`), crear
shell (`POST /clientes/shell` → asigna inmediatamente → abre el form de edición porque el
shell nace vacío), editar (`PUT /clientes/:clienteKey`) y duplicar
(`POST /clientes/copiar`). Editar/duplicar actualizan la lista local
(`patchClienteLocal`/`addClienteLocal`, nuevas funciones de `useClientesXVenta`) sin
refetch.

**VENDEDOR**: el botón ya existía en la toolbar (`{vendedorEditable && <ActionBtn label="VENDEDOR" .../>}`)
gateado por `selectVendedorEditable` — no fue necesario agregar un botón nuevo en otro
lugar de la UI, contrario a lo que se anticipaba antes de revisar el código.
`VendedorDialog.tsx` usa `vendedorKey`/`vendedorExige` (`ReglaDeNegocio.exigeVendedorOk`,
ya cargado en `initData`, se agregó el selector `exigeVendedorOk` en la vista) como query
params obligatorios de `GET /vendedores`. Sin CRUD — el backend no lo expone para
vendedores, solo búsqueda + asignación.

**GLOSA** (`GlosaCabeceraDialog.tsx`): un solo `<textarea>` (no existe un componente
`Textarea` en `components/ui`, se usó un elemento nativo estilizado en línea con
`Input`). ⚠️ No hay ningún campo de glosa de cabecera cargado hoy en `GetPantallaVentaInit`
— el diálogo siempre abre vacío (`glosaActual=""` fijo en `PantallaVentaView.tsx`); si el
BFF llega a exponer la glosa vigente en `init` o `totales`, cablear ese valor al prop
`glosaActual` en vez de la cadena vacía.

**TRANSPORTISTA** (`TransportistaDialog.tsx`): dropdowns de Motivo/Tipo de traslado
poblados desde `useCatalogosXVenta()` (`motivosTraslado`/`tiposTraslado`, ya existían).
⚠️ `llegadaHora` es `number` en el DTO (a diferencia de `salidaHora`, que es `string`) —
el formato real (¿HHMM? ¿solo la hora?) no está confirmado contra un caso de uso real de
GeneXus. Se implementó como input numérico simple con un comentario explícito en el
código (`TransportistaDialog.tsx`) — no asumir un formato sin validarlo contra el BFF real.

**DESCUENTO GLOBAL** (`DescuentoGlobalDialog.tsx`): toggle porcentaje/monto, envía `0` en
el campo no usado (nunca `undefined`), botón "Quitar descuento" envía
`{ descuentoPorcentaje: 0, descuentoTotal: 0 }`. El toast de confirmación menciona
explícitamente que el total puede tardar en reflejarse (ver §4, recálculo perezoso) para
no generar una falsa alarma de "no se aplicó".

**Shortcuts de teclado (`kbd="F2"`, `"F3"`, etc.)**: se verificó que no existe ninguna
infraestructura de listener global de teclado en el proyecto (solo un handler local en
`components/ui/sidebar.tsx` para Ctrl+B, no relacionado). Los labels `kbd` siguen siendo
puramente decorativos — no se construyó una infraestructura de shortcuts nueva solo para
este wiring. Pendiente para una sesión futura si se decide implementarlo.
