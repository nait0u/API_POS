# Sistema de Diseño — AndesPOS

> **Versión:** 2.0.0 | **Última actualización:** Abril 2026
>
> Este documento es la **fuente única de verdad** para toda decisión visual y de componentes del sistema AndesPOS.
> Cualquier agente o desarrollador que trabaje en la UI **DEBE** leer y respetar este archivo antes de escribir código.

---

## 0. Reglas Inquebrantables

Estas reglas tienen prioridad absoluta. Si entran en conflicto con cualquier otra sección, ganan.

1. **NO tocar lógica de negocio.** Hooks, servicios, llamadas a API, cálculos de precios y cualquier código que no sea puramente de presentación son intocables. Solo se modifica lo relacionado al frontend visual: JSX, clases de Tailwind, estructura de componentes UI y estilos CSS.
2. **Coherencia visual total.** Cada pantalla del sistema debe verse como parte de la misma aplicación. Si un patrón visual existe en una pantalla, debe replicarse idénticamente en las demás.
3. **PROHIBIDO hardcodear colores.** Usar exclusivamente las variables semánticas definidas en `index.css` y mapeadas en la sección de tokens de este documento (ej. `bg-primary`, `text-foreground`, `border-border`). Nunca usar valores arbitrarios como `bg-[#1E40AF]` cuando existe un token equivalente.
4. **Componentes UI base obligatorios.** Antes de crear un `<button>`, `<input>`, `<select>` o `<table>` HTML crudo, verificar si existe un componente en `src/components/ui/`. Si existe, usarlo. Si no existe, crearlo siguiendo el patrón de los existentes (CVA + Radix + forwardRef).
5. **Verificación post-cambio.** Al terminar cualquier cambio de UI, invocar las skills `frontend-design`, `web-design-guidelines`, `ui-ux-pro-max` y `vercel-react-best-practices` para validar que se siguen las mejores prácticas de desarrollo de interfaces web, experiencia de usuario y programación React.

---

## 1. Visión y Principios

Estamos construyendo una herramienta de trabajo **rápida, predecible y accesible** para entornos de alto tráfico (minimarkets, repuestos). Nuestros usuarios tienen entre 30 y 60 años y trabajan bajo presión. Cada decisión de diseño se mide contra estos principios:

| Principio | Significado |
|---|---|
| **Keyboard-First** | Todos los flujos principales (búsqueda, cobro, navegación) deben poder completarse sin mouse. Atajos de teclado visibles en los botones. |
| **Cero Carga Cognitiva** | Las acciones primarias son obvias. No sacrificamos usabilidad por estética minimalista. |
| **Accesibilidad (WCAG AA)** | Contraste alto y tipografía legible no son negociables. Elementos semánticos HTML, `aria-label` donde corresponda, y navegación por teclado en todos los componentes. |
| **Velocidad percibida** | Transiciones suaves (`transition-all duration-300`), estados de carga claros, y auto-focus en inputs críticos. |

---

## 2. Stack Tecnológico Frontend

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | React | 19.2.4 |
| Lenguaje | TypeScript | (archivos `.tsx`) |
| Estilos | Tailwind CSS | v4.1.12 |
| Build Tool | Vite | 8.0.4 |
| Gestor de paquetes | npm | — |
| Componentes UI | shadcn/ui (Radix UI) | — |
| Variantes | class-variance-authority (CVA) | — |
| Iconos | lucide-react | — |
| Animaciones | Motion (importar desde `motion/react`) | — |
| Formularios | React Hook Form | 7.55.0 |
| Gráficos | Recharts | — |
| Toasts | Sonner | — |

### Reglas del stack

- **npm** es el único gestor de paquetes permitido.
- **NO** crear `tailwind.config.js` — estamos en Tailwind v4, la configuración vive en `index.css`.
- **NO** modificar tokens en `index.css` sin aprobación explícita.
- **Lucide-react** es la única fuente de iconos. Prohibido usar emojis, SVGs inline, o Material UI Icons como iconos de interfaz.

---

## 3. Estructura de Archivos

