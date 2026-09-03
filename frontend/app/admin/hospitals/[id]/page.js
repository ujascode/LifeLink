"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminHospitalDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const hospitalId = params?.id;

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD HOSPITAL
  // =========================================================

  useEffect(() => {
    if (!hospitalId) return;

    const loadHospital = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/admin/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/hospitals/${hospitalId}`, {
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
          throw new Error(data.message || "Unable to load hospital.");
        }

        setHospital(data.hospital);
      } catch (err) {
        console.error(err);

        setError(err.message || "Unable to load hospital.");
      } finally {
        setLoading(false);
      }
    };

    loadHospital();
  }, [hospitalId, router]);

  // =========================================================
  // VERIFY
  // =========================================================

  const verifyHospital = async () => {
    if (!hospital) return;

    const confirmed = window.confirm(`Verify ${hospital.hospitalName}?`);

    if (!confirmed) return;

    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/hospitals/${hospital._id}/verify`,
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

      setHospital((current) => ({
        ...current,
        status: "Verified",
        isVerified: true,
      }));

      setSuccess("Hospital verified successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to verify hospital.");
    } finally {
      setProcessing(false);
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

          <p className="mt-2 text-gray-600">Loading hospital...</p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !hospital) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Hospital Not Found
            </h1>

            <p className="mt-3 text-red-600">{error}</p>

            <button
              onClick={() => router.push("/admin/hospitals")}
              className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg"
            >
              Back to Hospitals
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!hospital) return null;

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">
      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/admin/hospitals")}
          className="text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Hospitals
        </button>

        {/* HEADER */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-sm text-blue-600 font-medium">
                Hospital Profile
              </p>

              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                {hospital.hospitalName}
              </h1>

              <p className="text-sm text-gray-500 mt-2 font-mono break-all">
                ID: {hospital._id}
              </p>
            </div>

            <span
              className={`self-start px-4 py-2 rounded-full text-sm font-semibold ${
                hospital.status === "Verified"
                  ? "bg-green-100 text-green-700"
                  : hospital.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {hospital.status || "Unknown"}
            </span>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
            {success}
          </div>
        )}

        {/* ===================================================
            BASIC INFORMATION
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Hospital Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Info label="Hospital Name" value={hospital.hospitalName} />

            <Info label="Email" value={hospital.email} />

            <Info label="Phone" value={hospital.phone} />

            <Info label="Role" value={hospital.role} />

            <Info label="Verification Status" value={hospital.status} />

            <Info label="Verified" value={hospital.isVerified ? "Yes" : "No"} />
          </div>
        </div>

        {/* ===================================================
            ADDRESS
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Location</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Info label="Address" value={hospital.address} />

            <Info label="City" value={hospital.city} />

            <Info label="State" value={hospital.state} />

            <Info label="Pincode" value={hospital.pincode} />
          </div>
        </div>

        {/* ===================================================
            VERIFICATION
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900">Verification</h2>

          <p className="text-sm text-gray-500 mt-2">
            Administrator verification controls whether this hospital can
            operate as a verified LifeLink hospital.
          </p>

          {hospital.status === "Verified" ? (
            <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="font-semibold text-green-700">
                This hospital is verified.
              </p>

              <p className="text-sm text-green-600 mt-1">
                The hospital has successfully passed administrator verification.
              </p>
            </div>
          ) : (
            <button
              onClick={verifyHospital}
              disabled={processing}
              className="mt-5 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Verifying..." : "Verify Hospital"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

// =============================================================
// INFO COMPONENT
// =============================================================

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 font-semibold text-gray-900 break-words">
        {value || "N/A"}
      </p>
    </div>
  );
}
