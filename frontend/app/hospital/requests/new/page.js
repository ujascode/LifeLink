"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const ORGAN_TYPES = [
  "All",
  "Heart",
  "Liver",
  "Kidney",
  "Lung",
  "Pancreas",
  "Intestine",
  "Cornea",
];

const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function NewOrganRequestPage() {
  const router = useRouter();

  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [organType, setOrganType] = useState("All");
  const [bloodGroup, setBloodGroup] = useState("All");
  const [city, setCity] = useState("");

  const [selectedOrgan, setSelectedOrgan] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "Male",
    urgency: "Critical",
    reason: "",
  });

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/hospital/login");
    }
  }, [router]);

  // =========================================================
  // FETCH AVAILABLE ORGANS
  // =========================================================

  useEffect(() => {
    const fetchOrgans = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/organs`, {
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
          throw new Error(data.message || "Failed to load organs.");
        }

        const availableOrgans =
          data.organs?.filter((organ) => organ.status === "Available") || [];

        setOrgans(availableOrgans);
      } catch (err) {
        console.error("Search organs error:", err);

        setError(err.message || "Unable to load available organs.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgans();
  }, [router]);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // FILTER
  // =========================================================

  const filteredOrgans = organs.filter((organ) => {
    const matchesType = organType === "All" || organ.organType === organType;

    const matchesBlood =
      bloodGroup === "All" || organ.bloodGroup === bloodGroup;

    const matchesCity =
      !city.trim() ||
      organ.location?.city?.toLowerCase().includes(city.trim().toLowerCase());

    return matchesType && matchesBlood && matchesCity;
  });

  // =========================================================
  // SEND REQUEST
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrgan) {
      setError("Please select an available organ first.");
      return;
    }

    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/hospital/login");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/organ-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organId: selectedOrgan._id,
          patientName: form.patientName,
          patientAge: Number(form.patientAge),
          patientGender: form.patientGender,
          urgency: form.urgency,
          reason: form.reason,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lifelink_token");

        localStorage.removeItem("lifelink_user");

        router.replace("/hospital/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to send organ request.");
      }

      setSuccess("Organ request sent successfully.");

      setForm({
        patientName: "",
        patientAge: "",
        patientGender: "Male",
        urgency: "Critical",
        reason: "",
      });

      setSelectedOrgan(null);

      router.push("/hospital/requests/sent");
    } catch (err) {
      console.error("Send request error:", err);

      setError(err.message || "Unable to send organ request.");
    } finally {
      setSubmitting(false);
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

      <section className="max-w-7xl mx-auto px-6 py-8">
        {/* HEADER */}

        <div className="mb-8">
          <button
            onClick={() => router.push("/hospital/dashboard")}
            className="text-sm text-blue-600 hover:text-blue-700 mb-3"
          >
            ← Back to Dashboard
          </button>

          <h2 className="text-3xl font-bold text-gray-900">Find an Organ</h2>

          <p className="mt-2 text-gray-600">
            Search available organs from registered hospitals.
          </p>
        </div>

        {/* ===================================================
            MESSAGES
        ==================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">Error</p>

            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-700">Success</p>

            <p className="text-sm text-green-600 mt-1">{success}</p>
          </div>
        )}

        {/* ===================================================
            SEARCH FILTERS
        ==================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">
            Search Available Organs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Organ Type */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organ Type
              </label>

              <select
                value={organType}
                onChange={(e) => setOrganType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500"
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
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>

              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Example: Ahmedabad"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            {loading
              ? "Loading available organs..."
              : `${filteredOrgans.length} available organ${
                  filteredOrgans.length !== 1 ? "s" : ""
                } found`}
          </div>
        </div>

        {/* ===================================================
            ORGAN RESULTS
        ==================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full bg-white rounded-2xl border p-10 text-center">
              <p className="text-gray-500">Loading available organs...</p>
            </div>
          )}

          {!loading && filteredOrgans.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No matching organs found
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Try changing the search filters.
              </p>
            </div>
          )}

          {!loading &&
            filteredOrgans.map((organ) => (
              <div
                key={organ._id}
                className={`bg-white rounded-2xl border shadow-sm p-6 transition ${
                  selectedOrgan?._id === organ._id
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-200"
                }`}
              >
                {/* Organ Header */}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {organ.organType}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {organ.location?.city || "Location unavailable"}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    Available
                  </span>
                </div>

                {/* Details */}

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Blood Group</span>

                    <span className="font-semibold text-red-600">
                      {organ.bloodGroup}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Donor Age</span>

                    <span className="font-medium text-gray-800">
                      {organ.donorAge} years
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Gender</span>

                    <span className="font-medium text-gray-800">
                      {organ.donorGender}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Hospital</p>

                    <p className="font-medium text-gray-800 mt-1">
                      {typeof organ.hospital === "object"
                        ? organ.hospital?.hospitalName
                        : "Hospital"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Address</p>

                    <p className="text-sm text-gray-700 mt-1">
                      {organ.location?.address || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Select */}

                <button
                  onClick={() => setSelectedOrgan(organ)}
                  className={`w-full mt-6 py-2.5 rounded-lg font-medium transition ${
                    selectedOrgan?._id === organ._id
                      ? "bg-blue-600 text-white"
                      : "border border-blue-300 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {selectedOrgan?._id === organ._id
                    ? "Selected"
                    : "Select Organ"}
                </button>
              </div>
            ))}
        </div>

        {/* ===================================================
            REQUEST FORM
        ==================================================== */}

        {selectedOrgan && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Send Organ Request
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Selected:{" "}
              <span className="font-semibold text-gray-700">
                {selectedOrgan.organType} ({selectedOrgan.bloodGroup})
              </span>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* Patient Details */}

              <div>
                <h4 className="font-semibold text-gray-700 mb-4">
                  Patient Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Name */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name
                    </label>

                    <input
                      type="text"
                      name="patientName"
                      value={form.patientName}
                      onChange={handleChange}
                      required
                      placeholder="Patient name"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Age */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Age
                    </label>

                    <input
                      type="number"
                      name="patientAge"
                      value={form.patientAge}
                      onChange={handleChange}
                      min="0"
                      max="120"
                      required
                      placeholder="Age"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Gender */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Gender
                    </label>

                    <select
                      name="patientGender"
                      value={form.patientGender}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500"
                    >
                      <option value="Male">Male</option>

                      <option value="Female">Female</option>

                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Request Details */}

              <div>
                <h4 className="font-semibold text-gray-700 mb-4">
                  Request Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Urgency */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency
                    </label>

                    <select
                      name="urgency"
                      value={form.urgency}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500"
                    >
                      <option value="Low">Low</option>

                      <option value="Medium">Medium</option>

                      <option value="High">High</option>

                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Reason */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>

                    <input
                      type="text"
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      required
                      maxLength="1000"
                      placeholder="Reason for organ request"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedOrgan(null)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
