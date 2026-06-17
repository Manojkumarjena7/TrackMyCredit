import { cn } from "@/lib/utils";
import type { ProcessingStatus } from "@/types";

interface StatusBadgeProps {
  status: ProcessingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-400 animate-pulse",
  },
  complete: {
    label: "Complete",
    className: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
