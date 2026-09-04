"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Clock,
  UserRound,
  BarChart3,
  X,
} from "lucide-react";
import BrandLogo from "../../components/BrandLogo";
import { cn } from "@/lib/cn";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Profile", href: "/admin/profile", icon: UserRound },
    ],
  },
  {
    label: "Network",
    items: [
      { name: "Hospitals", href: "/admin/hospitals", icon: Building2 },
      { name: "Pending Hospitals", href: "/admin/hospitals/pending", icon: Clock },
      { name: "Verified Hospitals", href: "/admin/hospitals/verified", icon: ShieldCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Organs", href: "/admin/organs", icon: HeartPulse },
      { name: "Requests", href: "/admin/requests", icon: ClipboardList },
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("lifelink_token");
    localStorage.removeItem("lifelink_user");
    router.replace("/admin/login");
  };

  const closeMobileMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isActive = (href) => {
    if (href === "/admin/hospitals") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          !pathname.startsWith(`${href}/pending`) &&
          !pathname.startsWith(`${href}/verified`))
      );
    }

    return (
      pathname === href ||
      (href !== "/admin/dashboard" && pathname.startsWith(`${href}/`))
    );
  };

  const nav = (
    <nav aria-label="Administrator navigation" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-3 text-white sm:px-4 md:hidden">
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2.5">
          <BrandLogo size={32} className="rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">LifeLink</p>
            <p className="text-[11px] text-slate-400">Administrator</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="admin-sidebar"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(16rem,100%)] flex-col bg-slate-950 text-white transition-transform duration-200 ease-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-5">
          <BrandLogo size={36} className="rounded-lg" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">LifeLink</p>
            <p className="text-xs text-slate-400">Administrator Panel</p>
          </div>
        </div>
        {nav}
        <div className="shrink-0 border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
