import { cn } from "@/lib/cn";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className = "",
}) {
  return (
    <header
      className={cn(
        "relative overflow-hidden bg-slate-950 px-4 py-7 text-white sm:px-6 lg:px-8",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-blue-300">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
