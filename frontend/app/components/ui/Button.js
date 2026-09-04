import Link from "next/link";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary:
    "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800",
  secondary:
    "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  subtle:
    "bg-blue-50 text-blue-700 hover:bg-blue-100",
};

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
};

export default function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
