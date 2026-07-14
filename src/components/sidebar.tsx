import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Wifi,
  MapPin,
  Receipt,
  Globe,
  CreditCard,
  ArrowLeftRight,
  Tag,
  Hash,
  UserCog,
  PackageSearch,
  SlidersHorizontal,
  FileUp,
  FileText,
  Clock,
  CalendarDays,
  Store,
  PieChart,
  Wrench,
  LogIn,
  Printer,
  RefreshCw,
  Users,
  ShieldCheck,
  Monitor,
  Contact,
  Package,
  Scale,
  LayoutGrid,
  DollarSign,
  KeyRound,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle?: () => void;
}

interface SidebarItem {
  path?: string;
  label: string;
  Icon: LucideIcon;
  children?: { path?: string; label: string; Icon: LucideIcon }[];
}

interface SidebarSection {
  key: string;
  label: string;
  items: SidebarItem[];
}

// Fragmento de URL → clave de sección que debe estar expandida
const PATH_TO_SECTION: Record<string, string> = {
  '/precios': 'definitions',
};

function pathMatchesSection(pathname: string, sectionKey: string): boolean {
  return Object.entries(PATH_TO_SECTION).some(
    ([path, key]) => key === sectionKey && pathname.startsWith(path),
  );
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => ({
    config: false,
    gestion: false,
    definitions: pathMatchesSection(location.pathname, 'definitions'),
  }));

  // Auto-expande la sección padre cuando cambia la ruta activa
  useEffect(() => {
    const entry = Object.entries(PATH_TO_SECTION).find(([path]) =>
      location.pathname.startsWith(path),
    );
    if (entry) {
      const sectionKey = entry[1];
      setExpandedSections((prev) => ({ ...prev, [sectionKey]: true }));
    }
  }, [location.pathname]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    { path: '/ventas/nueva', label: 'Venta', Icon: ShoppingCart },
    { path: '/ventas', label: 'Ventas', Icon: Receipt },
    { path: '/dashboard', label: 'Dashboard', Icon: BarChart3 },
  ];

  const sections: SidebarSection[] = [
    {
      key: 'config',
      label: 'Configuración',
      items: [
        { label: 'Empresa', Icon: Building2 },
        { label: 'Punto de Acceso', Icon: Wifi },
        { label: 'Ubicación', Icon: MapPin },
        { label: 'Impuestos', Icon: Receipt },
        { label: 'Traer Empresa desde Enternet', Icon: Globe },
        { label: 'Gestión Modo de Pago', Icon: CreditCard },
        { label: 'Tipo Movimiento', Icon: ArrowLeftRight },
        { label: 'Categoría', Icon: Tag },
        { label: 'Tipo de Código Ítem', Icon: Hash },
        { label: 'Perfil', Icon: UserCog },
        { label: 'Procesos Inventario', Icon: PackageSearch },
        { label: 'Propiedades (BETA)', Icon: SlidersHorizontal },
        { label: 'Carga Archivos de Configuración', Icon: FileUp },
      ],
    },
    {
      key: 'gestion',
      label: 'Gestión',
      items: [
        { label: 'Informe de Ventas Diario', Icon: FileText },
        { label: 'Turno', Icon: Clock },
        { label: 'Resumen de Actividad Diaria', Icon: CalendarDays },
        {
          label: 'Reportes',
          Icon: BarChart3,
          children: [
            { label: 'Ventas por Sucursal', Icon: Store },
            { label: 'Reportes Avanzados', Icon: PieChart },
          ],
        },
        { label: 'Operaciones', Icon: Wrench },
        { label: 'Sesiones', Icon: LogIn },
        { label: 'Re-emisión Documentos', Icon: Printer },
        { label: 'Actualizar Stock', Icon: RefreshCw },
      ],
    },
    {
      key: 'definitions',
      label: 'Definiciones',
      items: [
        { label: 'Usuarios', Icon: Users },
        { label: 'Asignación de Perfiles', Icon: ShieldCheck },
        { label: 'Enrolamiento de Equipos', Icon: Monitor },
        { label: 'Clientes', Icon: Contact },
        { label: 'Productos', Icon: Package },
        { label: 'Balanzas', Icon: Scale },
        { path: '/precios', label: 'Lista de Precios', Icon: ClipboardList },
        { label: 'Grupo Selector', Icon: LayoutGrid },
        { label: 'Categoría Precio', Icon: DollarSign },
        { label: 'Autoriza Este Terminal', Icon: KeyRound },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside
      className={cn(
        "bg-card border-r border-border flex flex-col shadow-sm transition-all duration-300 h-screen",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle + Nombre */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "w-12 h-12 rounded-xl flex-shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
              isCollapsed && "mx-auto"
            )}
          >
            <Menu className="w-6 h-6" />
          </Button>
          {!isCollapsed && (
            <div>
              <h1 className="text-foreground font-bold text-lg leading-tight">AndesPOS</h1>
              <p className="text-muted-foreground text-sm">POS System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navegación */}
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-visible space-y-6",
        isCollapsed ? "py-4 px-0" : "p-4"
      )}>

        {/* Módulos Principales */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center rounded-lg font-medium text-sm transition-all group",
                isCollapsed
                  ? "w-full h-12 justify-center"
                  : "w-full gap-3 px-4 py-3",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.Icon className={cn("w-5 h-5 flex-shrink-0", isActive(item.path) ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Secciones colapsables */}
        {sections.map((section) => {
          const isExpanded = expandedSections[section.key];
          const sectionContainsActive = section.items.some(
            (item) => !!item.path && isActive(item.path),
          );

          return (
            <div key={section.key}>
              {/* Encabezado de sección — clickeable para toggle */}
              {!isCollapsed ? (
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-4 py-2 mb-1 rounded-lg hover:bg-accent transition-colors group"
                  aria-expanded={isExpanded}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.1em]",
                      sectionContainsActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {section.label}
                    </span>
                    {sectionContainsActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      sectionContainsActive ? "text-primary" : "text-muted-foreground",
                      isExpanded ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className="w-full flex justify-center py-2 mb-1">
                  <div className="w-6 h-px bg-border" />
                </div>
              )}

              {/* Ítems anidados con animación */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  !isCollapsed && !isExpanded && "max-h-0 opacity-0",
                  ((!isCollapsed && isExpanded) || isCollapsed) && "max-h-[1000px] opacity-100"
                )}
              >
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isItemActive = !!item.path && isActive(item.path);
                    return (
                      <div key={item.label}>
                        <button
                          className={cn(
                            "flex items-center rounded-lg font-medium text-sm transition-all",
                            isCollapsed
                              ? "w-full h-12 justify-center"
                              : "w-full gap-3 py-2.5 pl-7 pr-4",
                            item.children && !isCollapsed && "justify-between",
                            isItemActive
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                          title={isCollapsed ? item.label : undefined}
                          onClick={
                            item.path
                              ? () => navigate(item.path!)
                              : item.children
                              ? () => toggleSection(`${section.key}.${item.label}`)
                              : undefined
                          }
                        >
                          <span className="flex items-center gap-3">
                            <item.Icon className={cn(
                              "w-5 h-5 flex-shrink-0",
                              isItemActive ? "text-primary-foreground" : ""
                            )} />
                            {!isCollapsed && <span>{item.label}</span>}
                          </span>
                          {item.children && !isCollapsed && (
                            <ChevronDown
                              className={cn(
                                "w-3.5 h-3.5 transition-transform duration-300",
                                expandedSections[`${section.key}.${item.label}`] ? "rotate-0" : "-rotate-90"
                              )}
                            />
                          )}
                        </button>

                        {/* Sub-ítems */}
                        {item.children && !isCollapsed && (
                          <div
                            className={cn(
                              "overflow-hidden transition-all duration-300",
                              expandedSections[`${section.key}.${item.label}`]
                                ? "max-h-96 opacity-100"
                                : "max-h-0 opacity-0"
                            )}
                          >
                            <div className="space-y-1 mt-1">
                              {item.children.map((child) => (
                                <button
                                  key={child.label}
                                  className="w-full flex items-center gap-3 py-2 pl-12 pr-4 rounded-lg font-medium text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                                  title={child.label}
                                  onClick={child.path ? () => navigate(child.path!) : undefined}
                                >
                                  <child.Icon className="w-4 h-4 flex-shrink-0" />
                                  <span>{child.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Botón colapsar */}
      <div className="px-4 py-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-muted-foreground hover:text-primary"
          onClick={onToggle}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* Perfil de Usuario */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors cursor-pointer group">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-2 border-card shadow-sm">
              <span className="text-primary-foreground font-bold text-xs">CP</span>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-bold text-xs truncate">Coni</p>
              <p className="text-muted-foreground text-[10px] truncate">Admin • Sucursal Centro</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
