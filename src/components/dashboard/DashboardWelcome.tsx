import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Settings } from "lucide-react";

export const DashboardWelcome = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-dashboard-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-card-foreground">
            Bienvenido al Sistema BMUNIS
          </CardTitle>
          <CardDescription>
            Panel de administración municipal - Sistema preparado para recibir sus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Trámite
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-accent">
              <Upload className="mr-2 h-4 w-4" />
              Importar Datos
            </Button>
            <Button variant="outline" className="border-border text-foreground hover:bg-accent">
              <Settings className="mr-2 h-4 w-4" />
              Configurar Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-dashboard-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Gestión de Ciudadanos</CardTitle>
            <CardDescription>
              Administrar registros de ciudadanos y documentación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent">
              Acceder
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-dashboard-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Trámites y Servicios</CardTitle>
            <CardDescription>
              Procesar y dar seguimiento a trámites municipales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent">
              Acceder
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-dashboard-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Reportes y Análisis</CardTitle>
            <CardDescription>
              Generar reportes y visualizar estadísticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent">
              Acceder
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};