"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ReceivedRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [processingId, setProcessingId] = useState(null);

  const [responseMessage, setResponseMessage] = useState("");

  // =========================================================
  // FETCH RECEIVED REQUESTS
  // =========================================================

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem("lifelink_token");

      if (!token) {
        router.replace("/hospital/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/organ-requests/received`, {
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
          throw new Error(data.message || "Failed to load received requests.");
        }

        setRequests(data.requests || []);
      } catch (err) {
        console.error("Received requests error:", err);

        setError(err.message || "Unable to load received requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router]);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
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
  // RESPOND TO REQUEST
  // =========================================================

  const respondToRequest = async (requestId, status) => {
    const token = localStorage.getItem("lifelink_token");

    if (!token) {
      router.replace("/hospital/login");
      return;
    }

    try {
      setProcessingId(requestId);
      setError("");
      setSuccess("");

      const message =
        responseMessage.trim() ||
        (status === "Accepted"
          ? "Organ request approved by hospital."
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

      setSuccess(
        status === "Accepted"
          ? "Organ request accepted successfully."
          : "Organ request rejected successfully.",
      );

      setResponseMessage("");

      setRequests((previous) =>
        previous.map((request) =>
          request._id === requestId
            ? {
                ...request,
                status,
                responseMessage: message,
              }
            : request,
        ),
      );
    } catch (err) {
      console.error("Respond request error:", err);

      setError(err.message || "Unable to process request.");
    } finally {
      setProcessingId(null);
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
              onClick={() => router.push("/hospital/requests/new")}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Find Organ
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/hospital/dashboard")}
              className="text-sm text-blue-600 hover:text-blue-700 mb-3"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Received Requests
            </h1>

            <p className="mt-2 text-gray-600">
              Manage organ requests received from other hospitals.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-900"
          >
            Refresh
          </button>
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
            LOADING
        ==================================================== */}

        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <p className="text-gray-500">Loading received requests...</p>
          </div>
        )}

        {/* ===================================================
            EMPTY
        ==================================================== */}

        {!loading && !error && requests.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              No Requests Found
            </h2>

            <p className="text-gray-500 mt-2">
              No hospitals have sent organ requests to you.
            </p>
          </div>
        )}

        {/* ===================================================
            REQUEST LIST
        ==================================================== */}

        {!loading && requests.length > 0 && (
          <div className="space-y-6">
            {requests.map((request) => {
              const isPending = request.status === "Pending";

              const isProcessing = processingId === request._id;

              return (
                <div
                  key={request._id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
                >
                  {/* TOP */}

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">
                          {request.organ?.organType || "Organ"}
                        </h2>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            request.status,
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mt-2">
                        Request ID:{" "}
                        <span className="font-mono">{request._id}</span>
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        router.push(`/hospital/requests/${request._id}`)
                      }
                      className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 text-sm font-medium hover:bg-blue-50"
                    >
                      View Details
                    </button>
                  </div>

                  {/* DETAILS */}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6 pt-5 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">Blood Group</p>

                      <p className="mt-1 font-semibold text-red-600">
                        {request.organ?.bloodGroup || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Patient</p>

                      <p className="mt-1 font-semibold text-gray-800">
                        {request.patientName || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {request.patientAge || "N/A"} years /{" "}
                        {request.patientGender || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Urgency</p>

                      <p
                        className={`mt-1 font-semibold ${
                          request.urgency === "Critical"
                            ? "text-red-600"
                            : request.urgency === "High"
                              ? "text-orange-600"
                              : "text-gray-800"
                        }`}
                      >
                        {request.urgency}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Requested On</p>

                      <p className="mt-1 font-semibold text-gray-800">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* REQUESTING HOSPITAL */}

                  <div className="mt-5 p-4 rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-500">Requesting Hospital</p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {typeof request.requestingHospital === "object"
                        ? request.requestingHospital?.hospitalName || "Hospital"
                        : "Hospital"}
                    </p>

                    {typeof request.requestingHospital === "object" &&
                      request.requestingHospital?.city && (
                        <p className="text-sm text-gray-500 mt-1">
                          {request.requestingHospital.city}
                        </p>
                      )}
                  </div>

                  {/* REASON */}

                  <div className="mt-5">
                    <p className="text-sm text-gray-500">Reason</p>

                    <p className="mt-1 text-gray-700">
                      {request.reason || "No reason provided."}
                    </p>
                  </div>

                  {/* RESPONSE */}

                  {request.responseMessage && (
                    <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-sm font-semibold text-blue-700">
                        Response
                      </p>

                      <p className="text-sm text-blue-600 mt-1">
                        {request.responseMessage}
                      </p>
                    </div>
                  )}

                  {/* =================================================
                        ACTION AREA
                    ================================================== */}

                  {isPending && (
                    <div className="mt-6 pt-5 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Message
                      </label>

                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows="3"
                        placeholder="Enter a message for the requesting hospital..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 resize-none"
                      />

                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          disabled={isProcessing}
                          onClick={() =>
                            respondToRequest(request._id, "Rejected")
                          }
                          className="px-5 py-2.5 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50"
                        >
                          {isProcessing ? "Processing..." : "Reject"}
                        </button>

                        <button
                          disabled={isProcessing}
                          onClick={() =>
                            respondToRequest(request._id, "Accepted")
                          }
                          className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {isProcessing ? "Processing..." : "Accept Request"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
