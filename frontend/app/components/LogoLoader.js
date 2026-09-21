import Image from "next/image";
import { useEffect, useState, useLayoutEffect } from "react";

export default function LogoLoader({
  className = "",
  showSpinner = true,
  message = "",
  size = 48,
  showMessageBelow = true
}) {
  const [isMounted, setIsMounted] = useState(false);

  // Use useLayoutEffect to prevent flashing on initial render
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // If not mounted yet, return null to prevent flash
  if (!isMounted) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <Image
          src="/assets/lifelink-logo.png"
          alt="LifeLink"
          width={size}
          height={size}
          priority
          className="rounded-xl object-contain"
        />
        {showSpinner && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle className="opacity-25" cx="12" cy="12" r="10" strokeOpacity="0.25" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          </div>
        )}
      </div>
      {showMessageBelow && message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}
