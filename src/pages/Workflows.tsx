import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, GitBranch, Trash2 } from "lucide-react";

export default function WorkflowsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([{ name: "", description: "" }]);

  const { data: workflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const { data } = await supabase
        .from("workflows")
        .select("*, workflow_steps(*)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: wf, error } = await supabase
        .from("workflows")
        .insert({ name, description, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;

      const stepsToInsert = steps
        .filter((s) => s.name.trim())
        .map((s, i) => ({
          workflow_id: wf.id,
          step_order: i + 1,
          name: s.name,
          description: s.description,
        }));

      if (stepsToInsert.length > 0) {
        const { error: stepsError } = await supabase.from("workflow_steps").insert(stepsToInsert);
        if (stepsError) throw stepsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created");
      setOpen(false);
      setName("");
      setDescription("");
      setSteps([{ name: "", description: "" }]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflows").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-sm text-muted-foreground mt-1">{workflows?.length || 0} workflows defined</p>
          </div>
          {role === "admin" && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Workflow</Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create Workflow</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>Workflow Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Code Review Pipeline" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the workflow..." />
                  </div>
                  <div className="space-y-3">
                    <Label>Steps</Label>
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex items-center justify-center w-6 h-8 text-xs font-mono text-muted-foreground">{i + 1}</div>
                        <Input
                          value={step.name}
                          onChange={(e) => {
                            const newSteps = [...steps];
                            newSteps[i].name = e.target.value;
                            setSteps(newSteps);
                          }}
                          placeholder="Step name"
                          className="flex-1"
                        />
                        {steps.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setSteps([...steps, { name: "", description: "" }])}>
                      <Plus className="h-3 w-3 mr-1" /> Add Step
                    </Button>
                  </div>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !name.trim()} className="w-full">
                    Create Workflow
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows?.map((wf) => (
            <Card key={wf.id} className="card-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{wf.name}</h3>
                  </div>
                  {role === "admin" && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(wf.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {wf.description && <p className="text-xs text-muted-foreground mb-3">{wf.description}</p>}
                <div className="space-y-1">
                  {(wf.workflow_steps as any[])
                    ?.sort((a: any, b: any) => a.step_order - b.step_order)
                    .map((step: any, i: number) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          {i < (wf.workflow_steps as any[]).length - 1 && (
                            <div className="w-px h-4 bg-border" />
                          )}
                        </div>
                        <span className="text-xs font-medium">{step.name}</span>
                      </div>
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 font-mono tabular-nums">
                  Created {new Date(wf.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
          {(!workflows || workflows.length === 0) && (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
              No workflows created yet
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
