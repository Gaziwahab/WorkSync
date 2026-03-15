import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { CheckSquare, Clock, AlertTriangle, TrendingUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8",
  in_progress: "#3b82f6",
  submitted: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
  completed: "#10b981",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export default function ReportsPage() {
  const { data: taskStats } = useQuery({
    queryKey: ["report-task-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("status");
      const tasks = data || [];
      const statusCounts = tasks.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(statusCounts).map(([name, value]) => ({
        name: STATUS_LABELS[name] || name,
        value,
        color: STATUS_COLORS[name] || "#94a3b8",
      }));
    },
  });

  const { data: workflowStats } = useQuery({
    queryKey: ["report-workflow-stats"],
    queryFn: async () => {
      const { data: workflows } = await supabase.from("workflows").select("id, name");
      const { data: tasks } = await supabase.from("tasks").select("workflow_id, status");

      return (workflows || []).map((wf) => {
        const wfTasks = (tasks || []).filter((t) => t.workflow_id === wf.id);
        return {
          name: wf.name.length > 12 ? wf.name.slice(0, 12) + "…" : wf.name,
          total: wfTasks.length,
          completed: wfTasks.filter((t) => t.status === "completed").length,
          pending: wfTasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
        };
      });
    },
  });

  const { data: summaryStats } = useQuery({
    queryKey: ["report-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("status, created_at");
      const tasks = data || [];
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "completed").length;
      const overdue = tasks.filter((t) => t.status === "rejected").length;
      const active = tasks.filter((t) => ["in_progress", "submitted"].includes(t.status)).length;
      return { total, completed, overdue, active, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
    },
  });

  const summaryCards = [
    { label: "Total Tasks", value: summaryStats?.total || 0, icon: CheckSquare, accent: "text-primary" },
    { label: "Completion Rate", value: `${summaryStats?.rate || 0}%`, icon: TrendingUp, accent: "text-success" },
    { label: "Active Now", value: summaryStats?.active || 0, icon: Clock, accent: "text-warning" },
    { label: "Rejected", value: summaryStats?.overdue || 0, icon: AlertTriangle, accent: "text-destructive" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">System performance overview</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card className="card-shadow card-3d">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="label-text">{card.label}</p>
                      <p className="text-2xl font-bold tabular-nums mt-1">{card.value}</p>
                    </div>
                    <card.icon className={`h-5 w-5 ${card.accent}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {taskStats && taskStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taskStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {taskStats.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          color: "hsl(var(--foreground))",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">No task data available</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Workflow Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {workflowStats && workflowStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workflowStats} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                          color: "hsl(var(--foreground))",
                          fontSize: "12px",
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Total" />
                      <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} name="Completed" />
                      <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Active" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">No workflow data available</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
