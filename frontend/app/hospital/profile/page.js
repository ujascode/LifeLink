"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function HospitalProfile() {
  const [hospital, setHospital] = useState(null);

  const [form, setForm] = useState({
    hospitalName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/hospitals/profile/me");

        const data = response.data.hospital;

        setHospital(data);

        setForm({
          hospitalName: data.hospitalName || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
        });
      } catch (err) {
        console.error("Profile error:", err);

        setError(
          err.response?.data?.message || "Unable to load hospital profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put("/hospitals/profile", form);

      const updatedHospital = response.data.hospital;

      setHospital(updatedHospital);

      setForm({
        hospitalName: updatedHospital.hospitalName || "",
        email: updatedHospital.email || "",
        phone: updatedHospital.phone || "",
        address: updatedHospital.address || "",
        city: updatedHospital.city || "",
        state: updatedHospital.state || "",
        pincode: updatedHospital.pincode || "",
      });

      setEditing(false);

      setSuccess("Hospital profile updated successfully.");
    } catch (err) {
      console.error("Update profile error:", err);

      setError(
        err.response?.data?.message || "Unable to update hospital profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!hospital) return;

    setForm({
      hospitalName: hospital.hospitalName || "",
      email: hospital.email || "",
      phone: hospital.phone || "",
      address: hospital.address || "",
      city: hospital.city || "",
      state: hospital.state || "",
      pincode: hospital.pincode || "",
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">LifeLink</h1>

          <p className="mt-2 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !hospital) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-600">Profile Error</h1>

          <p className="mt-3 text-slate-600">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Hospital Profile
            </h1>

            <p className="mt-1 text-slate-500">
              Manage your hospital information
            </p>
          </div>

          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setError("");
                setSuccess("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-5xl">
        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Verification Status</p>

              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                {hospital?.hospitalName}
              </h2>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                hospital?.status === "Verified"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {hospital?.status || "Pending"}
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <form
          onSubmit={handleSave}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Hospital Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hospital Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hospital Name
              </label>

              <input
                type="text"
                name="hospitalName"
                value={form.hospitalName}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pincode
              </label>

              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                City
              </label>

              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                State
              </label>

              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                disabled={!editing}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Address */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Address
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              disabled={!editing}
              required
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          {editing && (
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
