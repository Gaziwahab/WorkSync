import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  in_progress: "status-in-progress",
  submitted: "status-submitted",
  approved: "status-approved",
  rejected: "status-rejected",
  completed: "status-completed",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        statusStyles[status] || "status-pending"
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
