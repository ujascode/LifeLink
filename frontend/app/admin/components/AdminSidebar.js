"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import BrandLogo from "../../components/BrandLogo";

const items = [
  ["Dashboard", "/admin/dashboard"], ["Profile", "/admin/profile"],
  ["Hospitals", "/admin/hospitals"], ["Pending Hospitals", "/admin/hospitals/pending"],
  ["Verified Hospitals", "/admin/hospitals/verified"], ["Organs", "/admin/organs"],
  ["Requests", "/admin/requests"], ["Reports", "/admin/reports"],
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const logout = () => { localStorage.removeItem("lifelink_token"); localStorage.removeItem("lifelink_user"); router.replace("/admin/login"); };
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

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-slate-950 px-4 text-white shadow md:hidden"><div className="flex items-center gap-2"><BrandLogo size={34} /><span className="font-bold">LifeLink</span></div><button type="button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open} aria-controls="admin-sidebar" className="rounded-lg px-3 py-2 text-xl hover:bg-slate-800">{open ? "×" : "☰"}</button></header>
      {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" />}
      <aside id="admin-sidebar" className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}><div className="flex items-center gap-3 border-b border-slate-800 px-5 py-6"><BrandLogo size={44} /><div><p className="text-lg font-bold">LifeLink</p><p className="text-xs text-slate-400">Administrator Panel</p></div></div><nav aria-label="Administrator navigation" className="flex-1 space-y-1 px-3 py-5">{items.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={isActive(href) ? "page" : undefined} className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive(href) ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>{label}</Link>)}</nav><div className="border-t border-slate-800 p-4"><button onClick={logout} className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-700">Logout</button></div></aside>
    </>
  );
}
