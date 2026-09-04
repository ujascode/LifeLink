import { cn } from "@/lib/cn";

export function Label({ className = "", children, ...props }) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)}
      {...props}
    >
      {children}
    </label>
  );
}

const controlClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-500";

export function Input({ className = "", ...props }) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={cn(controlClass, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(controlClass, "min-h-24 resize-y", className)}
      {...props}
    />
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-red-600">{children}</p>;
}
