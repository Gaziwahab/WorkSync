import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
  const { user } = useAuth();

  const { data: documents } = useQuery({
    queryKey: ["my-documents", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("task_documents")
        .select("*, tasks(title)")
        .eq("uploaded_by", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">{documents?.length || 0} files uploaded</p>
        </div>

        <div className="space-y-2">
          {documents?.map((doc: any) => (
            <Card key={doc.id} className="card-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Task: {doc.tasks?.title || "—"} · {doc.file_type || "Unknown type"}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
          {(!documents || documents.length === 0) && (
            <div className="text-center py-12 text-sm text-muted-foreground">No documents uploaded yet</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
