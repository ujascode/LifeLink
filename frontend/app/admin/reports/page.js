"use client";
import { useEffect, useState } from "react";
import api from "@/services/api";
const fields = [
  ["totalHospitals", "Total hospitals"],
  ["verifiedHospitals", "Verified hospitals"],
  ["pendingHospitals", "Pending hospitals"],
  ["totalOrgans", "Total organs"],
  ["availableOrgans", "Available organs"],
  ["reservedOrgans", "Reserved organs"],
  ["transplantedOrgans", "Transplanted organs"],
  ["totalRequests", "Total requests"],
  ["pendingRequests", "Pending requests"],
  ["acceptedRequests", "Accepted requests"],
  ["completedRequests", "Completed requests"],
  ["rejectedRequests", "Rejected requests"],
];
export default function AdminReportsPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((response) => setStats(response.data.stats))
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load report."),
      );
  }, []);
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Reports & Statistic</h1>
      <p className="mt-1 text-slate-500">
        Authoritative counts from the LifeLink database.
      </p>
      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {fields.map(([key, label]) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats?.[key] ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
