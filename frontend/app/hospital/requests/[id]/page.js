"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function RequestDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const requestId = params?.id;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  // =========================================================
  // FETCH REQUEST
  // =========================================================

  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/hospital/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/organ-requests/${requestId}`, {
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
          throw new Error(data.message || "Failed to load request.");
        }

        setRequest(data.request);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load request.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, router]);

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // STATUS
  // =========================================================

  const statusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      case "Accepted":
        return "bg-green-100 text-green-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      case "Cancelled":
        return "bg-gray-100 text-gray-700";

      case "Completed":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =========================================================
  // RESPOND
  // =========================================================

  const respond = async (status) => {
    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/hospital/login");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const message =
        responseMessage.trim() ||
        (status === "Accepted"
          ? "Organ request accepted by hospital."
          : "Organ request rejected by hospital.");

      const response = await fetch(
        `${API_URL}/organ-requests/${requestId}/respond`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            responseMessage: message,
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lifelink_token");
        localStorage.removeItem("lifelink_user");
        router.replace("/hospital/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to process request.");
      }

      setRequest(data.request);

      setSuccess(
        status === "Accepted"
          ? "Request accepted successfully."
          : "Request rejected successfully.",
      );

      setResponseMessage("");
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to process request.");
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // COMPLETE
  // =========================================================

  const completeRequest = async () => {
    const confirmed = window.confirm("Mark this organ request as completed?");

    if (!confirmed) return;

    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/hospital/login");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/organ-requests/${requestId}/complete`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lifelink_token");
        localStorage.removeItem("lifelink_user");
        router.replace("/hospital/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete request.");
      }

      setRequest(data.request);

      setSuccess("Organ request completed successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to complete request.");
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("lifelink_token");
    localStorage.removeItem("lifelink_user");

    router.replace("/hospital/login");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading request...</p>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !request) {
    return (
      <main className="min-h-screen bg-gray-100">
        <nav className="bg-white border-b p-5">
          <div className="max-w-7xl mx-auto flex justify-between">
            <button
              onClick={() => router.push("/hospital/dashboard")}
              className="text-2xl font-bold text-blue-600"
            >
              LifeLink
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto p-6 mt-12">
          <div className="bg-white rounded-2xl p-8 text-center border border-red-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Request Not Found
            </h2>

            <p className="mt-3 text-gray-600">{error}</p>

            <button
              onClick={() => router.push("/hospital/requests/sent")}
              className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!request) return null;

  const organ = typeof request.organ === "object" ? request.organ : null;

  const requestingHospital =
    typeof request.requestingHospital === "object"
      ? request.requestingHospital
      : null;

  const supplyingHospital =
    typeof request.supplyingHospital === "object"
      ? request.supplyingHospital
      : null;

  const isPending = request.status === "Pending";

  const isAccepted = request.status === "Accepted";

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-100">
      {/* NAVBAR */}

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
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

          <div className="flex gap-4 items-center">
            <button
              onClick={() => router.push("/hospital/requests/sent")}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Sent
            </button>

            <button
              onClick={() => router.push("/hospital/requests/received")}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Received
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENT */}

      <section className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => router.back()} className="text-blue-600 mb-4">
          ← Back
        </button>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organ Request</h1>

            <p className="text-sm text-gray-500 mt-2 font-mono">
              {request._id}
            </p>
          </div>

          <span
            className={`self-start px-4 py-2 rounded-full text-sm font-semibold ${statusClass(
              request.status,
            )}`}
          >
            {request.status}
          </span>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}

        {/* ORGAN */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Organ Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Organ</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {organ?.organType || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Blood Group</p>
              <p className="mt-1 text-lg font-bold text-red-600">
                {organ?.bloodGroup || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Organ Status</p>
              <p className="mt-1 font-semibold text-gray-900">
                {organ?.status || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* PATIENT */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Patient Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Patient Name</p>
              <p className="mt-1 font-semibold text-gray-900">
                {request.patientName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="mt-1 font-semibold text-gray-900">
                {request.patientAge} years
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="mt-1 font-semibold text-gray-900">
                {request.patientGender}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Urgency</p>
              <p
                className={`mt-1 font-bold ${
                  request.urgency === "Critical"
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              >
                {request.urgency}
              </p>
            </div>
          </div>
        </div>

        {/* HOSPITALS */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Requesting Hospital
            </h2>

            <p className="mt-4 font-semibold text-gray-800">
              {requestingHospital?.hospitalName || "Hospital"}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {requestingHospital?.city || ""}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {requestingHospital?.email || ""}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {requestingHospital?.phone || ""}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900">
              Supplying Hospital
            </h2>

            <p className="mt-4 font-semibold text-gray-800">
              {supplyingHospital?.hospitalName || "Hospital"}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {supplyingHospital?.city || ""}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {supplyingHospital?.email || ""}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {supplyingHospital?.phone || ""}
            </p>
          </div>
        </div>

        {/* REASON */}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Medical Request Reason
          </h2>

          <p className="text-gray-700 leading-7">{request.reason}</p>
        </div>

        {/* RESPONSE */}

        {request.responseMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-blue-800">Hospital Response</h2>

            <p className="mt-2 text-blue-700">{request.responseMessage}</p>
          </div>
        )}

        {/* DATES */}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Request Timeline
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-5">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-800">
                {formatDate(request.createdAt)}
              </span>
            </div>

            {request.respondedAt && (
              <div className="flex justify-between gap-5">
                <span className="text-gray-500">Responded</span>
                <span className="text-gray-800">
                  {formatDate(request.respondedAt)}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-5">
              <span className="text-gray-500">Last Updated</span>
              <span className="text-gray-800">
                {formatDate(request.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        {isPending && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Process Request</h2>

            <textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows="4"
              placeholder="Response message..."
              className="w-full mt-5 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 resize-none"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                disabled={processing}
                onClick={() => respond("Rejected")}
                className="px-6 py-2.5 rounded-lg border border-red-300 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>

              <button
                disabled={processing}
                onClick={() => respond("Accepted")}
                className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
            </div>
          </div>
        )}

        {/* COMPLETE */}

        {isAccepted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-800">
              Request Accepted
            </h2>

            <p className="text-sm text-green-700 mt-2">
              The organ is reserved. Complete the request after the transplant
              process has been completed.
            </p>

            <button
              disabled={processing}
              onClick={completeRequest}
              className="mt-5 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? "Processing..." : "Mark as Completed"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