```
src/
├── index.css                    # Tema global, tokens CSS, configuración Tailwind v4
├── main.tsx                     # Entry point
├── App.tsx                      # Layout raíz (default export)
├── components/
│   ├── ui/                      # Componentes base reutilizables (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── select.tsx
│   ├── common/                  # Componentes compartidos entre módulos
│   └── [modulo]/                # Componentes específicos por módulo (precios/, ventas/, etc.)
├── hooks/                       # Custom hooks (lógica de negocio — NO TOCAR)
├── services/                    # Clientes API (lógica de negocio — NO TOCAR)
├── types/                       # Interfaces TypeScript
├── lib/
│   └── utils.ts                 # Utilidad cn() para composición de clases
└── data/                        # Datos mock para desarrollo
```

---

## 4. Sistema de Tokens de Diseño

Todos los tokens están definidos como CSS custom properties en `src/index.css` y mapeados a clases de Tailwind. **Siempre usar la clase de Tailwind**, nunca el valor hex directo.

### 4.1. Colores — Modo Claro (`:root`)

#### Fondos y Superficies

| Token CSS | Clase Tailwind | Valor Hex | Uso |
|---|---|---|---|
| `--background` | `bg-background` | `#F8FAFC` | Fondo general de la aplicación |
| `--card` | `bg-card` | `#FFFFFF` | Tarjetas, paneles, contenedores |
| `--popover` | `bg-popover` | `#FFFFFF` | Popovers, dropdowns |
| `--muted` | `bg-muted` | `#e8eaf6` | Fondos secundarios, filas alternas |
| `--accent` | `bg-accent` | `#e8eaf6` | Hover general sobre elementos |
| `--secondary` | `bg-secondary` | `#e8eaf6` | Botones secundarios |
| `--sidebar-accent` | `bg-sidebar-accent` | `#c5cae9` | Ítem activo/hover en el sidebar |

#### Texto

| Token CSS | Clase Tailwind | Valor Hex | Uso |
|---|---|---|---|
| `--foreground` | `text-foreground` | `#0F172A` | Texto principal (casi negro) |
| `--card-foreground` | `text-card-foreground` | `#0F172A` | Texto dentro de tarjetas |
| `--muted-foreground` | `text-muted-foreground` | `#475569` | Labels secundarios, placeholders, descripciones |
| `--popover-foreground` | `text-popover-foreground` | `#0F172A` | Texto en popovers |

#### Acciones Principales (Paleta Lucien Institucional)

| Token CSS | Clase Tailwind | Valor Hex | Uso |
|---|---|---|---|
| `--primary` | `bg-primary` | `#505daa` | Botón "Cobrar", acciones principales, header institucional |
| `--primary-foreground` | `text-primary-foreground` | `#FFFFFF` | Texto sobre fondo primary |
| `--ring` | `ring-ring` | `#505daa` | Anillo de focus en inputs |

**Hover sobre primary:** `hover:bg-primary/90` o `hover:bg-brand-900` para un azul ligeramente más oscuro.

**Regla de botones en modales:** Los botones de acción principal dentro de diálogos/modales (ej. "Crear Precio", "Importar") **deben** usar la variante `default` del `<Button>` (que aplica `bg-primary`), garantizando coherencia con el color institucional en toda la aplicación.

#### Bordes

| Token CSS | Clase Tailwind | Valor Hex | Uso |
|---|---|---|---|
| `--border` | `border-border` | `#9fa8da` | Bordes estándar, divisiones |
| `--input` | `border-input` | `#E2E8F0` | Bordes de inputs |

#### Estados Semánticos

| Token CSS | Clase Tailwind | Valor Hex | Uso |
|---|---|---|---|
| `--destructive` | `bg-destructive` / `text-destructive` | `#DC2626` | Errores, eliminar items |
| `--destructive-foreground` | `text-destructive-foreground` | `#FFFFFF` | Texto sobre fondo destructive |
| `--success` | (custom) | `#16A34A` | Éxito, pagos completados |

#### Escala Extendida de Marca (`brand-*`)

Para casos que requieran más granularidad que `primary`:

| Clase | Hex | Uso típico |
|---|---|---|
| `bg-brand-50` | `#e8eaf6` | Fondos sutiles de acento |
| `bg-brand-100` | `#c5cae9` | Badges, tags |
| `bg-brand-200` | `#9fa8da` | Bordes activos |
| `bg-brand-500` | `#505daa` | Iconos, acentos |
| `bg-brand-700` | `#3d4a8a` | Hover intenso |
| `bg-brand-900` | `#2a3570` | Hover sobre primary, header hover |

