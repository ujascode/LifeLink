"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import HospitalSidebar from "./components/HospitalSidebar";

export default function HospitalLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPage = pathname === "/hospital/login" || pathname === "/hospital/register";

  useEffect(() => {
    if (isPublicPage) return;
    const token = localStorage.getItem("lifelink_token");
    const userData = localStorage.getItem("lifelink_user");

    if (!token || !userData) {
      router.replace("/hospital/login");
      return;
    }

    try {
      const user = JSON.parse(userData);

      if (user.role !== "hospital") {
        localStorage.removeItem("lifelink_token");
        localStorage.removeItem("lifelink_user");
        router.replace("/hospital/login");
      }
    } catch {
      localStorage.removeItem("lifelink_token");
      localStorage.removeItem("lifelink_user");
      router.replace("/hospital/login");
    }
  }, [isPublicPage, router]);

  if (isPublicPage) return children;

  return (
    <div className="min-h-screen min-w-0 bg-slate-50">
      <HospitalSidebar />
      <main className="min-h-screen min-w-0 overflow-x-hidden pt-14 md:ml-[17.5rem] md:pt-0">
        {children}
      </main>
    </div>
  );
}
