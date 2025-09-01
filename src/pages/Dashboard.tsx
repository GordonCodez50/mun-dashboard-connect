import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";

const Dashboard = () => {
  return (
    <div className="h-screen flex bg-dashboard-bg">
      {/* Sidebar */}
      <div className="w-64 hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Page Title */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-dashboard-text-muted">
                Resumen general del sistema municipal
              </p>
            </div>

            {/* Stats */}
            <DashboardStats />

            {/* Welcome Section */}
            <DashboardWelcome />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;