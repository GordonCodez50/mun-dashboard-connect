import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock } from "lucide-react";

const stats = [
  {
    title: "Total Ciudadanos",
    value: "0",
    icon: Users,
    description: "Registrados en el sistema",
    trend: "+0% desde el mes pasado"
  },
  {
    title: "Trámites Activos",
    value: "0",
    icon: FileText,
    description: "En proceso actualmente",
    trend: "+0% desde la semana pasada"
  },
  {
    title: "Trámites Completados",
    value: "0",
    icon: CheckCircle,
    description: "Finalizados este mes",
    trend: "+0% desde el mes pasado"
  },
  {
    title: "Tiempo Promedio",
    value: "0d",
    icon: Clock,
    description: "Para completar trámites",
    trend: "0% más rápido que antes"
  }
];

export const DashboardStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-dashboard-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-dashboard-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
            <p className="text-xs text-dashboard-text-muted">
              {stat.description}
            </p>
            <p className="text-xs text-dashboard-text-muted mt-1">
              {stat.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};