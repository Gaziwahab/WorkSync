import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { EmployeeDashboard } from "@/components/dashboards/EmployeeDashboard";

export default function Dashboard() {
  const { role } = useAuth();

  return (
    <AppLayout>
      {role === "admin" && <AdminDashboard />}
      {role === "manager" && <ManagerDashboard />}
      {role === "employee" && <EmployeeDashboard />}
    </AppLayout>
  );
}
