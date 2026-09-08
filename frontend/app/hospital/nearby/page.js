"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function NearbyHospitalsPage() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [radius, setRadius] = useState(10); // Default 10 km
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("lifelink_token");
    if (!token) {
      router.replace("/hospital/login");
    }
  }, [router]);

  // Get user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        // Initialize map when we have user location
        if (window.google) {
          initializeMap();
        }
      },
      (error) => {
        setError(`Unable to get your location: ${error.message}`);
        setLoading(false);
      }
    );
  }, []);

  // Initialize Google Map
  const initializeMap = () => {
    if (!userLocation || !mapRef.current) return;

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: userLocation.latitude, lng: userLocation.longitude },
        zoom: 13,
        mapTypeId: "roadmap",
      });

      setMap(mapInstance);

      // Add marker for user's location
      new window.google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: mapInstance,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285f4",
          fillOpacity: 0.8,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      // Fetch nearby hospitals
      fetchNearbyHospitals();
    } catch (err) {
      setError(`Error initializing map: ${err.message}`);
      setLoading(false);
    }
  };

  // Fetch nearby hospitals from API
  const fetchNearbyHospitals = async () => {
    if (!userLocation) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/hospitals/nearby?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&radius=${radius}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("lifelink_token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("lifelink_token");
        localStorage.removeItem("lifelink_user");
        router.replace("/hospital/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch nearby hospitals");
      }

      setHospitals(data.hospitals || []);
      setLoading(false);

      // Update map markers
      if (window.google && map) {
        updateMapMarkers(data.hospitals || []);
      }
    } catch (err) {
      setError(err.message || "Unable to fetch nearby hospitals");
      setLoading(false);
    }
  };

  // Update map markers with hospital data
  const updateMapMarkers = (hospitalData) => {
    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);

    if (!window.google || !map) return;

    const newMarkers = hospitalData.map((hospital) => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: hospital.latitude,
          lng: hospital.longitude,
        },
        map: map,
        title: hospital.hospitalName,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/hospital.png",
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      // Add click listener to marker
      marker.addListener("click", () => {
        setSelectedHospital(hospital);
        // Open info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="min-width: 200px;">
              <h4>${hospital.hospitalName}</h4>
              <p><strong>Distance:</strong> ${hospital.distance} km</p>
              <p><strong>Address:</strong> ${hospital.address}, ${hospital.city}, ${hospital.state}</p>
              <p><strong>Phone:</strong> ${hospital.phone || "N/A"}</p>
              ${hospital.email ? `<p><strong>Email:</strong> ${hospital.email}</p>` : ""}
            </div>
          `,
        });
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Adjust map bounds to show all markers and user location
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });

      newMarkers.forEach((marker) =>
        bounds.extend(marker.getPosition())
      );
      map.fitBounds(bounds, 100); // 100px padding
    }
  };

  // Handle radius change
  const handleRadiusChange = (e) => {
    setRadius(parseInt(e.target.value));
    if (userLocation) {
      fetchNearbyHospitals();
    }
  };

  // Handle manual location search (fallback if geolocation fails)
  const handleSearch = async (e) => {
    e.preventDefault();
    const latInput = document.getElementById("manual-lat").value;
    const lngInput = document.getElementById("manual-lng").value;

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError("Please enter a valid latitude between -90 and 90");
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError("Please enter a valid longitude between -180 and 180");
      return;
    }

    setUserLocation({ latitude: lat, longitude: lng });
    if (window.google) {
      initializeMap();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hospital Navbar */}
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
              onClick={() => router.push("/hospital/requests/new")}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              New Request
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("lifelink_token");
                localStorage.removeItem("lifelink_user");
                router.replace("/hospital/login");
              }}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Find Nearby Hospitals
          </h2>
          <p className="mt-2 text-gray-600">
            Locate verified hospitals near your current location
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !userLocation && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Getting your location...</p>
          </div>
        )}

        {/* Location Input Fallback */}
        {!userLocation && !loading && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Unable to detect location automatically
            </h3>
            <p className="mb-4">
              Please enter your coordinates manually or enable location services in your browser settings.
            </p>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    id="manual-lat"
                    placeholder="e.g., 12.9716"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    id="manual-lng"
                    placeholder="e.g., 77.5946"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg"
              >
                Search Location
              </button>
            </form>
          </div>
        )}

        {/* Main Content - Map and Hospital List */}
        {userLocation && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="aspect-w-16 aspect-h-9 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div ref={mapRef} id="map-container" className="h-full w-full" />
              </div>
            </div>

            {/* Hospital List and Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Controls Panel */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Search Controls</h3>

                {/* Radius Selector */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius
                  </label>
                  <div className="flex space-x-3">
                    {[5, 10, 25, 50].map((r) => (
                      <label
                        key={r}
                        className={`flex items-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium ${
                          radius === r
                            ? "bg-blue-600 text-white"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          value={r}
                          checked={radius === r}
                          onChange={handleRadiusChange}
                          className="hidden"
                        />
                        <span>{r} km</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Hospitals within {radius} km of your location
                  </p>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={fetchNearbyHospitals}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2h-13"/>
                  </svg>
                  Refresh Search
                </button>
              </div>

              {/* Hospitals List */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Nearby Hospitals ({hospitals.length} found)
                </h3>

                {hospitals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No verified hospitals found within {radius} km of your location.</p>
                    {(userLocation.latitude !== undefined && userLocation.longitude !== undefined) && (
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
                ) : (
                  <div className="space-y-3">
                    {hospitals.map((hospital) => (
                      <div
                        key={hospital.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 p-4 ${
                          selectedHospital && selectedHospital.id === hospital.id
                            ? "border-l-4 border-blue-500 bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{hospital.hospitalName}</h4>
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {hospital.address}, {hospital.city}, {hospital.state}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-sm">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {hospital.distance} km away
                              </span>
                              {hospital.phone ? (
                                <span className="ml-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.113a11.042 11.042 0 01-5.516 5.516l-1.113-2.257a1 1 0 01-1.21-.502l-4.493 1.498a1 1 0 01-.684.948A5.956 5.956 0 003 11.72V15a2 2 0 002 2h1a2 2 0 012 2v1"/>
                                  </svg>
                                </span>
                              ) : ""}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <button
                              onClick={() => setSelectedHospital(hospital)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              View Details
                            </button>
                            {selectedHospital && selectedHospital.id === hospital.id && (
                              <button
                                onClick={() => {
                                  // Center map on this hospital
                                  if (map && window.google) {
                                    map.setCenter({
                                      lat: hospital.latitude,
                                      lng: hospital.longitude,
                                    });
                                    map.setZoom(15);
                                  }
                                }}
                                className="mt-1 text-xs text-green-600 hover:text-green-700 hover:underline"
                              >
                                Show on Map
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Hospital Details Modal/Panel */}
      {selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedHospital.hospitalName}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedHospital(null)}
                className="text-gray-400 hover:text-gray-600 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Distance from you</p>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedHospital.distance} km
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-lg font-medium">
                    {selectedHospital.phone || "Not available"}
                  </p>
                </div>
                {selectedHospital.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-lg font-medium break-all">
                      {selectedHospital.email}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Verified
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Actions you can take from this location:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <span>Request an organ from this hospital</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-5.618 4.016"/>
                    </svg>
                    <span>Offer an organ to this hospital</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4">
              <button
                onClick={() => {
                  setSelectedHospital(null);
                  // Center map on user location
                  if (map && window.google && userLocation) {
                    map.setCenter({
                      lat: userLocation.latitude,
                      lng: userLocation.longitude,
                    });
                    map.setZoom(13);
                  }
                }}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Google Maps Script Loader */}
      <Script
        strategy="lazyOnload"
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
      />
  );
}