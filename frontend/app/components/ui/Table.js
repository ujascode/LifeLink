import { cn } from "@/lib/cn";

export function Table({ className = "", children }) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className={cn("w-full min-w-[36rem] text-left text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }) {
  return (
    <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </thead>
  );
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function TR({ className = "", children, ...props }) {
  return (
    <tr className={cn("transition-colors hover:bg-slate-50/80", className)} {...props}>
      {children}
    </tr>
  );
}

export function TH({ className = "", children }) {
  return <th className={cn("px-5 py-3 font-medium", className)}>{children}</th>;
}

export function TD({ className = "", children }) {
  return (
    <td className={cn("px-5 py-3.5 align-middle text-slate-700", className)}>
      {children}
    </td>
  );
}
