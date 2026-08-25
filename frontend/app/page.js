"use client";

import { useEffect, useState } from "react";
import api from "../services/api";

export default function Home() {
  const [message, setMessage] = useState("Connecting to LifeLink API...");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get("/health");

        setMessage(response.data.message);
      } catch (error) {
        console.error("Backend connection error:", error);
        setMessage("Backend connection failed");
      }
    };

    checkBackend();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-bold text-blue-700">LifeLink</h1>

        <p className="mt-2 text-gray-600">Emergency Organ Donor Network</p>

        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p>{message}</p>
        </div>
      </div>
    </main>
  );
}
