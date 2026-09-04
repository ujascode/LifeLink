import { cn } from "@/lib/cn";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div className={cn("px-5 py-12 text-center", className)}>
      {Icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