#### Escala de Peligro (`danger-*`)

| Clase | Hex | Uso típico |
|---|---|---|
| `bg-danger-50` | `#FEF2F2` | Fondo de mensajes de error |
| `bg-danger-100` | `#FEE2E2` | Fondo de alertas |
| `bg-danger-600` | `#DC2626` | = Destructive |
| `bg-danger-700` | `#B91C1C` | Hover sobre destructive |

### 4.2. Colores — Modo Oscuro (`.dark`)

El tema oscuro invierte las superficies manteniendo la identidad de marca:

| Token | Valor |
|---|---|
| `--background` | `#0F172A` |
| `--foreground` | `#F8FAFC` |
| `--card` | `#1E293B` |
| `--primary` | `#9fa8da` (Lucien 200 — contraste AA sobre fondos oscuros) |
| `--border` | `#334155` |
| `--sidebar` | `#2a3570` (Lucien 900 — sidebar oscuro con identidad de marca) |

---

### 4.3. Tipografía

#### Familias tipográficas

| Tipo | Familia | Clase Tailwind | Uso |
|---|---|---|---|
| Sans-serif | `Inter, sans-serif` | `font-sans` | Todo el texto de interfaz |
| Monospace | `Roboto Mono, monospace` | `font-mono` | Códigos de barra, SKU, datos numéricos críticos |

**Regla:** Las columnas de código de barra/SKU **deben** usar `font-mono`. Existen las clases utilitarias `.sku-column` y `.barcode-data` en `index.css` para esto.

#### Inputs numéricos (cantidad, precio)

Los campos `type="number"` **no deben mostrar flechas/spinners** del navegador. Los valores se ingresan exclusivamente por teclado. Esto se aplica globalmente vía CSS en `theme.css`:

```css
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
```

**Regla:** Nunca revertir esta regla. Si se necesita un stepper numérico, construir un componente custom con botones `+`/`-` usando `<Button variant="ghost" size="icon">`.

#### Tamaños de fuente

| Clase | Uso |
|---|---|
| `text-xs` | Labels pequeños, metadata |
| `text-sm` | Texto secundario, descripciones |
| `text-base` | Texto principal (16px) — **tamaño por defecto** |
| `text-lg` | Subtítulos, headings de sección |
| `text-xl` | Headings medianos |
| `text-2xl` | Headings grandes |
| `text-4xl` | Números destacados (totales, montos) |

#### Pesos de fuente

| Clase | Valor | Uso |
|---|---|---|
| `font-normal` | 400 | Texto regular |
| `font-medium` | 500 | Labels, texto importante |
| `font-semibold` | 600 | Headings, títulos de sección |
| `font-bold` | 700 | Totales, énfasis fuerte |

---

### 4.4. Espaciado

#### Padding y Margin

| Contexto | Clase |
|---|---|
| Componentes pequeños | `p-3`, `px-4 py-3` |
| Componentes medianos | `p-4`, `px-4 py-4` |
| Contenedores principales | `p-6`, `px-6 py-4` |

#### Gaps (Flexbox/Grid)

| Tamaño | Clase |
|---|---|
| Pequeño | `gap-2` |
| Mediano | `gap-3`, `gap-4` |
| Grande | `gap-6` |

### 4.5. Bordes, Radios y Sombras

#### Bordes

| Tipo | Clase |
|---|---|
| Estándar | `border border-border` |
| Enfatizado | `border-2 border-border` |
| Direccional | `border-t`, `border-b`, `border-r`, `border-l` |

#### Radios de borde

| Tipo | Clase | Valor |
|---|---|---|
| Estándar (cards) | `rounded-lg` | 0.5rem |
| Grande | `rounded-xl` | 0.75rem |
| Circular | `rounded-full` | — |

#### Sombras

| Nivel | Clase | Uso |
|---|---|---|
| Sutil | `shadow-sm` | Cards, sidebar |
| Estándar | `shadow-md` | Botones principales, header |
| Elevado | `shadow-lg` | Modales, drawers |
| Extra | `shadow-xl` | Overlays |

