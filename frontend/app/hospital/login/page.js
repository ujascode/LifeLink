"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3"><BrandLogo size={48} /><h1 className="text-3xl font-bold text-blue-600">LifeLink</h1></div>

          <p className="text-gray-500 mt-2">Emergency Organ Donor Network</p>

          <h2 className="text-xl font-semibold text-gray-800 mt-6">
            Hospital Login
          </h2>
          <a href="/forgot-password" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">Forgot password?</a>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hospital Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter hospital email"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Do not have a hospital account?
          </p>

          <button
            onClick={() => router.push("/hospital/register")}
            className="mt-2 text-sm font-semibold text-blue-600 hover:underline"
          >
            Register Hospital
          </button>
        </div>
      </div>
    </main>
  );
}
