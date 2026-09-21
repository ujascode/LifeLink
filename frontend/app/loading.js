"use client";
import LogoLoader from "@/components/LogoLoader";
import { useEffect, useState } from "react";

// This component will be shown during route transitions
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <LogoLoader 
          size={60} 
          message="Loading LifeLink..." 
          className="mb-4"
        />
      </div>
    </div>
  );
}