---

## 5. Arquitectura de Componentes

### 5.1. Componentes Base (`src/components/ui/`)

Estos son los primitivos del sistema. Se construyen con el patrón shadcn/ui: **Radix UI + CVA + forwardRef + cn()**.

#### `<Button />`

Variantes disponibles: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
Tamaños: `default`, `sm`, `lg`, `icon`.

```tsx
// Acción principal
<Button variant="default" size="lg">Cobrar [Enter]</Button>

// Acción secundaria
<Button variant="outline">Limpiar</Button>

// Eliminar
<Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>

// Acción sutil
<Button variant="ghost" size="sm">Ver más</Button>
```

**Regla:** Nunca usar `<button>` HTML crudo. Siempre importar desde `@/components/ui/button`.

#### `<Input />`

```tsx
// Input estándar
<Input placeholder="Buscar..." />

// Input de escáner (monospace, grande)
<Input autoFocus className="font-mono text-lg" placeholder="Escanear código..." />
```

**Regla:** Nunca usar `<input>` HTML crudo. Siempre importar desde `@/components/ui/input`.

**Regla — campos en formularios (modales y diálogos):** Todo `<Input>` y `<SelectTrigger>` dentro de un formulario **debe** llevar `border-2 border-brand-200 focus-visible:border-primary`. Esto asegura que los campos sean visualmente identificables incluso sin foco, evitando que el usuario no sepa qué puede editar.

```tsx
// Input en formulario
<Input
  id="f-campo"
  className="border-2 border-brand-200 focus-visible:border-primary"
/>

// Input con fuente mono (códigos, teléfonos)
<Input
  id="f-codigo"
  className="font-mono border-2 border-brand-200 focus-visible:border-primary"
/>

// SelectTrigger en formulario (siempre agregar w-full)
<SelectTrigger id="f-select" className="w-full border-2 border-brand-200 focus-visible:border-primary">
  <SelectValue />
</SelectTrigger>
```

Los campos de búsqueda en barras de filtros (fuera de formularios) **no** llevan este estilo — solo los inputs dentro de `<form>` o diálogos de creación/edición.

#### `<Card />`

Sistema compuesto: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Pedido Actual</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

**Regla:** Todo bloque de información principal debe envolverse en el sistema Card. No armar divs con sombras manualmente.

#### `<Dialog />`

El `DialogContent` tiene `max-h-[85vh]` y usa `flex flex-col` para evitar desbordamiento. El contenido central (entre `DialogHeader` y `DialogFooter`) **debe** incluir `overflow-y-auto min-h-0` para que sea scrolleable cuando el contenido excede el alto disponible.

```tsx
<DialogContent className="sm:max-w-lg">
  <DialogHeader>...</DialogHeader>
  <div className="space-y-4 overflow-y-auto min-h-0">
    {/* Contenido scrolleable */}
  </div>
  <DialogFooter>...</DialogFooter>
</DialogContent>
```

#### `<Select />`

Basado en Radix UI Select con sub-componentes: `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectLabel`, `SelectSeparator`.

**Regla:** Nunca usar `<select>` HTML crudo.

### 5.2. Componentes Pendientes de Creación

Si se necesita alguno de estos, crearlo en `src/components/ui/` siguiendo el patrón existente:

- [ ] `Table` — (`<Table>`, `<TableRow>`, `<TableCell>`, etc.)
- [ ] `Badge` — Para estados de stock, categorías
- [ ] `Dialog` / `AlertDialog` — Para confirmaciones
- [ ] `Drawer` — Para paneles laterales
- [ ] `Tabs` — Para navegación por pestañas
- [ ] `Tooltip` — Para información contextual
- [ ] `SearchInput` — Input con ícono de lupa y autoFocus

---

## 6. Patrones de Layout

### 6.1. Layout Principal (`App.tsx`)

```tsx
<div className="h-screen flex bg-background">
  <Sidebar
    currentView={currentView}
    onViewChange={setCurrentView}
    isCollapsed={isSidebarCollapsed}
  />
  <div className="flex-1 flex flex-col overflow-hidden">
    <Header
      onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      isSidebarCollapsed={isSidebarCollapsed}
    />
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {renderView()}
    </main>
  </div>
</div>
```

