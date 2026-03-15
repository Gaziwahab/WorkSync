import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, MessageSquare, Upload, FileText, Download } from "lucide-react";

export default function TasksPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const empIds = (roles || []).filter((r) => r.role === "employee").map((r) => r.user_id);
      if (empIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("*").in("id", empIds);
      return data || [];
    },
    enabled: role === "admin" || role === "manager",
  });

  const { data: workflows } = useQuery({
    queryKey: ["workflows-list"],
    queryFn: async () => {
      const { data } = await supabase.from("workflows").select("id, name").eq("is_active", true);
      return data || [];
    },
    enabled: role === "admin" || role === "manager",
  });

  // Fetch comments without PostgREST join - get profiles separately
  const { data: taskComments } = useQuery({
    queryKey: ["task-comments", detailTask?.id],
    queryFn: async () => {
      if (!detailTask) return [];
      const { data: comments } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", detailTask.id)
        .order("created_at", { ascending: true });
      if (!comments || comments.length === 0) return [];
      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return comments.map((c) => ({ ...c, profile: profileMap[c.user_id] || null }));
    },
    enabled: !!detailTask,
  });

  // Fetch history without PostgREST join
  const { data: taskHistory } = useQuery({
    queryKey: ["task-history", detailTask?.id],
    queryFn: async () => {
      if (!detailTask) return [];
      const { data: history } = await supabase
        .from("task_history")
        .select("*")
        .eq("task_id", detailTask.id)
        .order("created_at", { ascending: false });
      if (!history || history.length === 0) return [];
      const userIds = [...new Set(history.map((h) => h.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return history.map((h) => ({ ...h, profile: profileMap[h.user_id] || null }));
    },
    enabled: !!detailTask,
  });

  // Fetch documents for the task
  const { data: taskDocuments } = useQuery({
    queryKey: ["task-documents", detailTask?.id],
    queryFn: async () => {
      if (!detailTask) return [];
      const { data } = await supabase
        .from("task_documents")
        .select("*")
        .eq("task_id", detailTask.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!detailTask,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        title,
        description,
        assigned_to: assignedTo || null,
        assigned_by: user!.id,
        workflow_id: workflowId || null,
        deadline: deadline || null,
      });
      if (error) throw error;

      if (assignedTo) {
        await supabase.from("notifications").insert({
          user_id: assignedTo,
          title: "New Task Assigned",
          message: `You have been assigned: ${title}`,
          type: "task_assigned",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
      setOpen(false);
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setWorkflowId("");
      setDeadline("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus, oldStatus, task }: { taskId: string; newStatus: string; oldStatus: string; task: any }) => {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
      if (error) throw error;
      await supabase.from("task_history").insert({
        task_id: taskId,
        user_id: user!.id,
        action: "status_change",
        old_value: oldStatus,
        new_value: newStatus,
      });

      // Send notifications based on status change
      const notifications: { user_id: string; title: string; message: string; type: string; related_task_id: string }[] = [];

      if (newStatus === "submitted" && task.assigned_by) {
        // Notify manager/admin who assigned the task
        notifications.push({
          user_id: task.assigned_by,
          title: "Task Submitted for Review",
          message: `Task "${task.title}" has been submitted for review.`,
          type: "task_submitted",
          related_task_id: taskId,
        });
        // Also notify all admins
        const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
        (adminRoles || []).forEach((ar) => {
          if (ar.user_id !== task.assigned_by && ar.user_id !== user!.id) {
            notifications.push({
              user_id: ar.user_id,
              title: "Task Submitted for Review",
              message: `Task "${task.title}" has been submitted for review.`,
              type: "task_submitted",
              related_task_id: taskId,
            });
          }
        });
      } else if (newStatus === "approved" && task.assigned_to) {
        notifications.push({
          user_id: task.assigned_to,
          title: "Task Approved",
          message: `Your task "${task.title}" has been approved.`,
          type: "task_approved",
          related_task_id: taskId,
        });
      } else if (newStatus === "rejected" && task.assigned_to) {
        notifications.push({
          user_id: task.assigned_to,
          title: "Task Rejected",
          message: `Your task "${task.title}" has been rejected. Please review and resubmit.`,
          type: "task_rejected",
          related_task_id: taskId,
        });
      } else if (newStatus === "completed" && task.assigned_to) {
        notifications.push({
          user_id: task.assigned_to,
          title: "Task Completed",
          message: `Task "${task.title}" has been marked as completed.`,
          type: "task_completed",
          related_task_id: taskId,
        });
      }

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-history"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      toast.success("Status updated");
      if (detailTask) {
        setDetailTask({ ...detailTask, status: variables.newStatus });
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!detailTask || !comment.trim()) return;
      const { error } = await supabase.from("task_comments").insert({
        task_id: detailTask.id,
        user_id: user!.id,
        content: comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments"] });
      setComment("");
      toast.success("Comment added");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !detailTask) return;
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      for (const file of files) {
        const filePath = `${detailTask.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("task-documents")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("task_documents").insert({
          task_id: detailTask.id,
          uploaded_by: user!.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        });
        if (dbError) throw dbError;
      }
      queryClient.invalidateQueries({ queryKey: ["task-documents"] });
      toast.success(`${files.length} file(s) uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (doc: any) => {
    const { data } = await supabase.storage.from("task-documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Failed to generate download link");
    }
  };

  const canCreate = role === "admin" || role === "manager";
  const canApprove = role === "admin" || role === "manager";

  const getStatusActions = (task: any) => {
    const actions: { label: string; status: string }[] = [];
    if (task.status === "pending" && (task.assigned_to === user?.id || canApprove)) {
      actions.push({ label: "Start Work", status: "in_progress" });
    }
    if (task.status === "in_progress" && task.assigned_to === user?.id) {
      actions.push({ label: "Submit for Review", status: "submitted" });
    }
    if (task.status === "submitted" && canApprove) {
      actions.push({ label: "Approve", status: "approved" });
      actions.push({ label: "Reject", status: "rejected" });
    }
    if (task.status === "approved" && canApprove) {
      actions.push({ label: "Mark Complete", status: "completed" });
    }
    if (task.status === "rejected" && task.assigned_to === user?.id) {
      actions.push({ label: "Resume Work", status: "in_progress" });
    }
    return actions;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">{tasks?.length || 0} tasks total</p>
          </div>
          {canCreate && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Assign Task</Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create Task</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Workflow</Label>
                    <Select value={workflowId} onValueChange={setWorkflowId}>
                      <SelectTrigger><SelectValue placeholder="Select workflow (optional)" /></SelectTrigger>
                      <SelectContent>
                        {workflows?.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  </div>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !title.trim()} className="w-full">
                    Create Task
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Task Detail Sheet */}
        <Sheet open={!!detailTask} onOpenChange={(o) => !o && setDetailTask(null)}>
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            {detailTask && (
              <>
                <SheetHeader>
                  <SheetTitle>{detailTask.title}</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-4">
                  <div>
                    <p className="label-text mb-1">Status</p>
                    <StatusBadge status={detailTask.status} />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {getStatusActions(detailTask).map((action) => (
                        <Button
                          key={action.status}
                          size="sm"
                          variant={action.status === "rejected" ? "destructive" : "default"}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              taskId: detailTask.id,
                              newStatus: action.status,
                              oldStatus: detailTask.status,
                              task: detailTask,
                            })
                          }
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {detailTask.description && (
                    <div>
                      <p className="label-text mb-1">Description</p>
                      <p className="text-sm">{detailTask.description}</p>
                    </div>
                  )}

                  <div>
                    <p className="label-text mb-1">Details</p>
                    <div className="text-sm space-y-1">
                      <p className="font-mono tabular-nums text-muted-foreground">
                        Created: {new Date(detailTask.created_at).toLocaleString()}
                      </p>
                      {detailTask.deadline && (
                        <p className="font-mono tabular-nums text-muted-foreground">
                          Deadline: {new Date(detailTask.deadline).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="label-text">Documents</p>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {uploading ? "Uploading..." : "Upload"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {taskDocuments?.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleDownload(doc)}
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Download className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      ))}
                      {(!taskDocuments || taskDocuments.length === 0) && (
                        <p className="text-xs text-muted-foreground">No documents attached</p>
                      )}
                    </div>
                  </div>

                  {/* History */}
                  <div>
                    <p className="label-text mb-2">History</p>
                    <div className="space-y-2">
                      {taskHistory?.map((h: any) => (
                        <div key={h.id} className="text-xs border-l-2 border-primary pl-3 py-1">
                          <p className="font-medium">{h.action}: {h.old_value} → {h.new_value}</p>
                          <p className="text-muted-foreground font-mono tabular-nums">
                            {h.profile?.full_name || "Unknown"} · {new Date(h.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {(!taskHistory || taskHistory.length === 0) && (
                        <p className="text-xs text-muted-foreground">No history yet</p>
                      )}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <p className="label-text mb-2">Comments</p>
                    <div className="space-y-3 mb-3">
                      {taskComments?.map((c: any) => (
                        <div key={c.id} className="bg-accent/50 rounded-md p-3">
                          <p className="text-sm">{c.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono tabular-nums">
                            {c.profile?.full_name || c.profile?.email || "Unknown"} · {new Date(c.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        onKeyDown={(e) => e.key === "Enter" && addCommentMutation.mutate()}
                      />
                      <Button size="sm" onClick={() => addCommentMutation.mutate()} disabled={!comment.trim()}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Task List */}
        <Card className="card-shadow">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 label-text">Task</th>
                  <th className="text-left p-3 label-text">Status</th>
                  <th className="text-left p-3 label-text">Deadline</th>
                  <th className="text-left p-3 label-text">Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks?.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setDetailTask(task)}
                  >
                    <td className="p-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</p>
                      )}
                    </td>
                    <td className="p-3"><StatusBadge status={task.status} /></td>
                    <td className="p-3 text-sm text-muted-foreground font-mono tabular-nums">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground font-mono tabular-nums">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!tasks || tasks.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">No tasks found</td>
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
