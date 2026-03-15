import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, Send, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["employee-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("status")
        .eq("assigned_to", user!.id);
      const tasks = data || [];
      return {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
        submitted: tasks.filter((t) => t.status === "submitted").length,
        completed: tasks.filter((t) => t.status === "completed" || t.status === "approved").length,
      };
    },
    enabled: !!user,
  });

  const { data: myTasks } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, deadline, created_at")
        .eq("assigned_to", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const statCards = [
    { label: "Assigned Tasks", value: stats?.total || 0, icon: CheckSquare, color: "text-primary" },
    { label: "In Progress", value: stats?.pending || 0, icon: Clock, color: "text-warning" },
    { label: "Submitted", value: stats?.submitted || 0, icon: Send, color: "text-info" },
    { label: "Completed", value: stats?.completed || 0, icon: AlertCircle, color: "text-success" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {stats?.pending || 0} tasks need your attention
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="card-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label-text">{stat.label}</p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {myTasks && myTasks.length > 0 ? (
            <div className="space-y-3">
              {myTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks assigned yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
