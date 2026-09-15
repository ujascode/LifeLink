"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import api from "@/services/api";

// Initialize Leaflet default icon (to avoid missing icon issues)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").default,
  iconUrl: require("leaflet/dist/images/marker-icon.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
});

export default function FindOrgans() {
  const [organs, setOrgans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useState({
    organType: "",
    bloodGroup: "",
    city: "",
    state: "",
    radius: 50, // default radius in km
  });
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { latitude, longitude }
  const [nearestHospitalOrganId, setNearestHospitalOrganId] = useState(null);
  const [selectedOrganId, setSelectedOrganId] = useState(null); // For marker click selection
  const abortControllerRef = useRef(null);
  const organMarkersRef = useRef(new Map());

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6378.1; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    if (nearestHospitalOrganId) {
      const element = document.getElementById(`organ-card-${nearestHospitalOrganId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [nearestHospitalOrganId]);

  // Clear selected organ ID and marker references when organs list or nearest hospital changes
  useEffect(() => {
    setSelectedOrganId(null);
    organMarkersRef.current.clear();
  }, [organs, nearestHospitalOrganId]);

  // Fetch organs based on search parameters
  const fetchOrgans = async () => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError("");
    try {
      let lat = null;
      let lng = null;
      const { city, state, radius } = searchParams;

      // If city or state is provided, we need to geocode to get latitude and longitude
      if (city || state) {
        if (!city || !state) {
          setError("Both city and state are required for location-based search");
          setLoading(false);
          return;
        }
        const geocodeResponse = await api.get(`/hospitals/geocode`, {
          params: { city, state },
          signal: abortControllerRef.current.signal,
        });
        if (!geocodeResponse.success || !geocodeResponse.data) {
          setError("Unable to geocode the provided location");
          setLoading(false);
          return;
        }
        lat = geocodeResponse.data.latitude;
        lng = geocodeResponse.data.longitude;
        setUserLocation({ latitude: lat, longitude: lng });
      }

      const queryParams = new URLSearchParams();
      if (searchParams.organType) queryParams.append("organType", searchParams.organType);
      if (searchParams.bloodGroup) queryParams.append("bloodGroup", searchParams.bloodGroup);
      if (lat !== null && lng !== null) {
        queryParams.append("latitude", lat);
        queryParams.append("longitude", lng);
        queryParams.append("radius", radius);
      }
      // Note: We are not using city and state for regex search when using proximity search

      const response = await api.get(`/organs?${queryParams.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      setOrgans(response.data.organs || []);
    } catch (err) {
      // Ignore abort errors
      if (abortControllerRef.current && abortControllerRef.current.signal.aborted) {
        return;
      }
      console.error("Find organs error:", err);
      setError(err.response?.data?.message || "Unable to search for organs.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize or update the map
  useEffect(() => {
    if (mapRef.current) {
      // Initialize map if not already initialized
      if (!map) {
        const newMap = L.map(mapRef.current).setView([20.5937, 78.9629], 4); // Default to India coordinates
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(newMap);
        setMap(newMap);
      }

      // Clear existing markers
      if (map.eachLayer) {
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });
      }

      // Add user location marker if available
      if (userLocation) {
        const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: L.icon({
            iconUrl: require("leaflet/dist/images/marker-icon-2x-green.png").default,
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x-green.png").default,
            shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize: [41, 41]
          })
        }).addTo(map);
        userMarker.bindPopup("<b>Your Location</b>").openPopup();
      }

      // Add markers for each organ
      organs.forEach((organ) => {
        const { latitude, longitude } = organ.location;
        if (latitude && longitude) {
          const marker = L.marker([latitude, longitude]).addTo(map);
          // Store marker reference for organ ID lookups
          organMarkersRef.current.set(organ._id, marker);
          marker.on('click', () => {
            setSelectedOrganId(organ._id);
            // Fly to the organ's location
            if (map) {
              map.flyTo([organ.location.latitude, organ.location.longitude], 15, {
                duration: 1.5
              });
            }
            // Scroll the card into view
            const cardElement = document.getElementById(`organ-card-${organ._id}`);
            if (cardElement) {
              cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          });
          marker.bindPopup(
            `<b>${organ.organType}</b><br/>
             Blood Group: ${organ.bloodGroup}<br/>
             Donor Age: ${organ.donorAge} years<br/>
             Donor Gender: ${organ.donorGender}<br/>
             Availability: ${new Date(
               organ.availabilityDate
             ).toLocaleDateString()}<br/>
             Status: ${organ.status}<br/>
             <i>${organ.location.address}, ${organ.location.city}, ${organ.location.state}</i>`
          );
        }
      });

      // If we have user location and organs, find the nearest hospital
      if (userLocation && organs.length > 0) {
        let nearestOrgan = null;
        let minDistance = Infinity;

        organs.forEach((organ) => {
          const { latitude, longitude } = organ.location;
          if (latitude && longitude) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              latitude,
              longitude
            );
            if (distance < minDistance) {
              minDistance = distance;
              nearestOrgan = organ;
            }
          }
        });

        if (nearestOrgan) {
          setNearestHospitalOrganId(nearestOrgan._id);

          // Fly to the nearest hospital and open its popup
          if (map) {
            map.flyTo([nearestOrgan.location.latitude, nearestOrgan.location.longitude], 15, {
              duration: 2.0 // in seconds
            });

            // Note: Opening the popup programmatically is complex without a marker reference.
            // For now, we rely on the user to click the marker to see the popup.
            // This is a known limitation; in a production app, we would keep a map of organId to marker.
          }
        }
      }

      // If there are organs, fit the map to show all markers and the user location
      if (organs.length > 0) {
        const group = new L.featureGroup(
          organs
            .filter((o) => o.location.latitude && o.location.longitude)
            .map((o) => L.latLng(o.location.latitude, o.location.longitude))
        );
        if (userLocation) {
          group.addLayer(L.latLng(userLocation.latitude, userLocation.longitude));
        }
        if (group.getLayers().length > 0) {
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }
  }, [organs, map, userLocation]);

  // Reset search
  const resetSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSearchParams({
      organType: "",
      bloodGroup: "",
      city: "",
      state: "",
      radius: 50,
    });
    setOrgans([]);
    setUserLocation(null);
    setNearestHospitalOrganId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Find Organs</h1>
            <p className="mt-1 text-slate-500">
              Search for available organs from other hospitals
            </p>
          </div>
          <button
            onClick={resetSearch}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-medium text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Search Form */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Search Filters</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Organ Type
                </label>
                <select
                  value={searchParams.organType}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      organType: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="Heart">Heart</option>
                  <option value="Liver">Liver</option>
                  <option value="Kidney">Kidney</option>
                  <option value="Lung">Lung</option>
                  <option value="Pancreas">Pancreas</option>
                  <option value="Intestine">Intestine</option>
                  <option value="Cornea">Cornea</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Blood Group
                </label>
                <select
                  value={searchParams.bloodGroup}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      bloodGroup: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={searchParams.city}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="Enter city"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={searchParams.state}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  placeholder="Enter state"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Map-based search fields (for future use) */}
              <div className="md:col-span-2">
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Or use map to search area (latitude, longitude, radius)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      step="any"
                      value={searchParams.latitude}
                      onChange={(e) =>
                        setSearchParams((prev) => ({
                          ...prev,
                          latitude: e.target.value,
                        }))
                      }
                      placeholder="Latitude"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      value={searchParams.longitude}
                      onChange={(e) =>
                        setSearchParams((prev) => ({
                          ...prev,
                          longitude: e.target.value,
                        }))
                      }
                      placeholder="Longitude"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={searchParams.radius}
                      onChange={(e) =>
                        setSearchParams((prev) => ({
                          ...prev,
                          radius: e.target.value,
                        }))
                      }
                      placeholder="Radius (km)"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        // For now, we just use the lat/lng/radius to center the map
                        // In the future, we will send these to the backend for proximity search
                        if (
                          searchParams.latitude &&
                          searchParams.longitude &&
                          map
                        ) {
                          map.setView(
                            [parseFloat(searchParams.latitude), parseFloat(searchParams.longitude)],
                            10
                          );
                        }
                      }}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium"
                    >
                      Center Map
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                onClick={fetchOrgans}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-slate-600">
            Found <span className="font-bold text-slate-900">{organs.length}</span> organs
          </p>
        </div>

        {/* Results and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div
              ref={mapRef}
              className="h-96 rounded-lg shadow-lg border border-slate-200"
            ></div>
          </div>

          {/* Organs List */}
          <div className="lg:col-span-1">
            {organs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">
                  No organs match your search criteria. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {organs.map((organ) => (
                  <div
                    key={organ._id}
                    id={`organ-card-${organ._id}`}
                    className={`bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:bg-slate-50 transition-colors ${organ._id === nearestHospitalOrganId || organ._id === selectedOrganId ? "border-4 border-blue-500" : ""}`}
                    onClick={() => {
                      if (map) {
                        const marker = organMarkersRef.current.get(organ._id);
                        if (marker) {
                          // Fly to the organ's location
                          map.flyTo([organ.location.latitude, organ.location.longitude], 15, {
                            duration: 1.5
                          });

                          // Open the marker's popup
                          marker.openPopup();

                          // Optional: Bounce the marker to highlight it
                          marker.bounce();
                        }
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {organ.organType}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Blood Group: {organ.bloodGroup}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                        {organ.status}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-600 text-sm">
                      <p>
                        Donor: {organ.donorAge} years, {organ.donorGender}
                      </p>
                      <p>
                        Available: {new Date(
                          organ.availabilityDate
                        ).toLocaleDateString()}
                      </p>
                      <p className="line-clamp-2">
                        <i>
                          {organ.location.address}, {organ.location.city}, {organ.location.state}
                        </i>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}