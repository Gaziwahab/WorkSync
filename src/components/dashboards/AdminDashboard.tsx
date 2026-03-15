import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, GitBranch, Users, Clock } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [tasks, workflows, users] = await Promise.all([
        supabase.from("tasks").select("status"),
        supabase.from("workflows").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const taskData = tasks.data || [];
      return {
        totalTasks: taskData.length,
        pending: taskData.filter((t) => t.status === "pending").length,
        inProgress: taskData.filter((t) => t.status === "in_progress").length,
        completed: taskData.filter((t) => t.status === "completed").length,
        submitted: taskData.filter((t) => t.status === "submitted").length,
        totalWorkflows: workflows.count || 0,
        totalUsers: users.count || 0,
      };
    },
  });

  const { data: recentTasks } = useQuery({
    queryKey: ["admin-recent-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, deadline, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    { label: "Total Tasks", value: stats?.totalTasks || 0, icon: CheckSquare, color: "text-primary" },
    { label: "Workflows", value: stats?.totalWorkflows || 0, icon: GitBranch, color: "text-info" },
    { label: "Users", value: stats?.totalUsers || 0, icon: Users, color: "text-success" },
    { label: "Pending Review", value: stats?.submitted || 0, icon: Clock, color: "text-warning" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">System Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {stats?.pending || 0} tasks pending · {stats?.inProgress || 0} in progress · {stats?.completed || 0} completed
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
          <CardTitle className="text-sm font-semibold">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks && recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      {new Date(task.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