**Reglas:**
- El layout raíz ocupa `h-screen` completa.
- `<main>` siempre es scrolleable con `overflow-y-auto`.
- Usar `min-w-0` en flex children para evitar overflow.

### 6.2. Sidebar Colapsable

| Estado | Ancho | Clase |
|---|---|---|
| Expandido | 256px | `w-64` |
| Colapsado | 80px | `w-20` |

```tsx
<aside className={`bg-card border-r border-border flex flex-col shadow-sm
  transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

  {/* Logo — siempre visible */}
  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
    <span className="text-primary-foreground font-bold text-2xl">A</span>
  </div>

  {/* Texto — solo cuando expandido */}
  {!isCollapsed && (
    <div>
      <h1 className="text-foreground font-semibold">AndesPOS</h1>
      <p className="text-muted-foreground text-sm">POS System</p>
    </div>
  )}

  {/* Botones de navegación */}
  <button className="w-full px-4 py-3 text-left text-muted-foreground
    hover:bg-accent hover:text-foreground rounded-lg transition-all font-medium">
    {/* Siempre mostrar icono, texto solo si !isCollapsed */}
  </button>
</aside>
```

**Reglas:**
- Iconos siempre visibles. Texto se oculta con `{!isCollapsed && ...}`.
- Usar `title` en botones para tooltip cuando colapsado.
- Transición suave: `transition-all duration-300`.

### 6.3. Header Institucional

```tsx
<header className="bg-primary border-b border-brand-900 px-6 py-4 shadow-md">
  {/* Toggle sidebar */}
  <button className="p-2 text-primary-foreground hover:bg-brand-900 rounded-lg transition-colors">
    <Menu className="w-6 h-6" />
  </button>

  {/* Fecha/hora */}
  <p className="text-primary-foreground font-semibold text-base">{currentDate}</p>
  <p className="text-brand-200 text-sm">{currentTime}</p>
</header>
```

**Reglas:**
- Fondo: `bg-primary` (azul institucional).
- Texto principal: `text-primary-foreground` (blanco).
- Texto secundario: `text-brand-200` (azul claro).
- Botones hover: `hover:bg-brand-900`.

### 6.4. Tarjetas (Card-Based Layout)

Todo bloque de información debe vivir en una tarjeta:

```tsx
{/* Tarjeta simple */}
<Card>
  <CardContent className="p-6">
    {/* Contenido */}
  </CardContent>
</Card>

{/* Tarjeta con header separado */}
<Card>
  <CardHeader className="border-b border-border">
    <CardTitle className="text-foreground font-semibold text-lg">Título</CardTitle>
  </CardHeader>
  <CardContent className="p-6">
    {/* Contenido */}
  </CardContent>
</Card>
```

### 6.5. Vistas Scrolleables

```tsx
{/* Contenedor principal con scroll vertical */}
<div className="flex-1 overflow-y-auto p-6 space-y-6">
  {/* Contenido */}
</div>

{/* Tabla con scroll horizontal */}
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

**Regla:** Toda vista principal debe ser scrolleable. Nunca crear layouts que corten contenido.

### 6.6. Header de Vista (Page Header)

Todas las vistas deben comenzar con un header limpio, **sin card ni sombra**. El título usa `<h1>` semántico y el subtítulo tiene un color ligeramente más claro que el texto principal.

```tsx
<div className="flex-1 overflow-y-auto">
  {/* Header limpio — sin bg-white, sin rounded, sin shadow */}
  <div className="px-6 pt-8 pb-6 border-b border-border">
    <div className="flex items-end justify-between">
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl tracking-tight">
          Título de Vista
        </h1>
        <p className="text-muted-foreground text-base">
          Descripción de la vista
        </p>
      </div>
      {/* Botones de acción principales (si aplica) */}
    </div>
  </div>

  {/* Contenido de la vista */}
  <div className="p-6 space-y-6">
    {/* ... */}
  </div>
</div>
```

**Reglas:**
- `<h1>` con `text-3xl tracking-tight`, sin `font-bold`.
- Subtítulo con `text-muted-foreground`.
- `border-b border-border` como separador sutil entre header y contenido.
- Los botones de acción primaria (Nuevo, Importar, etc.) van en la **barra de búsqueda/filtros** debajo del header, NO junto al título.
- El contenido va siempre dentro de `<div className="p-6 space-y-6">` después del header.

