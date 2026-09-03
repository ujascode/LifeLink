"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminDashboard() {
  const router = useRouter();

  const [admin, setAdmin] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [stats, setStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DASHBOARD
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // -----------------------------------------------------
        // AUTH CHECK
        // -----------------------------------------------------

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("lifelink_token");

          localStorage.removeItem("lifelink_user");

          router.replace("/admin/login");
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load dashboard.");
        setAdmin(JSON.parse(localStorage.getItem("lifelink_user") || "null"));
        setStats(data.stats || {});
        setHospitals(data.recentHospitals || []);
      } catch (err) {
        console.error("Admin dashboard error:", err);

        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  // =========================================================
  // COUNTS
  // =========================================================

  const totalHospitals = stats.totalHospitals || 0;
  const verifiedHospitals = stats.verifiedHospitals || 0;
  const pendingHospitals = stats.pendingHospitals || 0;
  const totalOrgans = stats.totalOrgans || 0;
  const availableOrgans = stats.availableOrgans || 0;
  const reservedOrgans = stats.reservedOrgans || 0;
  const transplantedOrgans = stats.transplantedOrgans || 0;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">LifeLink</div>

          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">
      {/* =====================================================
          MAIN
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 py-8">
        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">Dashboard Error</p>

            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* ===================================================
            WELCOME
        ==================================================== */}

        <div className="mb-8">
          <p className="text-blue-600 font-medium">Administrator Dashboard</p>

          <h1 className="mt-1 text-3xl md:text-4xl font-bold text-gray-900">
            Welcome, {admin?.name || "Administrator"}
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor hospitals and organ availability across LifeLink.
          </p>
        </div>

        {/* ===================================================
            HOSPITAL STATISTICS
        ==================================================== */}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Hospital Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total */}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500">Total Hospitals</p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalHospitals}
              </p>
            </div>

            {/* Verified */}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500">Verified Hospitals</p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {verifiedHospitals}
              </p>
            </div>

            {/* Pending */}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500">Pending Hospitals</p>

              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {pendingHospitals}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            ORGAN STATISTICS
        ==================================================== */}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Organ Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total */}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500">Total Organs</p>

              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalOrgans}
              </p>
            </div>

            {/* Available */}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500">Available</p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {availableOrgans}
              </p>
            </div>

            {/* Reserved */}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500">Reserved</p>

              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {reservedOrgans}
              </p>
            </div>

            {/* Transplanted */}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-500">Transplanted</p>

              <p className="text-3xl font-bold text-blue-600 mt-2">
                {transplantedOrgans}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            QUICK ACTIONS
        ==================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* HOSPITAL MANAGEMENT */}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Hospital Management
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Manage registered hospitals and verification status.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => router.push("/admin/hospitals")}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                View Hospitals
              </button>

              <button
                onClick={() => router.push("/admin/hospitals/pending")}
                className="px-5 py-2.5 rounded-lg border border-yellow-300 text-yellow-700 font-medium hover:bg-yellow-50"
              >
                Pending
              </button>
            </div>
          </div>

          {/* ORGAN MANAGEMENT */}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Organ Management
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Monitor organ availability across registered hospitals.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => router.push("/admin/organs")}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                View Organs
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================
            RECENT HOSPITALS
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Registered Hospitals
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Recently available hospital records.
              </p>
            </div>

            <button
              onClick={() => router.push("/admin/hospitals")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          {hospitals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hospitals found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-semibold text-gray-600">
                      Hospital
                    </th>

                    <th className="text-left py-3 text-sm font-semibold text-gray-600">
                      City
                    </th>

                    <th className="text-left py-3 text-sm font-semibold text-gray-600">
                      Email
                    </th>

                    <th className="text-left py-3 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {hospitals.slice(0, 5).map((hospital) => (
                    <tr key={hospital._id} className="border-b border-gray-100">
                      <td className="py-4 font-semibold text-gray-800">
                        {hospital.hospitalName || hospital.name || "Hospital"}
                      </td>

                      <td className="py-4 text-gray-600">
                        {hospital.city || "N/A"}
                      </td>

                      <td className="py-4 text-gray-600">
                        {hospital.email || "N/A"}
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            hospital.status === "Verified"
                              ? "bg-green-100 text-green-700"
                              : hospital.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {hospital.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="text-center text-sm text-gray-500 mt-8">
          LifeLink Administrator Panel
        </div>
      </section>
    </main>
  );
}
