"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminOrganDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const organId = params?.id;

  const [organ, setOrgan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD ORGAN
  // =========================================================

  useEffect(() => {
    if (!organId) return;

    const loadOrgan = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/organs/${organId}`, {
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
          throw new Error(data.message || "Unable to load organ.");
        }

        setOrgan(data.organ);
      } catch (err) {
        console.error("Organ details error:", err);

        setError(err.message || "Unable to load organ.");
      } finally {
        setLoading(false);
      }
    };

    loadOrgan();
  }, [organId, router]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("lifelink_token");

    localStorage.removeItem("lifelink_user");

    router.replace("/admin/login");
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClass = (status) => {
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

          <p className="mt-2 text-gray-600">Loading organ details...</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !organ) {
    return (
      <main className="min-h-screen bg-gray-100">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-2xl font-bold text-blue-600"
            >
              LifeLink
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </nav>

        <section className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Organ Not Found
            </h1>

            <p className="mt-3 text-red-600">
              {error || "The requested organ could not be found."}
            </p>

            <button
              onClick={() => router.push("/admin/organs")}
              className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Back to Organs
            </button>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // HOSPITAL INFORMATION
  // =========================================================

  const hospital = typeof organ.hospital === "object" ? organ.hospital : null;

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-2xl font-bold text-blue-600"
            >
              LifeLink
            </button>

            <p className="text-xs text-gray-500">Administrator Panel</p>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-sm text-gray-700 hover:text-blue-600"
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push("/admin/hospitals")}
              className="text-sm text-gray-700 hover:text-blue-600"
            >
              Hospitals
            </button>

            <button
              onClick={() => router.push("/admin/organs")}
              className="text-sm text-gray-700 hover:text-blue-600"
            >
              Organs
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="max-w-5xl mx-auto px-6 py-8">
        {/* BACK */}

        <button
          onClick={() => router.push("/admin/organs")}
          className="text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Organs
        </button>

        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-sm text-blue-600 font-medium">Organ Record</p>

              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                {organ.organType || "Organ"}
              </h1>

              <p className="text-sm text-gray-500 mt-2 font-mono break-all">
                ID: {organ._id}
              </p>
            </div>

            <span
              className={`self-start px-4 py-2 rounded-full text-sm font-semibold ${getStatusClass(
                organ.status,
              )}`}
            >
              {organ.status || "Unknown"}
            </span>
          </div>
        </div>

        {/* ===================================================
            ORGAN INFORMATION
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Organ Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Info label="Organ Type" value={organ.organType} />

            <Info
              label="Blood Group"
              value={organ.bloodGroup}
              valueClass="text-red-600"
            />

            <Info
              label="Donor Age"
              value={organ.donorAge ? `${organ.donorAge} years` : null}
            />

            <Info label="Donor Gender" value={organ.donorGender} />

            <Info
              label="Availability Date"
              value={
                organ.availabilityDate
                  ? new Date(organ.availabilityDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )
                  : null
              }
            />

            <Info label="Current Status" value={organ.status} />
          </div>
        </div>

        {/* ===================================================
            HOSPITAL
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Hospital</h2>

          {hospital ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Info label="Hospital Name" value={hospital.hospitalName} />

              <Info label="Email" value={hospital.email} />

              <Info label="Phone" value={hospital.phone} />

              <Info label="City" value={hospital.city} />

              <Info label="State" value={hospital.state} />

              <Info label="Pincode" value={hospital.pincode} />
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">Hospital ID</p>

              <p className="mt-1 font-mono text-sm text-gray-900 break-all">
                {organ.hospital || "N/A"}
              </p>

              <p className="text-xs text-gray-500 mt-3">
                Hospital information was not populated by the API.
              </p>
            </div>
          )}
        </div>

        {/* ===================================================
            LOCATION
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Organ Location
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Info label="Address" value={organ.location?.address} />

            <Info label="City" value={organ.location?.city} />

            <Info label="State" value={organ.location?.state} />

            <Info label="Latitude" value={organ.location?.latitude} />

            <Info label="Longitude" value={organ.location?.longitude} />
          </div>
        </div>

        {/* ===================================================
            NOTES
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>

          <p className="text-gray-700 leading-7">
            {organ.notes || "No additional notes available."}
          </p>
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
// INFO COMPONENT
// =============================================================

function Info({ label, value, valueClass = "text-gray-900" }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>

      <p className={`mt-1 font-semibold break-words ${valueClass}`}>
        {value ?? "N/A"}
      </p>
    </div>
  );
}