### 6.7. Panel de Filtros Colapsable

Patrón estándar para filtros en vistas con tabla de datos. El botón de toggle vive en la barra de búsqueda y el panel se despliega debajo como un `<Card>`.

```tsx
{/* Barra de búsqueda + toggle de filtros */}
<div className="flex items-center gap-3 flex-wrap">
  <div className="relative flex-1 min-w-[200px]">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
    <Input className="pl-10 text-base" placeholder="Buscar..." />
  </div>
  <Button
    variant="outline"
    aria-expanded={filtersOpen}
    aria-controls="filter-panel"
    onClick={() => setFiltersOpen((o) => !o)}
  >
    <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
    Filtros
    {activeFilterCount > 0 && (
      <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold w-4 h-4 leading-none">
        {activeFilterCount}
      </span>
    )}
    {filtersOpen
      ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
      : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
  </Button>
</div>

{/* Panel colapsable */}
{filtersOpen && (
  <Card id="filter-panel" role="region" aria-label="Panel de filtros avanzados">
    <CardContent className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="filter-x" className="text-sm font-medium text-foreground">
            Etiqueta
          </label>
          <Input id="filter-x" placeholder="..." />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="w-4 h-4" aria-hidden="true" />
          Limpiar
        </Button>
        {/* Agregar botón "Buscar" solo si los filtros NO se aplican reactivamente */}
      </div>
    </CardContent>
  </Card>
)}
```

**Reglas:**
- El badge de conteo (`activeFilterCount`) solo se muestra cuando hay al menos un filtro activo.
- El ícono `ChevronUp`/`ChevronDown` indica visualmente el estado del panel.
- El panel usa `<Card>` con `id` y `role="region"` para accesibilidad.
- Cada campo lleva `<label>` con `htmlFor` apuntando al `id` del control.
- Si los filtros se aplican reactivamente (sin fetch explícito), omitir el botón "Buscar" y solo mostrar "Limpiar".

### 6.8. Estilo Base de Tablas

Todas las tablas del sistema usan el mismo estilo base. Nunca personalizar el look de una tabla individualmente.

```tsx
<Card>
  <CardContent className="p-0">
    <Table containerClassName="overflow-auto max-h-[calc(100vh-22rem)]">
      <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <TableRow>
          <TableHead className="font-semibold text-foreground px-4">COLUMNA</TableHead>
          <TableHead className="font-semibold text-foreground px-4 text-right">NÚMERO</TableHead>
          <TableHead className="font-semibold text-foreground px-4 text-center">ACCIONES</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Estado de carga */}
        <TableRow>
          <TableCell colSpan={N} className="h-32 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span className="text-base">Cargando...</span>
            </div>
          </TableCell>
        </TableRow>

        {/* Estado vacío */}
        <TableRow>
          <TableCell colSpan={N} className="h-32 text-center text-muted-foreground text-base">
            No se encontraron resultados.
          </TableCell>
        </TableRow>

        {/* Fila de datos */}
        <TableRow key={item.id}>
          <TableCell className="px-4 text-sm text-foreground">{item.campo}</TableCell>
          <TableCell className="px-4 font-mono text-sm text-foreground">código/SKU</TableCell>
          <TableCell className="px-4 font-mono text-sm text-foreground text-right font-medium">$precio</TableCell>
          <TableCell className="px-4">
            <div className="flex items-center justify-center gap-1">
              {/* Botones de acción con Tooltip */}
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**Reglas:**
- `<Card>` sin className extra. `<CardContent className="p-0">` directamente.
- `<TableHeader>` siempre sticky con `sticky top-0 z-10 bg-card border-b border-border shadow-sm`.
- Nombres de columnas en **MAYÚSCULAS**, `font-semibold text-foreground`.
- `<TableRow>` de datos sin `className` extra — los estilos hover/border vienen del componente base.
- Celdas de texto normal: `px-4 text-sm text-foreground`.
- Celdas de código/SKU: agregar `font-mono`.
- Celdas numéricas (precios, totales): `text-right font-medium font-mono`.
- Columna de acciones: header con `text-center`, celda con `flex items-center justify-center gap-1`.
- Estados de carga y vacío: `h-32 text-center` para altura consistente.

---

## 7. Estados Interactivos

### 7.1. Hover

```tsx
className="hover:bg-accent transition-colors"
```

### 7.2. Focus

```tsx
className="focus:outline-none focus:ring-4 focus:ring-ring/20"
```

### 7.3. Active / Click

```tsx
className="active:scale-[0.99]"
```

### 7.4. Disabled

```tsx
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### 7.5. Combinación completa (ejemplo input)

