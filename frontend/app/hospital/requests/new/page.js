"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import LogoLoader from "@/components/LogoLoader";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const ORGAN_TYPES = [
  "All",
  "Heart",
  "Liver",
  "Kidney",
  "Lung",
  "Pancreas",
  "Intestine",
  "Cornea",
];

const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RADIUS_OPTIONS = [10, 25, 50, 100, 250, 500, 1000];

export default function NewOrganRequestPage() {
  const router = useRouter();

  /* ======================
     STATE
  ====================== */
  const [organs, setOrgans] = useState([]); // all available organs from API
  const [loading, setLoading] = useState(true); // loading organs initially
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter controls
  const [organType, setOrganType] = useState("All");
  const [bloodGroup, setBloodGroup] = useState("All");
  const [city, setCity] = useState("");

  // Location and search
  const [userLocation, setUserLocation] = useState({ latitude: undefined, longitude: undefined });
  const [radius, setRadius] = useState(50); // default radius in km
  const [locationLoading, setLocationLoading] = useState(false); // for geolocation loading
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | success | error

  // Search results
  const [filteredOrgans, setFilteredOrgans] = useState([]); // organs after organ/blood/city filters
  const [selectedHospital, setSelectedHospital] = useState(null); // highlighted hospital from card click
  const [selectedOrgan, setSelectedOrgan] = useState(null); // selected organ for request form
  const [submitting, setSubmitting] = useState(false); // submitting request

  // Map refs
  const leafletMapRef = useRef(null);
  const markersRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [mapState, setMapState] = useState("loading");

  /* ======================
     AUTHENTICATION
  ====================== */
  useEffect(() => {
    const token = localStorage.getItem("lifelink_token");
    if (!token) {
      router.replace("/hospital/login");
    }
  }, [router]);

  /* ======================
     FETCH AVAILABLE ORGANS
  ====================== */
  useEffect(() => {
    const fetchOrgans = async () => {
      const token = localStorage.getItem("lifelink_token");
      if (!token) return;

      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_URL}/organs`, {
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
          throw new Error(data.message || "Failed to load organs.");
        }

        const availableOrgans =
          data.organs?.filter((organ) => organ.status === "Available") || [];
        setOrgans(availableOrgans);
      } catch (err) {
        console.error("Search organs error:", err);
        setError(err.message || "Unable to load available organs.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgans();
  }, [router]);

  /* ======================
     FORM CHANGE
  ====================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  /* ======================
     FILTER ORGANS
  ====================== */
  // Recalculate filteredOrgans when organType, bloodGroup, city, or organs change
  useEffect(() => {
    if (!organs || organs.length === 0) {
      // The filtered list is intentionally synchronized with the API result.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredOrgans([]);
      return;
    }

    const filtered = organs.filter((organ) => {
      const matchesType = organType === "All" || organ.organType === organType;
      const matchesBlood =
        bloodGroup === "All" || organ.bloodGroup === bloodGroup;
      const matchesCity =
        !city.trim() ||
        organ.location?.city?.toLowerCase().includes(city.trim().toLowerCase());

      return matchesType && matchesBlood && matchesCity;
    });

    setFilteredOrgans(filtered);
  }, [organs, organType, bloodGroup, city]);

  const hasUserLocation = Number.isFinite(userLocation.latitude) && Number.isFinite(userLocation.longitude);
  const isCoordinate = (latitude, longitude) => Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180;

  const searchResults = useMemo(() => filteredOrgans.map((organ) => {
    const hospital = typeof organ.hospital === "object" && organ.hospital ? organ.hospital : {};
    const organLocation = organ.location || {};
    const latitude = isCoordinate(organLocation.latitude, organLocation.longitude)
      ? Number(organLocation.latitude) : isCoordinate(hospital.latitude, hospital.longitude) ? Number(hospital.latitude) : null;
    const longitude = isCoordinate(organLocation.latitude, organLocation.longitude)
      ? Number(organLocation.longitude) : isCoordinate(hospital.latitude, hospital.longitude) ? Number(hospital.longitude) : null;
    const distance = hasUserLocation && latitude !== null
      ? calculateDistance(userLocation.latitude, userLocation.longitude, latitude, longitude) : null;
    return {
      organ,
      hospital,
      latitude,
      longitude,
      distance,
      city: organLocation.city || hospital.city || "Location unavailable",
      address: organLocation.address || hospital.address || "Address unavailable",
    };
  }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)), [filteredOrgans, hasUserLocation, userLocation.latitude, userLocation.longitude]);

  const withinRadiusResults = useMemo(() => !hasUserLocation ? searchResults : searchResults.filter((result) => result.distance !== null && result.distance <= radius), [hasUserLocation, radius, searchResults]);
  const outsideRadiusResults = useMemo(() => hasUserLocation ? searchResults.filter((result) => result.distance !== null && result.distance > radius) : [], [hasUserLocation, radius, searchResults]);
  const displayResults = hasUserLocation ? withinRadiusResults : searchResults;
  const visibleResults = displayResults.length > 0 ? displayResults : outsideRadiusResults;
  const nearestHospital = displayResults[0] || null;

  /* ======================
     GEOLOCATION
  ====================== */
  const handleUseMyLocation = () => {
    setLocationStatus("loading");
    setLocationLoading(true);
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("success");
        setLocationStatus("success");
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError("");
        setLocationLoading(false);
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setLocationLoading(false);
      }
    );
  };

  /* ======================
     SEARCH HANDLER
  ====================== */
  const handleSearch = () => {
    setError("");
  };

  /* ======================
     MAP INITIALIZATION & ANIMATION
  ====================== */
  const initializeMap = useCallback(() => {
    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Load Leaflet CSS if not already loaded
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!leafletMapRef.current) return;

      if (leafletMapRef.current._leafletMap) {
        leafletMapRef.current._leafletMap.remove();
        leafletMapRef.current._leafletMap = null;
      }

      // Set up the map
      const map = L.map(leafletMapRef.current, {
        zoomControl: false,
      });
      setMapState("ready");

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add zoom control
      L.control.zoom({ position: "topright" }).addTo(map);

      // Clear existing markers
      if (markersRef.current) {
        markersRef.current.clearLayers();
      } else {
        markersRef.current = L.layerGroup().addTo(map);
      }
      if (userMarkerRef.current) {
        userMarkerRef.current = null;
      }

      // Add user location marker if we have location
      if (
        userLocation.latitude !== undefined &&
        userLocation.longitude !== undefined
      ) {
        const userMarker = L.circleMarker(
          [userLocation.latitude, userLocation.longitude],
          {
            radius: 8,
            fillColor: "#1976d2",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }
        ).addTo(map);
        userMarker.bindPopup("<b>Your Location</b>").openPopup();
        userMarkerRef.current = userMarker;
      }

      // Add hospital markers
      visibleResults.filter((hospital) => hospital.latitude !== null && hospital.longitude !== null).forEach((hospital) => {
        const marker = L.marker(
          [hospital.latitude, hospital.longitude]
        ).addTo(markersRef.current);

        marker.bindPopup(`
          <b>${hospital.hospital.hospitalName || "Hospital"}</b><br/>
          ${hospital.address}, ${hospital.city}<br/>
          Distance: ${hospital.distance === null ? "Unavailable" : `${hospital.distance.toFixed(1)} km`}<br/>
          Organ: ${hospital.organ.organType}<br/>
          Blood Group: ${hospital.organ.bloodGroup}
        `);

        // Handle marker click
        marker.on("click", () => {
          setSelectedHospital(hospital);
          // Find corresponding card and scroll into view
          const cardId = `hospital-card-${hospital.hospital._id || hospital.hospital.id}`;
          const cardElement = document.getElementById(cardId);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          // Open popup
          marker.openPopup();
          // Fly to marker
          map.flyTo([hospital.latitude, hospital.longitude], 15);
        });
      });

      // Fit bounds to show all markers and user location
      const bounds = L.latLngBounds([]);
      if (
        userLocation.latitude !== undefined &&
        userLocation.longitude !== undefined
      ) {
        bounds.extend([userLocation.latitude, userLocation.longitude]);
      }
      visibleResults.filter((hospital) => hospital.latitude !== null && hospital.longitude !== null).forEach((hospital) => {
        bounds.extend([
          hospital.latitude,
          hospital.longitude,
        ]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // If no valid bounds, set a default view
        map.setView([0, 0], 2);
      }

      // Store map reference for later use
      leafletMapRef.current._leafletMap = map;
    }).catch((err) => {
      console.error("Error loading Leaflet:", err);
      setMapState("error");
    });
  }, [
    userLocation.latitude,
    userLocation.longitude,
    visibleResults,
    // We don't include setSelectedHospital etc. to avoid too many re-renders
  ]);

  // Initialize map when hospitals data changes (or user location changes)
  useEffect(() => {
    initializeMap();
  }, [
    userLocation.latitude,
    userLocation.longitude,
    visibleResults.length,
    initializeMap,
  ]);

  // Clean up Leaflet map on unmount
  useEffect(() => {
    return () => {
      if (
        leafletMapRef.current &&
        leafletMapRef.current._leafletMap
      ) {
        leafletMapRef.current._leafletMap.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  /* ======================
     MAP FLY TO HELPER
  ====================== */
  const flyToHospital = useCallback((hospital) => {
    if (
      leafletMapRef.current &&
      leafletMapRef.current._leafletMap &&
      hospital.latitude !== null &&
      hospital.longitude !== null
    ) {
      const map = leafletMapRef.current._leafletMap;
      map.flyTo(
        [hospital.latitude, hospital.longitude],
        15
      );
      // Open popup for this hospital
      if (markersRef.current) {
        const markers = markersRef.current.getLayers();
        const hospitalMarker = markers.find(
          (m) =>
            m.getLatLng().lat === hospital.latitude &&
            m.getLatLng().lng === hospital.longitude
        );
        if (hospitalMarker) {
          hospitalMarker.openPopup();
        }
      }
    }
  }, []);

  /* ======================
     ORGAN SELECTION
  ====================== */
  const handleSelectOrgan = (organ) => {
    setSelectedOrgan(organ);
    setSelectedHospital(null); // clear hospital selection when organ selected
  };

  /* ======================
     SUBMIT REQUEST
  ====================== */
  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!selectedOrgan) {
      setError("Please select an available organ first.");
      return;
    }

    const token = localStorage.getItem("lifelink_token");
    if (!token) {
      router.replace("/hospital/login");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/organ-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organId: selectedOrgan._id,
          patientName: form.patientName,
          patientAge: Number(form.patientAge),
          patientGender: form.patientGender,
          urgency: form.urgency,
          reason: form.reason,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lifelink_token");
        localStorage.removeItem("lifelink_user");
        router.replace("/hospital/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to send organ request.");
      }

      setSuccess("Organ request sent successfully.");
      // Reset form
      setForm({
        patientName: "",
        patientAge: "",
        patientGender: "Male",
        urgency: "Critical",
        reason: "",
      });
      setSelectedOrgan(null);
      setSelectedHospital(null);
      router.push("/hospital/requests/sent");
    } catch (err) {
      console.error("Send request error:", err);
      setError(err.message || "Unable to send organ request.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================
     LOGOUT
  ====================== */
  const handleLogout = () => {
    localStorage.removeItem("lifelink_token");
    localStorage.removeItem("lifelink_user");
    router.replace("/hospital/login");
  };

  /* ======================
     FORM STATE
  ====================== */
  const [form, setForm] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "Male",
    urgency: "Critical",
    reason: "",
  });

  /* ======================
     UI
  ====================== */
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
              onClick={() => router.push("/hospital/organs")}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              Organs
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
        {loading && (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <LogoLoader size={60} message="Loading LifeLink..." className="mb-4" />
          </div>
        )}
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/hospital/dashboard")}
            className="text-sm text-blue-600 hover:text-blue-700 mb-3"
          >
            ← Back to Dashboard
          </button>

          <h2 className="text-3xl font-bold text-gray-900">Find an Organ</h2>

          <p className="mt-2 text-gray-600">
            Search available organs from registered hospitals and find the nearest available location.
          </p>
        </div>

        {/* ===================================================
            MESSAGES
        ==================================================== */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semtext-red-700">Error</p>
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
            SEARCH FILTERS
        ==================================================== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">
            Search Available Organs
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Organ Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organ Type
              </label>

              <select
                value={organType}
                onChange={(e) => setOrganType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500"
              >
                {ORGAN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
              </label>

              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500"
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* City / Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City / Location
              </label>

              <div className="flex flex-col">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {setCity(e.target.value); setLocationStatus("idle");}}
                  placeholder="Example: Ahmedabad"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                />
                <div className="flex items-center mt-2">
                  <button
                    onClick={handleUseMyLocation}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium px-3 py-2 rounded-lg text-sm"
                  >
                    {locationLoading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle className="opacity-25" cx="12" cy="12" r="10" strokeOpacity="0.25" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                        <path d="M12 12l0 4" stroke="currentColor" strokeWidth="2"></path>
                        <path d="M12 16l0-4" stroke="currentColor" strokeWidth="2"></path>
                      </svg>
                    )}
                    <span className="ml-2">
                      {locationStatus === "loading" ? "Locating..." : locationStatus === "success" ? "Location detected" : locationStatus === "error" ? "Unable to detect location. Enter a city or location manually." : "Use My Location"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Radius Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius
              </label>

              <div className="flex flex-col">
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r} km
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {radius} km radius from your location
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex flex-col">
              <label className="hidden">Search</label>
              <button>
                {loading ? (
                  <LogoLoader size={24} showMessageBelow={false} className="mx-auto" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWeight="2" d="M21 21l-4.35-4.35M7.5 6.5l9 9M7.5 16.5l9-9"></path>
                    </svg>
                    <span className="ml-2">Search</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            {loading
              ? "Finding available organs..."
              : `${filteredOrgans.length} available organ${
                  filteredOrgans.length !== 1 ? "s" : ""
                } found`}
          </div>
        </div>

        {/* ===================================================
            RESULTS SECTION
        ==================================================== */}
        {!loading && (
          <>
            {/*
              Map and Results Layout
              Desktop: map (60%) | results (40%)
              Mobile: map full width, then results
            */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MAP */}
              <div className="relative lg:col-span-1">
                {/* Map Container */}
                <div
                  ref={leafletMapRef}
                  className="h-125 w-full rounded-lg border border-gray-200 shadow-sm"
                  aria-label="Map of nearby hospitals"
                />
                {mapState === "loading" && (
                  <div className="absolute inset-0 grid place-items-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600">
                    Loading hospital map…
                  </div>
                )}
                {mapState === "error" && (
                  <div className="absolute inset-0 grid place-items-center rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
                    The map is unavailable. Matching hospital results remain available alongside it.
                  </div>
                )}
                {mapState === "ready" && visibleResults.filter((result) => result.latitude !== null && result.longitude !== null).length === 0 && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-lg bg-white/85 p-6 text-center text-sm text-gray-600">
                    No matching hospitals have usable coordinates for map markers. Their result cards are still available.
                  </div>
                )}
              </div>

              {/* HOSPITAL RESULTS */}
              <div className="lg:col-span-1 space-y-6">
                {/* Nearest Hospital Highlight */}
                {nearestHospital && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <div className="flex items-start">
                      <div className="shrink-0">
                        <div className="bg-blue-100 text-blue-800 rounded-full p-2">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWeight="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                          </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Nearest Match
                          </h3>
                          <p className="text-sm text-gray-500">
                            {nearestHospital.hospital.hospitalName || "Hospital"} <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✓ Verified</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {nearestHospital.distance === null ? "Distance unavailable" : `${nearestHospital.distance.toFixed(1)} km away`} • {nearestHospital.city}
                          </p>
                          <p className="text-sm text-gray-600">
                            Organ: {nearestHospital.organ.organType} • Blood Group: {nearestHospital.organ.bloodGroup}
                          </p>
                          <div className="mt-3 flex gap-3">
                            <button
                              onClick={() => {
                                setSelectedHospital(nearestHospital);
                                flyToHospital(nearestHospital);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleSelectOrgan(nearestHospital.organ)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                            >
                              Select Organ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                )}
                {/* All Hospitals List */}
                {visibleResults.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {displayResults.length === 0 ? "Matching Hospitals Outside Selected Radius" : "Matching Hospitals"} ({visibleResults.length} found)
                    </h3>
                    <div className="space-y-4">
                      {visibleResults.map((hospital) => (
                        <div
                          key={hospital.hospital._id || hospital.hospital.id}
                          id={`hospital-card-${hospital.hospital._id || hospital.hospital.id}`}
                          className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                            selectedHospital && selectedHospital.hospital._id === hospital.hospital._id
                              ? "border-blue-500 bg-blue-50"
                              : ""
                          }`}
                          onClick={() => { setSelectedHospital(hospital); flyToHospital(hospital); }} >
                          <div className="flex items-start">
                            <div className="shrink-0">
                              <div className="bg-green-100 text-green-800 rounded-full p-2">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWeight="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0-5.618 4.016" />
                                </svg>
                                </div>
                              </div>
                            <div className="ml-4">
                              <h4 className="font-semibold text-gray-900">
                                {hospital.hospital.hospitalName || "Hospital"}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {hospital.address}, {hospital.city}
                              </p>
                              <p className="text-sm text-gray-600">
                                Distance: {hospital.distance === null ? "Unavailable" : `${hospital.distance.toFixed(1)} km`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Organ: {hospital.organ.organType} • Blood Group: {hospital.organ.bloodGroup}
                              </p>
                              <button
                                type="button"
                                onClick={(event) => { event.stopPropagation(); handleSelectOrgan(hospital.organ); }}
                                className="mt-3 rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                              >
                                Select Organ
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* No Hospitals Found */}
                {filteredOrgans.length > 0 && visibleResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No matching hospitals were found within {radius} km of your location.</p>
                    {userLocation.latitude !== undefined && userLocation.longitude !== undefined && (
                      <>
                        <p className="mt-2">
                          Try increasing the search radius or check your location coordinates.
                        </p>
                        <p className="mt-1 text-xs">
                          Current location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                        </p>
                      </>
                    )}
                  </div>
                )}
                {outsideRadiusResults.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    No matching hospitals are within {radius} km. Showing {outsideRadiusResults.length} matching hospital{outsideRadiusResults.length === 1 ? "" : "s"} outside the selected radius below.
                  </div>
                )}
              </div>
            </div>

            {/* Organ Results Grid (alternative view when map not preferred) */}
            {/* We show the organ grid when we don't have user location (so no map) */}
            {!(
              userLocation.latitude !== undefined &&
              userLocation.longitude !== undefined
            ) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Available Organs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading && (
                    <div className="col-span-full bg-white rounded-2xl border p-10 text-center">
                      <p className="text-gray-500">Loading available organs...</p>
                    </div>
                  )}

                  {!loading && filteredOrgans.length === 0 && (
                    <div className="col-span-full bg-white rounded-2xl border p-10 text-center">
                      <h3 className="text-lg font-semibold text-gray-800">
                        No matching organs found
                      </h3>

                      <p className="text-sm text-gray-500 mt-2">
                        Try changing the search filters.
                      </p>
                    </div>
                  )}

                  {!loading &&
                    filteredOrgans.map((organ) => (
                      <div
                        key={organ._id}
                        className={`bg-white rounded-2xl border shadow-sm p-6 transition ${
                          selectedOrgan?._id === organ._id
                            ? "border-blue-500 ring-2 ring-blue-100"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Organ Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {organ.organType}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                              {organ.location?.city || "Location unavailable"}
                            </p>
                          </div>

                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            Available
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mt-5 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Blood Group</span>
                            <span className="font-semibold text-red-600">
                              {organ.bloodGroup}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Donor Age</span>
                            <span className="font-medium text-gray-800">
                              {organ.donorAge} years
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Gender</span>
                            <span className="font-medium text-gray-800">
                              {organ.donorGender}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Hospital</p>
                            <p className="font-medium text-gray-800 mt-1">
                              {typeof organ.hospital === "object"
                                ? organ.hospital?.hospitalName
                                : "Hospital"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="text-sm text-gray-700 mt-1">
                              {organ.location?.address || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Select */}
                        <div className="mt-6">
                          <button
                            onClick={() => handleSelectOrgan(organ)}
                            className={`w-full py-2.5 rounded-lg font-medium transition ${
                              selectedOrgan?._id === organ._id
                                ? "bg-blue-600 text-white"
                                : "border border-blue-300 text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            {selectedOrgan?._id === organ._id
                              ? "Selected"
                              : "Select Organ"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Request Form (shown when an organ is selected) */}
            {selectedOrgan && (
              <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Send Organ Request
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Selected:{" "}
                  <span className="font-semibold text-gray-700">
                    {selectedOrgan.organType} ({selectedOrgan.bloodGroup})
                  </span>
                </p>

                <form onSubmit={handleSubmitRequest} className="mt-6 space-y-6">
                  {/* Patient Details */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">
                      Patient Information
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patient Name
                        </label>

                        <input
                          type="text"
                          name="patientName"
                          value={form.patientName} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patient Age
                        </label>
                        <input
                          type="number"
                          name="patientAge"
                          value={form.patientAge}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Patient Gender
                        </label>
                        <select
                          name="patientGender"
                          value={form.patientGender}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Urgency
                        </label>
                        <select
                          name="urgency"
                          value={form.urgency}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Request
                        </label>
                        <textarea
                          name="reason"
                          value={form.reason}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                          rows="4"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </form>