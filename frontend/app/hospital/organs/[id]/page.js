"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function OrganDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const organId = params?.id;

  const [organ, setOrgan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH ORGAN
  // =========================================================

  useEffect(() => {
    const fetchOrgan = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/hospital/login");
        return;
      }

      if (!organId) {
        setError("Organ ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/organs/${organId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("lifelink_token");

          localStorage.removeItem("lifelink_user");

          router.replace("/hospital/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load organ.");
        }

        setOrgan(data.organ);
      } catch (err) {
        console.error("Fetch organ error:", err);

        setError(err.message || "Unable to load organ details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgan();
  }, [organId, router]);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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

      case "Expired":
        return "bg-gray-100 text-gray-700";

      case "Removed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("lifelink_token");

    localStorage.removeItem("lifelink_user");

    router.replace("/hospital/login");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-500">Loading organ details...</p>
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
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.push("/hospital/dashboard")}
              className="text-2xl font-bold text-blue-600"
            >
              LifeLink
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Organ Not Found
            </h2>

            <p className="text-gray-500 mt-3">
              {error || "The requested organ could not be found."}
            </p>

            <button
              onClick={() => router.push("/hospital/organs")}
              className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Back to Organs
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // MAIN UI
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
              onClick={() => router.push("/hospital/dashboard")}
              className="text-2xl font-bold text-blue-600"
            >
              LifeLink
            </button>

            <p className="text-xs text-gray-500">
              Emergency Organ Donor Network
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/hospital/dashboard")}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push("/hospital/organs")}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Organs
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
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
        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/hospital/organs")}
              className="text-sm text-blue-600 hover:text-blue-700 mb-3"
            >
              ← Back to Organ Management
            </button>

            <h2 className="text-3xl font-bold text-gray-800">Organ Details</h2>

            <p className="mt-2 text-gray-500">
              Detailed information about this organ record.
            </p>
          </div>

          <button
            onClick={() => router.push(`/hospital/organs/${organ._id}/edit`)}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Edit Organ
          </button>
        </div>

        {/* ===================================================
            STATUS
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Status</p>

              <div className="mt-2">
                <span
                  className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getStatusClass(
                    organ.status,
                  )}`}
                >
                  {organ.status}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Organ Type</p>

              <p className="text-2xl font-bold text-gray-800 mt-1">
                {organ.organType}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            ORGAN INFORMATION
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Organ Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Organ Type */}

            <div>
              <p className="text-sm text-gray-500">Organ Type</p>

              <p className="mt-1 font-semibold text-gray-800">
                {organ.organType}
              </p>
            </div>

            {/* Blood Group */}

            <div>
              <p className="text-sm text-gray-500">Blood Group</p>

              <p className="mt-1 font-semibold text-red-600">
                {organ.bloodGroup}
              </p>
            </div>

            {/* Donor Age */}

            <div>
              <p className="text-sm text-gray-500">Donor Age</p>

              <p className="mt-1 font-semibold text-gray-800">
                {organ.donorAge} years
              </p>
            </div>

            {/* Donor Gender */}

            <div>
              <p className="text-sm text-gray-500">Donor Gender</p>

              <p className="mt-1 font-semibold text-gray-800">
                {organ.donorGender}
              </p>
            </div>

            {/* Availability Date */}

            <div>
              <p className="text-sm text-gray-500">Availability Date</p>

              <p className="mt-1 font-semibold text-gray-800">
                {formatDate(organ.availabilityDate)}
              </p>
            </div>

            {/* Created Date */}

            <div>
              <p className="text-sm text-gray-500">Record Created</p>

              <p className="mt-1 font-semibold text-gray-800">
                {formatDate(organ.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            LOCATION
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Location</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}

            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Address</p>

              <p className="mt-1 font-medium text-gray-800">
                {organ.location?.address || "N/A"}
              </p>
            </div>

            {/* City */}

            <div>
              <p className="text-sm text-gray-500">City</p>

              <p className="mt-1 font-medium text-gray-800">
                {organ.location?.city || "N/A"}
              </p>
            </div>

            {/* State */}

            <div>
              <p className="text-sm text-gray-500">State</p>

              <p className="mt-1 font-medium text-gray-800">
                {organ.location?.state || "N/A"}
              </p>
            </div>

            {/* Latitude */}

            <div>
              <p className="text-sm text-gray-500">Latitude</p>

              <p className="mt-1 font-medium text-gray-800">
                {organ.location?.latitude ?? "N/A"}
              </p>
            </div>

            {/* Longitude */}

            <div>
              <p className="text-sm text-gray-500">Longitude</p>

              <p className="mt-1 font-medium text-gray-800">
                {organ.location?.longitude ?? "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            NOTES
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Notes</h3>

          <p className="text-gray-600 whitespace-pre-wrap">
            {organ.notes || "No additional notes available."}
          </p>
        </div>

        {/* ===================================================
            RECORD INFORMATION
        ==================================================== */}

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Record Information
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex flex-col md:flex-row md:justify-between gap-1">
              <span className="text-gray-500">Organ ID</span>

              <span className="font-mono text-gray-700">{organ._id}</span>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between gap-1">
              <span className="text-gray-500">Hospital ID</span>

              <span className="font-mono text-gray-700">
                {typeof organ.hospital === "object"
                  ? organ.hospital?._id
                  : organ.hospital || "N/A"}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:justify-between gap-1">
              <span className="text-gray-500">Last Updated</span>

              <span className="text-gray-700">
                {formatDate(organ.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
