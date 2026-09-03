"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function HospitalDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");

        const token = localStorage.getItem("lifelink_token");

        if (!token) {
          router.replace("/hospital/login");
          return;
        }

        const response = await api.get("/hospitals/dashboard");
        setUser({ name: response.data.hospital?.hospitalName });
        setStats(response.data.stats || {});
        setRecentRequests(response.data.recentRequests || []);
      } catch (err) {
        console.error("Dashboard error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("lifelink_token");
          localStorage.removeItem("lifelink_user");
          router.replace("/hospital/login");
          return;
        }
        setError(err.response?.data?.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">LifeLink</h1>

          <p className="mt-3 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow border border-red-200 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600">Dashboard Error</h1>

          <p className="mt-3 text-slate-600">{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboardStats = stats || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Hospital Dashboard
          </h1>

          <p className="mt-1 text-slate-500">
            Welcome, {user?.name || "Hospital"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total Organs</p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {dashboardStats.totalOrgans || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-green-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Available Organs</p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {dashboardStats.availableOrgans || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-yellow-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Reserved Organs</p>

            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {dashboardStats.reservedOrgans || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Transplanted Organs</p>

            <p className="text-3xl font-bold text-purple-600 mt-2">
              {dashboardStats.transplantedOrgans || 0}
            </p>
          </div>
        </div>

        {/* Requests */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Sent Requests</p>

            <p className="text-3xl font-bold text-blue-600 mt-2">
              {dashboardStats.sentRequests || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-orange-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Pending Received</p>

            <p className="text-3xl font-bold text-orange-600 mt-2">
              {dashboardStats.pendingReceivedRequests || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-green-200 p-6 shadow-sm">
            <p className="text-sm text-slate-500">Accepted Requests</p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {dashboardStats.acceptedRequests || 0}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/hospital/organs/add"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6"
            >
              <h3 className="text-lg font-bold">Add Organ</h3>

              <p className="text-blue-100 mt-1 text-sm">
                Register a new available organ
              </p>
            </Link>

            <Link
              href="/hospital/requests/new"
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-6"
            >
              <h3 className="text-lg font-bold">New Organ Request</h3>

              <p className="text-green-100 mt-1 text-sm">
                Request an organ from another hospital
              </p>
            </Link>

            <Link
              href="/hospital/profile"
              className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl p-6"
            >
              <h3 className="text-lg font-bold">Hospital Profile</h3>

              <p className="text-slate-300 mt-1 text-sm">
                Manage hospital information
              </p>
            </Link>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Recent Received Requests
            </h2>

            <Link
              href="/hospital/requests/received"
              className="text-blue-600 hover:underline text-sm font-semibold"
            >
              View All
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-slate-500">No organ requests received.</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.slice(0, 5).map((request) => (
                <Link
                  key={request._id}
                  href={`/hospital/requests/${request._id}`}
                  className="block border border-slate-200 rounded-lg p-4 hover:bg-slate-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {request.patientName}
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        {request.organ?.organType || "Organ"} •{" "}
                        {request.urgency}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-700">
                      {request.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
