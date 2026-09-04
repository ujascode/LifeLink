"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../../components/BrandLogo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Admin login failed.");
      }

      if (!data.token) {
        throw new Error(
          "Login successful, but no authentication token was returned.",
        );
      }

      // Save authentication
      localStorage.setItem("lifelink_token", data.token);

      localStorage.setItem("lifelink_user", JSON.stringify(data.user));

      // Go to admin dashboard
      router.replace("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);

      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* BRAND */}

        <div className="text-center mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-4xl font-bold text-blue-600"
          >
            <span className="inline-flex items-center gap-3"><BrandLogo size={48} />LifeLink</span>
          </button>

          <p className="mt-2 text-gray-600">Administrator Panel</p>

          <p className="text-sm text-gray-500 mt-1">
            Emergency Organ Donor Network
          </p>
        </div>

        {/* LOGIN CARD */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>

          <p className="text-sm text-gray-500 mt-2">
            Sign in to manage the LifeLink platform.
          </p>

          {/* ERROR */}

          {error && (
            <div className="mt-5 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* FORM */}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* LOGIN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* BACK */}

          <button
            onClick={() => router.push("/hospital/login")}
            className="w-full mt-5 text-sm text-blue-600 hover:text-blue-700"
          >
            ← Hospital Login
          </button>
        </div>

        {/* FOOTER */}

        <p className="text-center text-xs text-gray-500 mt-6">
          LifeLink Administrator Access
        </p>
      </div>
    </main>
  );
}
