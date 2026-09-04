import { cn } from "@/lib/cn";

const STYLES = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Accepted: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Completed: "bg-blue-50 text-blue-700 ring-blue-700/10",
  Pending: "bg-amber-50 text-amber-800 ring-amber-600/15",
  Reserved: "bg-amber-50 text-amber-800 ring-amber-600/15",
  Rejected: "bg-red-50 text-red-700 ring-red-600/15",
  Cancelled: "bg-slate-100 text-slate-600 ring-slate-500/10",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/10",
  Transplanted: "bg-violet-50 text-violet-700 ring-violet-600/15",
  Expired: "bg-slate-100 text-slate-600 ring-slate-500/10",
  Critical: "bg-red-50 text-red-700 ring-red-600/15",
  High: "bg-orange-50 text-orange-800 ring-orange-600/15",
  Medium: "bg-amber-50 text-amber-800 ring-amber-600/15",
  Low: "bg-slate-100 text-slate-600 ring-slate-500/10",
  Urgent: "bg-red-50 text-red-700 ring-red-600/15",
};

export default function StatusBadge({ status, className = "" }) {
  const label = status || "Unknown";
  const style = STYLES[label] || "bg-slate-100 text-slate-600 ring-slate-500/10";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
