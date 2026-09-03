"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import BrandLogo from "../../components/BrandLogo";

export default function HospitalSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/hospital/dashboard" },
    { name: "Hospital Profile", href: "/hospital/profile" },
    { name: "My Organs", href: "/hospital/organs" },
    { name: "Add Organ", href: "/hospital/organs/add" },
    { name: "All Requests", href: "/hospital/requests" },
    { name: "Sent Requests", href: "/hospital/requests/sent" },
    { name: "Received Requests", href: "/hospital/requests/received" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("lifelink_token");
    localStorage.removeItem("lifelink_user");
    router.replace("/hospital/login");
  };

  const closeMobileMenu = () => {
    setOpen(false);
  };

  const isActive = (href) => {
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

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between bg-slate-900 px-4 shadow-md md:hidden">
        <div className="flex items-center gap-3">
          <BrandLogo size={36} />
          <div>
            <h1 className="text-xl font-bold text-white">LifeLink</h1>
            <p className="text-xs text-slate-400">Hospital Portal</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-white hover:bg-slate-800"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="hospital-sidebar"
        >
          {open ? (
            <span className="text-2xl">×</span>
          ) : (
            <span className="text-2xl">☰</span>
          )}
        </button>
      </header>

      {/* Mobile Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="hospital-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform duration-200
          md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-6">
          <BrandLogo size={44} />
          <div>
            <h1 className="text-2xl font-bold text-white">LifeLink</h1>
            <p className="mt-1 text-sm text-slate-400">Hospital Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Hospital navigation" className="px-3 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 w-full border-t border-slate-700 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
