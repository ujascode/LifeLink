"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const NearbyHospitalsPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [radius, setRadius] = useState(10);
  const [userLocation, setUserLocation] = useState({ latitude: undefined, longitude: undefined });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef(null);

  // Get user location using Geolocation API
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setLoading(false);
        // Set a default location (New York City coordinates) for demo purposes
        setUserLocation({ latitude: 40.7128, longitude: -74.0060 });
      }
    );
  }, []);

  // Fetch nearby hospitals from API
  const fetchNearbyHospitals = useCallback(async () => {
    if (userLocation.latitude === undefined || userLocation.longitude === undefined) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/hospitals/nearby?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch hospitals: ${response.statusText}`);
      }

      const data = await response.json();
      setHospitals(data.hospitals || []);
    } catch (err) {
      setError(err.message);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation.latitude, userLocation.longitude, radius]);

  // Initialize Leaflet map
  const initializeMap = useCallback(() => {
    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Load Leaflet CSS if not already loaded
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!leafletMapRef.current) return;

      // Set up the map
      const map = L.map(leafletMapRef.current, {
        zoomControl: false
      }).setView([userLocation.latitude, userLocation.longitude], 13);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Store map reference
      leafletMapRef.current._leafletMap = map;
      markersRef.current = L.layerGroup().addTo(map);

      // Add user location marker
      const userMarker = L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 8,
        fillColor: '#1976d2',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);
      userMarker.bindPopup('<b>Your Location</b>').openPopup();

      // Add hospital markers
      hospitals.forEach(hospital => {
        const marker = L.marker([hospital.latitude, hospital.longitude]).addTo(markersRef.current);

        marker.bindPopup(`
          <b>${hospital.hospitalName}</b><br/>
          ${hospital.address}, ${hospital.city}<br/>
          Distance: ${hospital.distance} km<br/>
          ${hospital.phone ? `<p><strong>Phone:</strong> ${hospital.phone}</p>` : ''}
          ${hospital.email ? `<p><strong>Email:</strong> ${hospital.email}</p>` : ''}
        `);

        // Handle marker click
        marker.on('click', () => {
          setSelectedHospital(hospital);
          map.setView([hospital.latitude, hospital.longitude], 15);
          marker.openPopup();
        });
      });

      // Fit bounds to show all markers and user location
      if (hospitals.length > 0) {
        const bounds = L.latLngBounds([
          [userLocation.latitude, userLocation.longitude]
        ]);
        hospitals.forEach(hospital => {
          bounds.extend([hospital.latitude, hospital.longitude]);
        });
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }).catch(err => {
      console.error('Error loading Leaflet:', err);
      setError('Failed to load map library');
    });
  }, [userLocation.latitude, userLocation.longitude, hospitals]);

  // Get user location on initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getUserLocation();
  }, [getUserLocation]);

  // Fetch hospitals when location or radius changes
  useEffect(() => {
    if (userLocation.latitude !== undefined && userLocation.longitude !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNearbyHospitals();
    }
  }, [userLocation.latitude, userLocation.longitude, radius, fetchNearbyHospitals]);

  // Initialize map when hospitals data changes
  useEffect(() => {
    if (userLocation.latitude !== undefined && userLocation.longitude !== undefined) {
      initializeMap();
    }
  }, [userLocation.latitude, userLocation.longitude, hospitals, initializeMap]);

  // Clean up Leaflet map on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current && leafletMapRef.current._leafletMap) {
        leafletMapRef.current._leafletMap.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Handle manual location input
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    const latInput = e.target.elements.latitude.value;
    const lngInput = e.target.elements.longitude.value;

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setUserLocation({ latitude: lat, longitude: lng });
      setError(null);
    } else {
      setError('Please enter valid latitude (-90 to 90) and longitude (-180 to 180)');
    }
  };

  if (loading && hospitals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2h-13M9 14l1.293-1.293M12 14l1.293-1.293M15 14l1.293-1.293M10 17l1.293-1.293M13 17l1.293-1.293M16 17l1.293-1.293"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Finding your location...</h2>
          <p className="text-gray-500">Please allow location access to find nearby hospitals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Image src="/logo.png" alt="lifeLink" width={40} height={40} className="h-8 w-auto" />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href="/" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                  <a href="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Login</a>
                  <a href="/register" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Register</a>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <a href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Login
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Nearby Hospitals</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Location Controls */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Your Location</h3>
              {userLocation.latitude !== undefined && userLocation.longitude !== undefined ? (
                <p className="text-sm text-gray-600">
                  Latitude: {userLocation.latitude.toFixed(4)}, Longitude: {userLocation.longitude.toFixed(4)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Fetching your location...</p>
              )}
            </div>

            {/* Manual Location Input */}
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    step="0.0001"
                    placeholder="Enter latitude"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    step="0.0001"
                    placeholder="Enter longitude"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                Use This Location
              </button>
            </form>
          </div>
        </div>

        {/* Map and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row">
            {/* Map */}
            <div className="flex-1 min-h-0">
              <div
                ref={leafletMapRef}
                className="h-[600px] w-full"
              />
            </div>

            {/* Controls and Hospital List */}
            <div className="w-full md:w-64 pl-4 pt-4 md:pt-0 space-y-4">
              {/* Radius Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Search Radius</span>
                  <span className="text-sm text-gray-500">{radius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5 km</span>
                  <span>50 km</span>
                </div>
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
                                if (leafletMapRef.current && leafletMapRef.current._leafletMap) {
                                  leafletMapRef.current._leafletMap.setView(
                                    [hospital.latitude, hospital.longitude],
                                    15
                                  );
                                  // Open popup for this hospital
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
                className="text-gray-400 hover:text-gray-600"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWeight="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002-2v10a2 2 0 002 2z"/>
                    </svg>
                    <span>Request an organ from this hospital</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWeight="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 00-5.618 4.016"/>
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
                  if (leafletMapRef.current && leafletMapRef.current._leafletMap && userLocation) {
                    leafletMapRef.current._leafletMap.setView(
                      [userLocation.latitude, userLocation.longitude],
                      13
                    );
                  }
                }}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyHospitalsPage;