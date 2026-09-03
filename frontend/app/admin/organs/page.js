"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminOrgansPage() {
  const router = useRouter();

  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [typeFilter, setTypeFilter] = useState("All");

  const [bloodFilter, setBloodFilter] = useState("All");

  const [search, setSearch] = useState("");

  // =========================================================
  // LOAD ORGANS
  // =========================================================

  useEffect(() => {
    const loadOrgans = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/organs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("lifelink_token");

          localStorage.removeItem("lifelink_user");

          router.replace("/admin/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to load organs.");
        }

        setOrgans(data.organs || []);
      } catch (err) {
        console.error(err);

        setError(err.message || "Unable to load organs.");
      } finally {
        setLoading(false);
      }
    };

    loadOrgans();
  }, [router]);

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const organTypes = useMemo(() => {
    return [
      "All",
      ...new Set(organs.map((organ) => organ.organType).filter(Boolean)),
    ];
  }, [organs]);

  const bloodGroups = useMemo(() => {
    return [
      "All",
      ...new Set(organs.map((organ) => organ.bloodGroup).filter(Boolean)),
    ];
  }, [organs]);

  // =========================================================
  // FILTERED ORGANS
  // =========================================================

  const filteredOrgans = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return organs.filter((organ) => {
      const matchesStatus =
        statusFilter === "All" || organ.status === statusFilter;

      const matchesType =
        typeFilter === "All" || organ.organType === typeFilter;

      const matchesBlood =
        bloodFilter === "All" || organ.bloodGroup === bloodFilter;

      const hospitalName =
        typeof organ.hospital === "object" ? organ.hospital?.hospitalName : "";

      const matchesSearch =
        !searchValue ||
        organ.organType?.toLowerCase().includes(searchValue) ||
        organ.bloodGroup?.toLowerCase().includes(searchValue) ||
        hospitalName?.toLowerCase().includes(searchValue) ||
        organ.location?.city?.toLowerCase().includes(searchValue);

      return matchesStatus && matchesType && matchesBlood && matchesSearch;
    });
  }, [organs, statusFilter, typeFilter, bloodFilter, search]);

  // =========================================================
  // COUNTS
  // =========================================================

  const availableCount = organs.filter(
    (organ) => organ.status === "Available",
  ).length;

  const reservedCount = organs.filter(
    (organ) => organ.status === "Reserved",
  ).length;

  const transplantedCount = organs.filter(
    (organ) => organ.status === "Transplanted",
  ).length;

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const statusClass = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700";

      case "Reserved":
        return "bg-yellow-100 text-yellow-700";

      case "Transplanted":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">LifeLink</div>

          <p className="mt-2 text-gray-600">Loading organs...</p>
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
          CONTENT
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-blue-600 hover:text-blue-700 mb-5"
        >
          ← Back to Dashboard
        </button>

        {/* HEADER */}

        <div className="mb-8">
          <p className="text-blue-600 font-medium">Administration</p>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Organ Management
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor organ availability across registered hospitals.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            STATISTICS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard label="Total Organs" value={organs.length} />

          <StatCard
            label="Available"
            value={availableCount}
            valueClass="text-green-600"
          />

          <StatCard
            label="Reserved"
            value={reservedCount}
            valueClass="text-yellow-600"
          />

          <StatCard
            label="Transplanted"
            value={transplantedCount}
            valueClass="text-blue-600"
          />
        </div>

        {/* ===================================================
            FILTERS
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SEARCH */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Organ, blood group, hospital..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
              />
            </div>

            {/* STATUS */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 outline-none focus:border-blue-500"
              >
                <option value="All">All Statuses</option>

                <option value="Available">Available</option>

                <option value="Reserved">Reserved</option>

                <option value="Transplanted">Transplanted</option>
              </select>
            </div>

            {/* TYPE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organ Type
              </label>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 outline-none focus:border-blue-500"
              >
                {organTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Organ Types" : type}
                  </option>
                ))}
              </select>
            </div>

            {/* BLOOD */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
              </label>

              <select
                value={bloodFilter}
                onChange={(e) => setBloodFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 outline-none focus:border-blue-500"
              >
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group === "All" ? "All Blood Groups" : group}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {filteredOrgans.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">{organs.length}</span>{" "}
            organs
          </div>
        </div>

        {/* ===================================================
            ORGAN TABLE
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredOrgans.length === 0 ? (
            <div className="p-12 text-center">
              <h2 className="text-xl font-bold text-gray-900">
                No Organs Found
              </h2>

              <p className="mt-2 text-gray-500">Try changing your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Organ
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Blood
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Donor
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Hospital
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Location
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrgans.map((organ) => {
                    const hospital =
                      typeof organ.hospital === "object"
                        ? organ.hospital
                        : null;

                    return (
                      <tr
                        key={organ._id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        {/* ORGAN */}

                        <td className="px-6 py-5">
                          <p className="font-semibold text-gray-900">
                            {organ.organType || "N/A"}
                          </p>

                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            {organ._id}
                          </p>
                        </td>

                        {/* BLOOD */}

                        <td className="px-6 py-5">
                          <span className="font-bold text-red-600">
                            {organ.bloodGroup || "N/A"}
                          </span>
                        </td>

                        {/* DONOR */}

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-800">
                            {organ.donorAge ? `${organ.donorAge} years` : "N/A"}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {organ.donorGender || "N/A"}
                          </p>
                        </td>

                        {/* HOSPITAL */}

                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-gray-800">
                            {hospital?.hospitalName || "Hospital"}
                          </p>
                        </td>

                        {/* LOCATION */}

                        <td className="px-6 py-5">
                          <p className="text-sm text-gray-800">
                            {organ.location?.city || "N/A"}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {organ.location?.state || ""}
                          </p>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusClass(
                              organ.status,
                            )}`}
                          >
                            {organ.status || "Unknown"}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() =>
                              router.push(`/admin/organs/${organ._id}`)
                            }
                            className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

// =============================================================
// STAT CARD
// =============================================================

function StatCard({ label, value, valueClass = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>

      <p className={`text-3xl font-bold mt-2 ${valueClass}`}>{value}</p>
    </div>
  );
}
