import { Home, Users, FileText, Settings, BarChart3, Calendar, MapPin, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Users, label: "Ciudadanos", href: "/ciudadanos" },
  { icon: FileText, label: "Trámites", href: "/tramites" },
  { icon: BarChart3, label: "Reportes", href: "/reportes" },
  { icon: Calendar, label: "Eventos", href: "/eventos" },
  { icon: MapPin, label: "Ubicaciones", href: "/ubicaciones" },
  { icon: Bell, label: "Notificaciones", href: "/notificaciones" },
  { icon: Settings, label: "Configuración", href: "/configuracion" },
];

export const DashboardSidebar = () => {
  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-sm">BM</span>
            </div>
            <span className="text-sidebar-foreground font-semibold text-lg">BMUNIS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {sidebarItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground focus:outline-none"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground text-sm font-medium">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground">Admin</p>
              <p className="text-xs text-sidebar-foreground/60">Sistema Municipal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};