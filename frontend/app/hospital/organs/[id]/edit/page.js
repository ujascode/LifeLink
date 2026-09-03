"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const ORGAN_TYPES = [
  "Heart",
  "Liver",
  "Kidney",
  "Lung",
  "Pancreas",
  "Intestine",
  "Cornea",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const GENDERS = ["Male", "Female", "Other"];

const STATUSES = [
  "Available",
  "Reserved",
  "Transplanted",
  "Expired",
  "Removed",
];

export default function EditOrganPage() {
  const router = useRouter();
  const params = useParams();

  const organId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    organType: "",
    bloodGroup: "",
    donorAge: "",
    donorGender: "",
    availabilityDate: "",
    status: "",
    address: "",
    city: "",
    state: "",
    latitude: "",
    longitude: "",
    notes: "",
  });

  // =========================================================
  // AUTH CHECK
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/hospital/login");
    }
  }, [router]);

  // =========================================================
  // FETCH ORGAN
  // =========================================================

  useEffect(() => {
    if (!organId) {
      return;
    }

    const fetchOrgan = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/hospital/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

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

        const organ = data.organ;

        setForm({
          organType: organ.organType || "",
          bloodGroup: organ.bloodGroup || "",
          donorAge: organ.donorAge ?? "",
          donorGender: organ.donorGender || "",
          availabilityDate: organ.availabilityDate
            ? new Date(organ.availabilityDate).toISOString().split("T")[0]
            : "",
          status: organ.status || "Available",
          address: organ.location?.address || "",
          city: organ.location?.city || "",
          state: organ.location?.state || "",
          latitude: organ.location?.latitude ?? "",
          longitude: organ.location?.longitude ?? "",
          notes: organ.notes || "",
        });
      } catch (err) {
        console.error("Fetch organ error:", err);

        setError(err.message || "Unable to load organ.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgan();
  }, [organId, router]);

  // =========================================================
  // HANDLE CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // UPDATE ORGAN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/hospital/login");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const body = {
        organType: form.organType,
        bloodGroup: form.bloodGroup,
        donorAge: Number(form.donorAge),
        donorGender: form.donorGender,
        availabilityDate: form.availabilityDate,

        status: form.status,

        location: {
          address: form.address,
          city: form.city,
          state: form.state,
          latitude: form.latitude === "" ? undefined : Number(form.latitude),
          longitude: form.longitude === "" ? undefined : Number(form.longitude),
        },

        notes: form.notes,
      };

      const response = await fetch(`${API_URL}/organs/${organId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lifelink_token");

        localStorage.removeItem("lifelink_user");

        router.replace("/hospital/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to update organ.");
      }

      setSuccess("Organ updated successfully.");

      router.push(`/hospital/organs/${organId}`);
    } catch (err) {
      console.error("Update organ error:", err);

      setError(err.message || "Unable to update organ.");
    } finally {
      setSaving(false);
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
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-500">Loading organ information...</p>
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
        {/* HEADER */}

        <div className="mb-8">
          <button
            onClick={() => router.push(`/hospital/organs/${organId}`)}
            className="text-sm text-blue-600 hover:text-blue-700 mb-3"
          >
            ← Back to Organ Details
          </button>

          <h2 className="text-3xl font-bold text-gray-800">Edit Organ</h2>

          <p className="mt-2 text-gray-500">
            Update the organ record information.
          </p>
        </div>

        {/* ===================================================
            MESSAGES
        ==================================================== */}

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50">
            <p className="font-medium text-red-700">Error</p>

            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50">
            <p className="font-medium text-green-700">Success</p>

            <p className="text-sm text-green-600 mt-1">{success}</p>
          </div>
        )}

        {/* ===================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-8"
        >
          {/* ORGAN INFORMATION */}

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-5">
              Organ Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Organ Type */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organ Type
                </label>

                <select
                  name="organType"
                  value={form.organType}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-blue-500"
                >
                  {ORGAN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blood Group */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>

                <select
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-blue-500"
                >
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Donor Age */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donor Age
                </label>

                <input
                  type="number"
                  name="donorAge"
                  value={form.donorAge}
                  onChange={handleChange}
                  min="0"
                  max="120"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Gender */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donor Gender
                </label>

                <select
                  name="donorGender"
                  value={form.donorGender}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-blue-500"
                >
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AVAILABILITY */}

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-5">
              Availability
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Date
                </label>

                <input
                  type="date"
                  name="availabilityDate"
                  value={form.availabilityDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Status */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white outline-none focus:border-blue-500"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* LOCATION */}

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-5">
              Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Address */}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>

                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* City */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* State */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Latitude */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>

                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="23.0225"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              {/* Longitude */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>

                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="72.5714"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* NOTES */}

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-5">Notes</h3>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="5"
              maxLength="1000"
              placeholder="Additional information"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/hospital/organs/${organId}`)}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
