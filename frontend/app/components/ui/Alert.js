import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";

const STYLES = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-800",
    Icon: AlertCircle,
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900",
    Icon: AlertTriangle,
  },
  info: {
    wrap: "border-blue-200 bg-blue-50 text-blue-800",
    Icon: Info,
  },
};

export default function Alert({
  variant = "info",
  title,
  children,
  className = "",
}) {
  const style = STYLES[variant] || STYLES.info;
  const Icon = style.Icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        style.wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>
        )}
      </div>
    </div>
  );
}
