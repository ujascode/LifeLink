"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Send,
  UserRound,
  X,
} from "lucide-react";
import BrandLogo from "../../components/BrandLogo";
import { cn } from "@/lib/cn";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/hospital/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Inventory",
    items: [
      { name: "My Organs", href: "/hospital/organs", icon: HeartPulse },
      { name: "Add Organ", href: "/hospital/organs/add", icon: Plus },
    ],
  },
  {
    label: "Requests",
    items: [
      { name: "All Requests", href: "/hospital/requests", icon: ClipboardList },
      { name: "Sent Requests", href: "/hospital/requests/sent", icon: Send },
      { name: "Received Requests", href: "/hospital/requests/received", icon: Inbox },
    ],
  },
  {
    label: "Hospital",
    items: [{ name: "Hospital Profile", href: "/hospital/profile", icon: UserRound }],
  },
];

export default function HospitalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("lifelink_token");
    localStorage.removeItem("lifelink_user");
    router.replace("/hospital/login");
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
    if (href === "/hospital/organs") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) && pathname !== "/hospital/organs/add")
      );
    }

    if (href === "/hospital/requests") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          !pathname.startsWith(`${href}/sent`) &&
          !pathname.startsWith(`${href}/received`) &&
          !pathname.startsWith(`${href}/new`))
      );
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const nav = (
    <nav aria-label="Hospital navigation" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
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
                      ? "bg-blue-50 text-blue-700 shadow-[inset_3px_0_0_0_#2563eb]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
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
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 md:hidden">
        <Link href="/hospital/dashboard" className="flex min-w-0 items-center gap-2.5">
          <BrandLogo size={32} className="rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">LifeLink</p>
            <p className="text-[11px] text-slate-500">Hospital Portal</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="hospital-sidebar"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
        />
      )}

      <aside
        id="hospital-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(17.5rem,100%)] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
          <BrandLogo size={36} className="rounded-lg" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-slate-900">LifeLink</p>
            <p className="text-xs text-slate-500">Hospital Portal</p>
          </div>
        </div>

        {nav}

        <div className="shrink-0 border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
