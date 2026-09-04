"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import api from "../../../services/api";
import BrandLogo from "../../components/BrandLogo";

export default function HospitalLogin() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/hospital/login", form);

      if (response.data.success) {
        const { token, user } = response.data;

        // Save authentication data
        localStorage.setItem("lifelink_token", token);
        localStorage.setItem("lifelink_user", JSON.stringify(user));

        // Go to dashboard
        router.push("/hospital/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,99,235,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(15,23,42,0.08),_transparent_45%)]"
      />

      <div className="relative mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 px-10 py-10 text-white lg:flex xl:px-14">
          <div
            aria-hidden="true"
            className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
          />

          <Link
            href="/"
            className="relative inline-flex items-center gap-3 text-white"
          >
            <BrandLogo size={44} />
            <span className="text-xl font-semibold tracking-tight">
              LifeLink
            </span>
          </Link>

          <div className="relative max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
              Hospital portal
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
              Sign in to coordinate urgent organ exchange.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Verified hospitals use LifeLink to list availability, match
              compatibility, and move requests through a clear, traceable
              workflow.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                "Administrator-verified hospital access",
                "Compatibility-first organ records",
                "Traceable request lifecycle",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-slate-500">
            Emergency organ donor network · Secure hospital access
          </p>
        </aside>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <BrandLogo size={40} />
                <span className="text-lg font-semibold tracking-tight text-slate-900">
                  LifeLink
                </span>
              </Link>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                Hospital
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] sm:p-8">
              <div className="mb-7">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-600">
                  Hospital login
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Enter your hospital credentials to continue.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Hospital Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter hospital email"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.75}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((open) => !open)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging in..." : "Login"}
                  {!loading && (
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
              </form>

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Do not have a hospital account?
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/hospital/register")}
                  className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Register Hospital
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Authorized hospital staff only. Access is logged for audit.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