```tsx
className="w-full px-4 py-3 text-base border-2 border-input rounded-lg
  focus:outline-none focus:ring-4 focus:ring-ring/20
  bg-card text-foreground placeholder:text-muted-foreground
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors"
```

---

## 8. Iconos

### Biblioteca única: `lucide-react`

```tsx
import { ShoppingCart, Package, Settings, Plus, Trash2, Search, Menu } from 'lucide-react';
```

### Tamaños estándar

| Tamaño | Clase | Uso |
|---|---|---|
| 16px | `w-4 h-4` | Iconos en inputs, badges |
| 20px | `w-5 h-5` | **Estándar** — sidebar, botones |
| 24px | `w-6 h-6` | Header, acciones principales |

### Colores

| Contexto | Clase |
|---|---|
| Sobre fondo primary | `text-primary-foreground` |
| Acción/acento | `text-primary` |
| Sidebar activo | `text-primary` |
| Sidebar inactivo | heredado del texto padre |
| Destructivo | `text-destructive` |

### Prohibiciones

- **NO** usar emojis como iconos.
- **NO** usar SVGs inline cuando existe icono equivalente en lucide-react.
- **NO** usar Material UI Icons (`@mui/icons-material`) como iconos de interfaz.

---

## 9. Responsive Design

### Breakpoints (Tailwind estándar)

| Prefijo | Ancho mínimo |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

### Enfoque: Mobile-First

```tsx
{/* Ocultar texto en móvil, mostrar en tablet+ */}
<span className="hidden sm:inline">Notificaciones</span>

{/* Grid responsivo: 1 col → 2 col → 4 col */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>

{/* Layout 2 columnas: 1 col en móvil, 2/3 + 1/3 en desktop */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Principal */}</div>
  <div>{/* Sidebar */}</div>
</div>
```

### Layout flexible con proporciones

```tsx
className="flex-[65]"  // 65% del espacio
className="flex-[35]"  // 35% del espacio
```

---

## 10. Patrones de Estado y Datos

> **Nota:** Esta sección documenta patrones existentes para referencia. NO modificar la implementación de estos hooks/estados.

### Manejo de arrays inmutable

```tsx
// Agregar
setItems((prev) => [...prev, newItem]);

// Actualizar
setItems((prev) => prev.map((item) =>
  item.id === targetId ? { ...item, quantity: item.quantity + 1 } : item
));

// Eliminar
setItems((prev) => prev.filter((item) => item.id !== targetId));
```

### Mensajes de error temporales

```tsx
{error && (
  <div className="px-4 py-3 bg-danger-50 border border-destructive rounded-lg">
    <p className="text-destructive font-medium text-base">{error}</p>
  </div>
)}
```

### Auto-focus en inputs

```tsx
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);
```

---

## 11. Accesibilidad (WCAG AA)

### Requisitos obligatorios

1. **Elementos semánticos:** Usar `<header>`, `<main>`, `<nav>`, `<aside>`, `<button>`, `<table>` — nunca `<div>` con `onClick` simulando un botón.
2. **Labels en inputs:** Todo `<Input>` debe tener un `<label>` asociado o `aria-label`.
3. **Contraste:** Los pares foreground/background deben cumplir WCAG AA (ratio ≥ 4.5:1 para texto, ≥ 3:1 para texto grande).
4. **Navegación por teclado:** Todos los elementos interactivos deben ser alcanzables con Tab y activables con Enter/Space.
5. **Focus visible:** Nunca eliminar el indicador de focus. Usar `focus:ring-4 focus:ring-ring/20`.
6. **Atajos de teclado:** Mostrar el atajo en el label del botón (ej. `Cobrar [Enter]`).

