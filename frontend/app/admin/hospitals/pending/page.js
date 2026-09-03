"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PendingHospitalsPage() {
  const router = useRouter();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD HOSPITALS
  // =========================================================

  useEffect(() => {
    const loadHospitals = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/hospitals`, {
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
          throw new Error(data.message || "Unable to load hospitals.");
        }

        const pending = (data.hospitals || []).filter(
          (hospital) => hospital.status === "Pending",
        );

        setHospitals(pending);
      } catch (err) {
        console.error(err);

        setError(err.message || "Unable to load pending hospitals.");
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, [router]);

  // =========================================================
  // VERIFY
  // =========================================================

  const verifyHospital = async (hospitalId) => {
    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setProcessingId(hospitalId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/hospitals/${hospitalId}/verify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "Verified",
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lifelink_token");

        localStorage.removeItem("lifelink_user");

        router.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to verify hospital.");
      }

      // Remove verified hospital from this page
      setHospitals((current) =>
        current.filter((hospital) => hospital._id !== hospitalId),
      );

      setSuccess(data.message || "Hospital verified successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to verify hospital.");
    } finally {
      setProcessingId(null);
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

          <p className="mt-2 text-gray-600">Loading pending hospitals...</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">
      {/* CONTENT */}

      <section className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Dashboard
        </button>

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <p className="text-yellow-600 font-medium">Administration</p>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Pending Hospitals
            </h1>

            <p className="mt-2 text-gray-600">
              Review hospitals waiting for administrator verification.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3">
            <p className="text-xs text-gray-500">Pending</p>

            <p className="text-2xl font-bold text-yellow-600">
              {hospitals.length}
            </p>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {hospitals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl text-green-600">✓</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-5">
              No Pending Hospitals
            </h2>

            <p className="text-gray-500 mt-2">
              All registered hospitals have been processed.
            </p>

            <button
              onClick={() => router.push("/admin/hospitals")}
              className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              View All Hospitals
            </button>
          </div>
        ) : (
          /* =================================================
             TABLE
          ================================================== */

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Hospital
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Contact
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Location
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {hospitals.map((hospital) => (
                    <tr
                      key={hospital._id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      {/* HOSPITAL */}

                      <td className="px-6 py-5">
                        <p className="font-semibold text-gray-900">
                          {hospital.hospitalName || hospital.name || "Hospital"}
                        </p>

                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          {hospital._id}
                        </p>
                      </td>

                      {/* CONTACT */}

                      <td className="px-6 py-5">
                        <p className="text-sm text-gray-800">
                          {hospital.email || "N/A"}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          {hospital.phone || "N/A"}
                        </p>
                      </td>

                      {/* LOCATION */}

                      <td className="px-6 py-5">
                        <p className="text-sm text-gray-800">
                          {hospital.city || "N/A"}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          {hospital.state || ""}
                        </p>
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                          {hospital.status || "Pending"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/hospitals/${hospital._id}`)
                            }
                            className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50"
                          >
                            Details
                          </button>

                          <button
                            disabled={processingId === hospital._id}
                            onClick={() => verifyHospital(hospital._id)}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === hospital._id
                              ? "Verifying..."
                              : "Verify"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FOOTER */}

        <div className="text-center text-sm text-gray-500 mt-8">
          LifeLink Administrator Panel
        </div>
      </section>
    </main>
  );
}
