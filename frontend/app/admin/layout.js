"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname === "/admin/login";
  useEffect(() => {
    if (isPublic) return;
    try {
      const token = localStorage.getItem("lifelink_token");
      const user = JSON.parse(localStorage.getItem("lifelink_user") || "null");
      if (!token || user?.role !== "admin") { localStorage.removeItem("lifelink_token"); localStorage.removeItem("lifelink_user"); router.replace("/admin/login"); }
    } catch { router.replace("/admin/login"); }
  }, [isPublic, router]);
  if (isPublic) return children;
  return <div className="min-h-screen bg-slate-50"><AdminSidebar /><main className="min-h-screen pt-16 md:ml-64 md:pt-0">{children}</main></div>;
}