---

## 12. Localización

### Idioma: Español (es-ES)

Toda la interfaz está en español.

### Formato de fechas

```tsx
new Date().toLocaleDateString('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
```

### Formato de horas

```tsx
new Date().toLocaleTimeString('es-ES');
```

### Formato de precios

```tsx
`$${total.toFixed(2)}`
```

---

## 13. Performance

- Usar `useRef` para referencias DOM, nunca `document.getElementById`.
- Keys únicas en listas: `key={item.id}` — nunca índices de array.
- Auto-focus con `useRef` + `useEffect`, no con atributo `autoFocus` en componentes condicionales.
- Lazy load de imágenes cuando aplique.
- Evitar re-renders: extraer componentes cuando un estado local causa re-render de una lista grande.

---

## 14. Convenciones de Código

### TypeScript

- **Todos** los archivos son `.tsx`.
- Definir `interface` para props de cada componente.
- Nunca usar `any`.

```tsx
interface FiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function FiltersBar({ searchTerm, onSearchChange }: FiltersBarProps) {
  // ...
}
```

### Componentes

- Functional components con hooks.
- **Named exports** para todos (excepto `App.tsx` que usa default export).
- PascalCase para nombres.
- Un componente por archivo.

### Imports (orden)

```tsx
// 1. React y hooks
import { useState, useRef, useEffect } from 'react';

// 2. Componentes UI base
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// 3. Componentes locales
import { FiltersBar } from './FiltersBar';

// 4. Hooks y servicios
import { usePrecios } from '@/hooks/usePrecios';

// 5. Tipos
import type { Precio } from '@/types/precios';

// 6. Iconos
import { Search, Plus, Trash2 } from 'lucide-react';
```

### Constantes y estado

- Siempre `const` o `let`, nunca `var`.
- No mutar estado directamente — siempre funciones de actualización inmutables.
- No crear componentes dentro de otros componentes.

---

## 15. Convenciones de Commits

```
[tipo]: descripción breve en español
```

Tipos: `feat`, `fix`, `refactor`, `style`, `docs`, `test`

Ejemplos:
```
feat: agregar vista de inventario
fix: corregir cálculo de total en POS
style: actualizar estilos de botones primarios
refactor: extraer componente FiltersBar
```

---

## 16. Checklist Pre-Cambio de UI

Antes de considerar terminado cualquier cambio visual:

- [ ] Usa exclusivamente tokens de color del sistema (no hex hardcodeados)
- [ ] Usa componentes de `ui/` en lugar de HTML crudo
- [ ] Los iconos provienen de `lucide-react`
- [ ] La vista es scrolleable con `overflow-y-auto`
- [ ] Es responsive (probado en breakpoints `md` y `lg` como mínimo)
- [ ] Los elementos interactivos tienen estados hover/focus/disabled
- [ ] Inputs tienen labels o `aria-label`
- [ ] El sidebar funciona colapsado y expandido
- [ ] La paleta institucional (azul primary) se respeta
- [ ] No se modificó ningún hook, servicio, ni lógica de negocio
- [ ] Se verificó con las skills `frontend-design`, `web-design-guidelines`, `ui-ux-pro-max` y `vercel-react-best-practices`
- [ ] Compila sin errores TypeScript
- [ ] No hay `console.log` innecesarios
- [ ] Imports no usados eliminados

---

## 17. Mejores Prácticas — Resumen Rápido

### HACER

- Usar componentes funcionales con hooks
- Definir interfaces para todas las props
- Usar semantic HTML (`<button>`, `<header>`, `<nav>`)
- Implementar estados de loading/error
- Mantener componentes pequeños y enfocados
- Usar `font-mono` para datos numéricos y códigos
- Hacer todas las vistas scrolleables
- Respetar la paleta institucional
- Mostrar atajos de teclado en botones principales

### NO HACER

- No usar `any` en TypeScript
- No mutar estado directamente
- No usar índices como keys en listas
- No crear archivos HTML standalone (todo en React)
- No usar emojis para iconos
- No crear layouts que corten contenido
- No usar `<div onClick>` en lugar de `<button>`
- No ignorar estados hover/focus/disabled
- No tocar hooks, servicios, ni lógica de negocio existente
