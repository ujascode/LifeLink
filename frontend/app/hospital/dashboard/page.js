"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  HeartPulse,
  Inbox,
  MapPin,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import api from "@/services/api";
import Alert from "@/app/components/ui/Alert";
import Button from "@/app/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/app/components/ui/Card";
import EmptyState from "@/app/components/ui/EmptyState";
import Skeleton from "@/app/components/ui/Skeleton";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { Table, TBody, TD, TH, THead, TR } from "@/app/components/ui/Table";

function entityId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, hint, icon: Icon, accent }) {
  return (
    <Card className="relative overflow-hidden">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-0.5 ${accent}`}
      />
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>}
      </CardBody>
    </Card>
  );
}

export default function HospitalDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hospital, setHospital] = useState(null);
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
        setHospital(response.data.hospital || null);
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
      <div>
        <div className="bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-3 w-28 bg-slate-800" />
          <Skeleton className="mt-4 h-8 w-56 bg-slate-800 sm:w-80" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full bg-slate-800" />
        </div>
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="border-b border-slate-800 bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-300">
            Hospital
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Unable to load the latest coordination snapshot.
          </p>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Alert variant="error" title="Dashboard error">
            <p>{error}</p>
            <Button
              type="button"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  const dashboardStats = stats || {};
  const hospitalId = entityId(hospital);
  const location = [hospital?.city, hospital?.state].filter(Boolean).join(", ");
  const verificationStatus = hospital?.status || (hospital?.isVerified ? "Verified" : "Pending");
  const isVerified = hospital?.isVerified || verificationStatus === "Verified";
  const totalOrgans = dashboardStats.totalOrgans || 0;
  const availableShare =
    totalOrgans > 0
      ? Math.round(((dashboardStats.availableOrgans || 0) / totalOrgans) * 100)
      : 0;

  const organBreakdown = [
    { label: "Available", value: dashboardStats.availableOrgans || 0, tone: "bg-emerald-500" },
    { label: "Reserved", value: dashboardStats.reservedOrgans || 0, tone: "bg-amber-500" },
    { label: "Transplanted", value: dashboardStats.transplantedOrgans || 0, tone: "bg-violet-500" },
    { label: "Expired", value: dashboardStats.expiredOrgans || 0, tone: "bg-slate-400" },
  ];

  return (
    <div>
      <header className="relative overflow-hidden bg-slate-950 px-4 py-7 text-white sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-0 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-300">
              Hospital dashboard
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {hospital?.hospitalName || "Hospital Dashboard"}
              </h1>
              <StatusBadge status={verificationStatus} />
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {location
                ? `Welcome back. Coordinating organ exchange from ${location}.`
                : "Welcome back. Review inventory, requests, and recent network activity."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {location}
                </span>
              )}
              {hospital?.email && (
                <span className="truncate">{hospital.email}</span>
              )}
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Eligible to exchange
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-300">
                  <ShieldAlert className="h-4 w-4" />
                  Verification required
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              href="/hospital/organs/add"
              variant="outline"
              size="sm"
              className="border-slate-700 bg-transparent text-white hover:border-slate-500 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add organ
            </Button>
            <Button href="/hospital/requests/new" size="sm">
              New request
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {!isVerified && (
          <Alert
            variant={verificationStatus === "Rejected" ? "error" : "warning"}
            title={
              verificationStatus === "Rejected"
                ? "Hospital verification was not approved"
                : "Your hospital is awaiting verification"
            }
          >
            {verificationStatus === "Rejected"
              ? "You can still review your profile, but network exchange remains limited until an administrator updates your status."
              : "Administrators review each hospital before it can fully participate in organ exchange."}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total organs"
            value={dashboardStats.totalOrgans || 0}
            hint="Registered by your hospital"
            icon={HeartPulse}
            accent="bg-blue-500"
          />
          <StatCard
            label="Available"
            value={dashboardStats.availableOrgans || 0}
            hint={`${availableShare}% of inventory`}
            icon={Activity}
            accent="bg-emerald-500"
          />
          <StatCard
            label="Sent requests"
            value={dashboardStats.sentRequests || 0}
            hint={`${dashboardStats.pendingSentRequests || 0} pending`}
            icon={Send}
            accent="bg-sky-500"
          />
          <StatCard
            label="Received requests"
            value={dashboardStats.receivedRequests || 0}
            hint={`${dashboardStats.pendingReceivedRequests || 0} awaiting response`}
            icon={Inbox}
            accent="bg-violet-500"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader
              title="Organ inventory"
              description="Status of organs registered by your hospital."
              action={
                <Link
                  href="/hospital/organs"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View organs
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <CardBody>
              {totalOrgans === 0 ? (
                <EmptyState
                  icon={HeartPulse}
                  title="No organs registered"
                  description="Register an available organ so other hospitals can request it."
                  action={
                    <Button href="/hospital/organs/add" size="sm">
                      Add organ
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-5">
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                    {organBreakdown.map((item) =>
                      item.value > 0 ? (
                        <span
                          key={item.label}
                          className={item.tone}
                          style={{ width: `${(item.value / totalOrgans) * 100}%` }}
                        />
                      ) : null,
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {organBreakdown.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3"
                      >
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`h-1.5 w-1.5 rounded-full ${item.tone}`} />
                          {item.label}
                        </p>
                        <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="Request queue"
              description="Sent and received workload."
            />
            <CardBody className="space-y-3">
              <Link
                href="/hospital/requests/sent"
                className="flex items-center justify-between rounded-xl border border-slate-200/80 px-3.5 py-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Send className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Sent requests</p>
                    <p className="text-xs text-slate-500">
                      {dashboardStats.pendingSentRequests || 0} pending outbound
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold tabular-nums text-slate-900">
                  {dashboardStats.sentRequests || 0}
                </p>
              </Link>
              <Link
                href="/hospital/requests/received"
                className="flex items-center justify-between rounded-xl border border-slate-200/80 px-3.5 py-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Inbox className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Received requests</p>
                    <p className="text-xs text-slate-500">
                      {dashboardStats.pendingReceivedRequests || 0} need a response
                    </p>
                  </div>
                </div>
                <p className="text-lg font-semibold tabular-nums text-slate-900">
                  {dashboardStats.receivedRequests || 0}
                </p>
              </Link>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3.5">
                <p className="text-sm text-slate-600">Accepted in network</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {dashboardStats.acceptedRequests || 0}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">
            Quick actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/hospital/organs/add"
              className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                <Plus className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">Add organ</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Register a new available organ
              </p>
            </Link>
            <Link
              href="/hospital/requests/new"
              className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                <Send className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">New organ request</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Request an organ from another hospital
              </p>
            </Link>
            <Link
              href="/hospital/profile"
              className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700">
                <UserRound className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900">Hospital profile</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Manage hospital information
              </p>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader
            title="Recent activity"
            description="Latest sent and received requests."
            action={
              <Link
                href="/hospital/requests"
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {recentRequests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No recent requests"
              description="Sent and received organ requests will appear here."
              action={
                <Button href="/hospital/requests/new" variant="outline" size="sm">
                  Create a request
                </Button>
              }
            />
          ) : (
            <>
              <div className="md:hidden">
                {recentRequests.slice(0, 5).map((request) => {
                  const sent = entityId(request.requestingHospital) === hospitalId;
                  const counterpart = sent
                    ? request.supplyingHospital
                    : request.requestingHospital;

                  return (
                    <Link
                      key={request._id}
                      href={`/hospital/requests/${request._id}`}
                      className="block border-t border-slate-100 px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {request.patientName || "Patient"}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {request.organ?.organType || "Organ"}
                            {request.urgency ? ` · ${request.urgency}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {sent ? "Sent" : "Received"}
                            {counterpart?.hospitalName
                              ? ` · ${counterpart.hospitalName}`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>Patient</TH>
                      <TH>Direction</TH>
                      <TH>Organ</TH>
                      <TH>Urgency</TH>
                      <TH>Status</TH>
                      <TH>When</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {recentRequests.slice(0, 5).map((request) => {
                      const sent = entityId(request.requestingHospital) === hospitalId;
                      const counterpart = sent
                        ? request.supplyingHospital
                        : request.requestingHospital;

                      return (
                        <TR key={request._id}>
                          <TD>
                            <Link
                              href={`/hospital/requests/${request._id}`}
                              className="font-medium text-slate-900 hover:text-blue-700"
                            >
                              {request.patientName || "Patient"}
                            </Link>
                            {counterpart?.hospitalName && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {counterpart.hospitalName}
                              </p>
                            )}
                          </TD>
                          <TD>{sent ? "Sent" : "Received"}</TD>
                          <TD>{request.organ?.organType || "Organ"}</TD>
                          <TD>
                            {request.urgency ? (
                              <StatusBadge status={request.urgency} />
                            ) : (
                              "—"
                            )}
                          </TD>
                          <TD>
                            <StatusBadge status={request.status} />
                          </TD>
                          <TD className="whitespace-nowrap text-slate-500">
                            {formatWhen(request.createdAt) || "—"}
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
