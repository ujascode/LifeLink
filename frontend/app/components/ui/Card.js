import { cn } from "@/lib/cn";

export function Card({ className = "", children, ...props }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, className = "" }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {title && (
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
