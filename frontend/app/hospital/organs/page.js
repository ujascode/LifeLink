"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function HospitalOrgans() {
  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrgans = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/organs?mine=true");
        setOrgans(response.data.organs || []);
      } catch (err) {
        console.error("Organs error:", err);
        setError(err.response?.data?.message || "Unable to load organs.");
      } finally {
        setLoading(false);
      }
    };
    loadOrgans();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this organ?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/organs/${id}`);

      setOrgans((previous) => previous.filter((organ) => organ._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete organ.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading organs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Organs</h1>

            <p className="mt-1 text-slate-500">
              Manage organs registered by your hospital
            </p>
          </div>

          <Link
            href="/hospital/organs/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
          >
            + Add Organ
          </Link>
        </div>
      </div>

      <div className="p-8">
        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            Available organs:{" "}
            <span className="font-bold text-slate-900">{organs.length}</span>
          </p>
        </div>

        {/* Empty */}
        {organs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              No Available Organs
            </h2>

            <p className="mt-2 text-slate-500">
              Your hospital has no available organs.
            </p>

            <Link
              href="/hospital/organs/add"
              className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold"
            >
              Add Your First Organ
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Organ
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Blood Group
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Donor
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Availability
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                      Status
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {organs.map((organ) => (
                    <tr
                      key={organ._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {organ.organType}
                        </p>

                        <p className="text-xs text-slate-500">
                          ID: {organ._id}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {organ.bloodGroup}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        <p>{organ.donorAge} years</p>

                        <p className="text-sm text-slate-500">
                          {organ.donorGender}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {organ.availabilityDate
                          ? new Date(
                              organ.availabilityDate,
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                          {organ.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/hospital/organs/${organ._id}`}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                          >
                            View
                          </Link>

                          <Link
                            href={`/hospital/organs/${organ._id}/edit`}
                            className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => handleDelete(organ._id)}
                            className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                          >
                            Delete
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
      </div>
    </div>
  );
}
