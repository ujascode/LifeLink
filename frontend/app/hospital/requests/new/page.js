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
  const [hospitalLocation, setHospitalLocation] = useState({ latitude: undefined, longitude: undefined }); // Authenticated hospital's location
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
     FETCH HOSPITAL PROFILE (for search origin)
  ====================== */
  useEffect(() => {
    const fetchHospitalProfile = async () => {
      const token = fetch(`${API_URL}/hospital/me/profile`, {
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
          throw new Error(data.message || "Failed to load hospital profile.");
        }

        const hospital = data.hospital;
        setHospitalLocation({
          latitude: hospital.latitude,
          longitude: hospital.longitude,
        });
      } catch (err) {
        console.error("Fetch hospital profile error:", err);
        // Don't set error here as it's not critical for initial load
        // We'll still try to use browser geolocation as fallback
      }
    };

    fetchHospitalProfile();
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
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  /* ======================
     FILTER ORGANS
  ====================== */
  // Recalculate filteredOrgans when organType, bloodGroup, city, or organs change
  useEffect(() => {
    if (!organs || organs.length === 0) {
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

  /* ======================
     PROCESS SEARCH RESULTS WITH DISTANCE
  ====================== */
  const hasHospitalLocation =
    Number.isFinite(hospitalLocation.latitude) &&
    Number.isFinite(hospitalLocation.longitude);

  const isCoordinate = (value) =>
    Number.isFinite(Number(value)) &&
    ((typeof value === "number" && Math.abs(value) <= 90) ||
      (typeof value === "number" && Math.abs(value) <= 180));

  const searchResults = useMemo(() => {
    if (!filteredOrgans || filteredOrgans.length === 0) return [];

    return filteredOrgans
      .map((organ) => {
        // Get coordinates - prioritize organ location, fallback to hospital location
        const organLocation = organ.location || {};
        const hospitalData = typeof organ.hospital === "object" && organ.hospital ? organ.hospital : {};

        let latitude = null;
        let longitude = null;

        // Try to get coordinates from organ location first
        if (
          isCoordinate(organLocation.latitude) &&
          isCoordinate(organLocation.longitude)
        ) {
          latitude = Number(organLocation.latitude);
          longitude = Number(organLocation.longitude);
        }
        // Fallback to hospital location
        else if (
          isCoordinate(hospitalLocation.latitude) &&
          isCoordinate(hospitalLocation.longitude)
        ) {
          latitude = Number(hospitalLocation.latitude);
          longitude = Number(hospitalLocation.longitude);
        }

        // Calculate distance if we have both locations
        let distance = null;
        if (
          hasHospitalLocation &&
          latitude !== null &&
          longitude !== null
        ) {
          distance = calculateDistance(
            hospitalLocation.latitude,
            hospitalLocation.longitude,
            latitude,
            longitude
          );
        }

        return {
          organ,
          hospital: hospitalData,
          latitude,
          longitude,
          distance,
          city:
            organLocation.city ||
            hospitalData.city ||
            "Location unavailable",
          address:
            organLocation.address ||
            hospitalData.address ||
            "Address unavailable",
        };
      })
      // Sort by distance (closest first), putting null distances at the end
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [filteredOrgans, hasHospitalLocation, hospitalLocation.latitude, hospitalLocation.longitude]);

  /* ======================
     APPLY RADIUS FILTERING
  ====================== */
  const resultsWithinRadius = useMemo(() => {
    if (!hasHospitalLocation) return searchResults;
    return searchResults.filter(
      (result) => result.distance !== null && result.distance <= radius
    );
  }, [hasHospitalLocation, radius, searchResults]);

  const resultsOutsideRadius = useMemo(() => {
    if (!hasHospitalLocation) return [];
    return searchResults.filter(
      (result) => result.distance !== null && result.distance > radius
    );
  }, [hasHospitalLocation, radius, searchResults]);

  // Determine what to display
  const displayResults = hasHospitalLocation ? resultsWithinRadius : searchResults;
  const nearestHospital = displayResults[0] || null; // Closest hospital (already sorted)

  /* ======================
     GEOLOCATION (Optional - for "Use My Location" feature)
  ====================== */
  const handleUseMyLocation = () => {
    setLocationStatus("loading");
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
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
    // Trigger recalculation of results by updating a dummy state
    // (The useMemos above will automatically re-run when their dependencies change)
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

      // Remove existing map instance if present
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

      // Add user location marker if we have location (from browser geolocation)
      const hasUserLocation =
        Number.isFinite(userLocation.latitude) &&
        Number.isFinite(userLocation.longitude);

      if (hasUserLocation) {
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

      // Add hospital markers from displayResults (what we're actually showing)
      displayResults
        .filter(
          (hospital) =>
            hospital.latitude !== null && hospital.longitude !== null
        )
        .forEach((hospital) => {
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

      // Fit bounds to show all markers and user location (if available)
      const bounds = L.latLngBounds([]);

      // Add hospital markers to bounds
      displayResults
        .filter(
          (hospital) =>
            hospital.latitude !== null && hospital.longitude !== null
        )
        .forEach((hospital) => {
          bounds.extend([
            hospital.latitude,
            hospital.longitude,
          ]);
        });

      // Add user location to bounds if available (from browser geolocation)
      if (hasUserLocation) {
        bounds.extend([
          userLocation.latitude,
          userLocation.longitude,
        ]);
      }

      // Also add hospital location (authenticated hospital) to bounds
      if (hasHospitalLocation) {
        bounds.extend([
          hospitalLocation.latitude,
          hospitalLocation.longitude,
        ]);
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // If no valid bounds, set a default view to hospital location if available
        if (hasHospitalLocation) {
          map.setView(
            [hospitalLocation.latitude, hospitalLocation.longitude],
            13
          );
        } else {
          map.setView([0, 0], 2);
        }
      }

      // Store map reference for later use
      leafletMapRef.current._leafletMap = map;
    }).catch((err) => {
      console.error("Error loading Leaflet:", err);
      setMapState("error");
    });
  }, [
    hospitalLocation.latitude,
    hospitalLocation.longitude,
    userLocation.latitude,
    userLocation.longitude,
    displayResults.length,
  ]);

  // Initialize map when location data changes
  useEffect(() => {
    initializeMap();
  }, [
    hospitalLocation.latitude,
    hospitalLocation.longitude,
    userLocation.latitude,
    userLocation.longitude,
    displayResults.length,
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
                )
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
                )
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
                      <path d="M12 12l0-4" stroke="currentColor" strokeWidth="2"></path>
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
                  )
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                {radius} km radius from your location
              </div
56B21CE7-6777-44BF-B634-771B54D045A6
14707857 tokens left