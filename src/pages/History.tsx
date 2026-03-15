import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  const { data: history } = useQuery({
    queryKey: ["all-history"],
    queryFn: async () => {
      const { data: historyData } = await supabase
        .from("task_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!historyData || historyData.length === 0) return [];

      // Fetch related tasks
      const taskIds = [...new Set(historyData.map((h) => h.task_id))];
      const { data: tasks } = await supabase.from("tasks").select("id, title").in("id", taskIds);
      const taskMap = Object.fromEntries((tasks || []).map((t) => [t.id, t]));

      // Fetch related profiles
      const userIds = [...new Set(historyData.map((h) => h.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

      return historyData.map((h) => ({
        ...h,
        task: taskMap[h.task_id] || null,
        profile: profileMap[h.user_id] || null,
      }));
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Workflow History</h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable record of all task changes</p>
        </div>

        <Card className="card-shadow">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 label-text">Task</th>
                  <th className="text-left p-3 label-text">Action</th>
                  <th className="text-left p-3 label-text">Change</th>
                  <th className="text-left p-3 label-text">By</th>
                  <th className="text-left p-3 label-text">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history?.map((h: any) => (
                  <tr key={h.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-sm font-medium">{h.task?.title || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground">{h.action}</td>
                    <td className="p-3 text-sm">
                      <span className="text-muted-foreground">{h.old_value}</span>
                      {h.old_value && h.new_value && <span className="text-muted-foreground mx-1">→</span>}
                      <span className="font-medium">{h.new_value}</span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{h.profile?.full_name || h.profile?.email || "—"}</td>
                    <td className="p-3 text-sm text-muted-foreground font-mono tabular-nums">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!history || history.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No history records yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
