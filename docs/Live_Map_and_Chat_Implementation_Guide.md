# Live Map and Live Chat Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Live Map Implementation](#live-map-implementation)
3. [Live Chat Implementation](#live-chat-implementation)
4. [Integration Guide](#integration-guide)
5. [Dependencies](#dependencies)

---

## Overview

This guide provides complete code implementations for adding live map tracking and live chat functionality to your React website. The implementation includes:

- **Live Map**: Interactive map showing shipment origin, current location, and destination with route visualization
- **Live Chat**: Tawk.to integration with custom welcome messages and quick replies
- **Geocoding Service**: Address to coordinate conversion using OpenStreetMap
- **Complete Integration**: Ready-to-use components with TypeScript support

---

## Live Map Implementation

### 1. Geocoding Service (`src/services/geocodingService.ts`)

```typescript
// Geocoding service to convert addresses to coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
}

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, GeocodingResult>();

// Common fallback coordinates for different regions
const fallbackCoordinates = {
  us: { lat: 39.8283, lng: -98.5795 }, // Center of US
  europe: { lat: 54.5260, lng: 15.2551 }, // Center of Europe
  asia: { lat: 34.0479, lng: 100.6197 }, // Center of Asia
  default: { lat: 39.8283, lng: -98.5795 } // Default to US center
};

export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  // Check cache first
  if (geocodingCache.has(address)) {
    return geocodingCache.get(address)!;
  }

  // Clean and validate the address
  const cleanAddress = address.trim();
  if (!cleanAddress) {
    const fallbackResult: GeocodingResult = {
      coordinates: fallbackCoordinates.default,
      formattedAddress: 'Unknown Location'
    };
    geocodingCache.set(address, fallbackResult);
    return fallbackResult;
  }

  try {
    // Using Nominatim (OpenStreetMap) geocoding service - free and no API key required
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Invalid coordinates returned');
      }
      
      const result: GeocodingResult = {
        coordinates: { lat, lng },
        formattedAddress: data[0].display_name || cleanAddress
      };
      
      // Cache the result
      geocodingCache.set(address, result);
      
      return result;
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error(`Geocoding error for "${cleanAddress}":`, error);
    
    // Try to determine region and use appropriate fallback
    const lowerAddress = cleanAddress.toLowerCase();
    let fallbackCoords = fallbackCoordinates.default;
    
    if (lowerAddress.includes('europe') || lowerAddress.includes('uk') || lowerAddress.includes('germany') || lowerAddress.includes('france')) {
      fallbackCoords = fallbackCoordinates.europe;
    } else if (lowerAddress.includes('asia') || lowerAddress.includes('china') || lowerAddress.includes('japan') || lowerAddress.includes('india')) {
      fallbackCoords = fallbackCoordinates.asia;
    }
    
    // Return fallback coordinates if geocoding fails
    const fallbackResult: GeocodingResult = {
      coordinates: fallbackCoords,
      formattedAddress: cleanAddress
    };
    geocodingCache.set(address, fallbackResult);
    return fallbackResult;
  }
};

export const geocodeMultipleAddresses = async (addresses: string[]): Promise<GeocodingResult[]> => {
  const results: GeocodingResult[] = [];
  
  for (const address of addresses) {
    try {
      const result = await geocodeAddress(address);
      results.push(result);
    } catch (error) {
      console.error(`Failed to geocode address: ${address}`, error);
      // Add fallback coordinates
      results.push({
        coordinates: fallbackCoordinates.default,
        formattedAddress: address
      });
    }
  }
  
  return results;
};
```

### 2. LiveMap Component (`src/components/LiveMap.tsx`)

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LocationMarker {
  lat: number;
  lng: number;
  title: string;
  color?: string;
}

interface LiveMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  height?: string;
  showMarker?: boolean;
  markerTitle?: string;
  showResetButton?: boolean;
  // New props for shipment tracking
  origin?: LocationMarker;
  destination?: LocationMarker;
  currentLocation?: LocationMarker;
  showRoute?: boolean;
  routeColor?: string;
  completedRouteColor?: string;
}

const LiveMap: React.FC<LiveMapProps> = ({
  center = { lat: 51.5074, lng: -0.1278 }, // Default to London
  zoom = 13,
  className = '',
  height = '400px',
  showMarker = true,
  markerTitle = 'NAVISTA Headquarters',
  showResetButton = true,
  origin,
  destination,
  currentLocation,
  showRoute = false,
  routeColor = '#5928b1',
  completedRouteColor = '#10b981'
}) => {
  const { isDarkMode } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);
  const [mapError, setMapError] = useState<string | null>(null);

  const resetMapView = () => {
    if (mapInstanceRef.current && mapInstanceRef.current.setView) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  };

  const zoomToLocation = (lat: number, lng: number, zoomLevel: number = 12) => {
    if (mapInstanceRef.current && mapInstanceRef.current.setView) {
      mapInstanceRef.current.setView([lat, lng], zoomLevel);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      // Wait for DOM to be ready
      if (!mapRef.current) return;

      // Load Leaflet if not already loaded
      if (!(window as any).L) {
        // Load CSS first
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // Load JS
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Leaflet'));
          document.head.appendChild(script);
        });
      }

      if (!isMounted || !mapRef.current) return;

      const L = (window as any).L;
      if (!L) return;

      // Clean up any existing map
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error removing existing map:', error);
        }
        mapInstanceRef.current = null;
      }

      // Clean up container
      if (mapRef.current) {
        try {
          // Remove any existing Leaflet elements
          const existingElements = mapRef.current.querySelectorAll('.leaflet-container, .leaflet-control-container, .leaflet-pane');
          existingElements.forEach(el => el.remove());
          
          // Clear the container
          mapRef.current.innerHTML = '';
        } catch (error) {
          console.warn('Error cleaning container:', error);
        }
      }

      if (!isMounted || !mapRef.current) return;

      try {
        // Ensure container is ready
        if (!mapRef.current || !mapRef.current.offsetParent) {
          console.warn('Map container not ready');
          return;
        }

        // Create new map instance
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: true,
          attributionControl: true
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        // Add markers based on props
        if (origin && destination) {
          // Add origin marker (green)
          const originIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          L.marker([origin.lat, origin.lng], { icon: originIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>Origin:</b> ${origin.title}`)
            .openPopup();

          // Add destination marker (red)
          const destIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          L.marker([destination.lat, destination.lng], { icon: destIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>Destination:</b> ${destination.title}`);

          // Add current location marker (blue) if provided
          if (currentLocation) {
            const currentIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            
            L.marker([currentLocation.lat, currentLocation.lng], { icon: currentIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`<b>Current Location:</b> ${currentLocation.title}`);
          }

          // Add route lines if requested
          if (showRoute) {
            if (currentLocation) {
              // Create two separate route segments with different colors
              
              // Segment 1: Origin to Current Location (completed route - green)
              const completedRoute = L.polyline([
                [origin.lat, origin.lng],
                [currentLocation.lat, currentLocation.lng]
              ], {
                color: completedRouteColor,
                weight: 4,
                opacity: 0.8,
                dashArray: '5, 5'
              }).addTo(mapInstanceRef.current);

              // Segment 2: Current Location to Destination (remaining route - purple)
              const remainingRoute = L.polyline([
                [currentLocation.lat, currentLocation.lng],
                [destination.lat, destination.lng]
              ], {
                color: routeColor,
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10'
              }).addTo(mapInstanceRef.current);
            } else {
              // Single route line if no current location
              const routeLine = L.polyline([
                [origin.lat, origin.lng],
                [destination.lat, destination.lng]
              ], {
                color: routeColor,
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10'
              }).addTo(mapInstanceRef.current);
            }

            // Fit map to show all markers
            const bounds = L.latLngBounds([
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
              ...(currentLocation ? [[currentLocation.lat, currentLocation.lng]] : [])
            ]);
            mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
          }
        } else if (showMarker) {
          // Default single marker
          L.marker([center.lat, center.lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(markerTitle)
            .openPopup();
        }

        // Force a resize to ensure proper rendering
        setTimeout(() => {
          if (mapInstanceRef.current && mapInstanceRef.current.invalidateSize) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 100);

      } catch (error) {
        console.error('Error creating map:', error);
        setMapError('Failed to load map');
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error during map cleanup:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [center.lat, center.lng, zoom, showMarker, markerTitle, origin, destination, currentLocation, showRoute, routeColor, completedRouteColor]);

  // Show error state if map failed to load
  if (mapError) {
    return (
      <div className="relative">
        <div
          className={`w-full rounded-lg shadow-lg ${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}
          style={{ height, zIndex: 1 }}
        >
          <div className="text-center p-4">
            <div className="text-4xl text-gray-400 mb-2">🗺️</div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {mapError}
            </p>
            <button
              onClick={() => {
                setMapError(null);
                // Force re-initialization
                if (mapRef.current) {
                  mapRef.current.innerHTML = '';
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        id={mapId.current}
        className={`w-full rounded-lg shadow-lg ${className}`}
        style={{ height, zIndex: 1 }}
      />
      {showResetButton && (
        <button
          onClick={resetMapView}
          className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium transition-colors duration-200 z-10"
          title="Reset map view"
          style={{ zIndex: 1000 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
      
      {/* Legend for shipment tracking */}
      {(origin && destination) && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm z-10">
          <div 
            className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
            onClick={() => origin && zoomToLocation(origin.lat, origin.lng)}
            title="Click to zoom to origin"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-700 dark:text-gray-300">Origin</span>
            <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {currentLocation && (
            <div 
              className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
              onClick={() => currentLocation && zoomToLocation(currentLocation.lat, currentLocation.lng)}
              title="Click to zoom to current location"
            >
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-gray-700 dark:text-gray-300">Current Location</span>
              <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
          <div 
            className="flex items-center mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
            onClick={() => destination && zoomToLocation(destination.lat, destination.lng)}
            title="Click to zoom to destination"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-700 dark:text-gray-300">Destination</span>
            <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {currentLocation && (
            <>
              <div className="flex items-center mb-1">
                <div className="w-3 h-1 bg-green-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300 text-xs">Completed Route</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-1 bg-purple-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300 text-xs">Remaining Route</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMap;
```

### 3. ShipmentMap Component (`src/components/ShipmentMap.tsx`)

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { Shipment } from '../services/shipmentService';
import { geocodeMultipleAddresses, GeocodingResult } from '../services/geocodingService';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import LiveMap from './LiveMap';

interface ShipmentMapProps {
  shipment: Shipment;
  isDarkMode: boolean;
}

const ShipmentMap: React.FC<ShipmentMapProps> = ({ shipment, isDarkMode }) => {
  const [geocodedLocations, setGeocodedLocations] = useState<{
    origin: GeocodingResult | null;
    current: GeocodingResult | null;
    destination: GeocodingResult | null;
  }>({
    origin: null,
    current: null,
    destination: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const geocodeLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Collect all unique addresses to geocode
      const addresses = [shipment.origin, shipment.destination];
      if (shipment.currentLocation && shipment.currentLocation !== shipment.origin) {
        addresses.push(shipment.currentLocation);
      }

      console.log('Geocoding addresses:', addresses);

      const results = await geocodeMultipleAddresses(addresses);
      
      console.log('Geocoding results:', results);
      
      // Create a more robust mapping logic
      const locationMap = {
        origin: results[0] || null,
        destination: results[1] || null,
        current: shipment.currentLocation && shipment.currentLocation !== shipment.origin 
          ? (results[2] || null)
          : null
      };

      console.log('Location map:', locationMap);
      setGeocodedLocations(locationMap);
    } catch (err) {
      setError('Failed to load map locations. Please try again.');
      console.error('Geocoding error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shipment.origin, shipment.destination, shipment.currentLocation]);

  useEffect(() => {
    geocodeLocations();
  }, [geocodeLocations]);

  // Calculate center point for the map
  const getMapCenter = useCallback(() => {
    const locations = [
      geocodedLocations.origin,
      geocodedLocations.current,
      geocodedLocations.destination
    ].filter(Boolean);

    if (locations.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // Center of US
    }

    const avgLat = locations.reduce((sum, loc) => sum + loc!.coordinates.lat, 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc!.coordinates.lng, 0) / locations.length;

    return { lat: avgLat, lng: avgLng };
  }, [geocodedLocations]);

  if (isLoading) {
  return (
    <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-neutral-slate' : 'bg-neutral-white'} shadow-md`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-neutral-white' : 'text-primary-blue'}`}>
        Shipment Map
      </h2>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <FaSpinner className="animate-spin text-2xl text-blue-500" />
            <span className={`text-lg ${isDarkMode ? 'text-neutral-white' : 'text-grey-300'}`}>
              Loading map...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-neutral-slate' : 'bg-neutral-white'} shadow-md`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-neutral-white' : 'text-primary-blue'}`}>
          Shipment Map
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaMapMarkerAlt className="text-4xl text-red-500 mx-auto mb-2" />
            <p className={`text-lg ${isDarkMode ? 'text-neutral-white' : 'text-grey-300'}`}>
              {error}
            </p>
          </div>
        </div>
            </div>
    );
  }

  // If no valid locations, show a fallback
  if (!geocodedLocations.origin && !geocodedLocations.destination) {
    return (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-neutral-slate' : 'bg-neutral-white'} shadow-md`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-neutral-white' : 'text-primary-blue'}`}>
          Shipment Map
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaMapMarkerAlt className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className={`text-lg ${isDarkMode ? 'text-neutral-white' : 'text-grey-300'}`}>
              Map data unavailable
            </p>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter = getMapCenter();

  return (
    <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-neutral-slate' : 'bg-neutral-white'} shadow-md`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-neutral-white' : 'text-primary-blue'}`}>
        Shipment Route Map
      </h2>
      
      <div className="relative">
        <LiveMap
          center={mapCenter}
          zoom={6}
          height="400px"
          showMarker={false}
          showResetButton={true}
          origin={geocodedLocations.origin ? {
            lat: geocodedLocations.origin.coordinates.lat,
            lng: geocodedLocations.origin.coordinates.lng,
            title: geocodedLocations.origin.formattedAddress
          } : undefined}
          destination={geocodedLocations.destination ? {
            lat: geocodedLocations.destination.coordinates.lat,
            lng: geocodedLocations.destination.coordinates.lng,
            title: geocodedLocations.destination.formattedAddress
          } : undefined}
          currentLocation={geocodedLocations.current ? {
            lat: geocodedLocations.current.coordinates.lat,
            lng: geocodedLocations.current.coordinates.lng,
            title: geocodedLocations.current.formattedAddress
          } : undefined}
          showRoute={true}
          routeColor={isDarkMode ? '#8b5cf6' : '#5928b1'}
          completedRouteColor={isDarkMode ? '#10b981' : '#059669'}
          className="rounded-lg"
        />
        
        {/* Fallback if map fails to load */}
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="text-center p-4">
            <FaMapMarkerAlt className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Interactive map loading...
            </p>
          </div>
        </div>
      </div>
      
      {/* Location Details */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            Origin
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {geocodedLocations.origin?.formattedAddress || shipment.origin}
          </p>
        </div>
        
        {geocodedLocations.current && geocodedLocations.current !== geocodedLocations.origin && (
          <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              Current Location
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {geocodedLocations.current.formattedAddress}
            </p>
          </div>
        )}
        
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            Destination
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {geocodedLocations.destination?.formattedAddress || shipment.destination}
          </p>
        </div>
      </div>
      
      {/* Interactive Map Link */}
      <div className="mt-4 text-center">
        <a
          href={`https://www.google.com/maps/dir/${encodeURIComponent(shipment.origin)}/${encodeURIComponent(shipment.destination)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            isDarkMode
              ? 'bg-primary-purple text-neutral-white hover:bg-primary-blue'
              : 'bg-primary-blue text-neutral-white hover:bg-primary-purple'
          }`}
        >
          <FaMapMarkerAlt />
          <span>View Route in Google Maps</span>
        </a>
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Opens Google Maps with turn-by-turn directions from origin to destination
        </p>
      </div>
    </div>
  );
};

export default ShipmentMap;
```

---

## Live Chat Implementation

### LiveChat Component (`src/components/LiveChat.tsx`)

```typescript
import React, { useEffect } from 'react';

// TypeScript declarations for Tawk.to API
declare global {
  interface Window {
    Tawk_API?: {
      onLoad: () => void;
      setAttributes: (attributes: { name: string; email: string; role: string }) => void;
      sendMessage: (message: string) => void;
      showWidget: () => void;
      hideWidget: () => void;
      toggleVisibility: () => void;
    };
  }
}

const LiveChat: React.FC = () => {
  // Welcome message options
  const welcomeMessages = [
    "Hello! 👋 Welcome to PetXpress! I'm here to help you with your shipment tracking, delivery questions, or any other inquiries. How can I assist you today?",
    "Hi there! 🚚 Welcome to PetXpress! Need help tracking your shipment or have questions about delivery? I'm here to help!",
    "Welcome to PetXpress! 📦 I'm your shipping assistant. I can help you track packages, check delivery status, or answer any shipping questions. What can I help you with?",
    "Hello! 🎉 Thanks for visiting PetXpress! I'm here to make your shipping experience smooth and easy. How can I assist you today?"
  ];

  // Suggested quick reply buttons
  const quickReplies = [
    "Track My Package",
    "Check Delivery Status", 
    "Shipping Rates",
    "File a Claim",
    "Contact Support"
  ];

  // Get random welcome message
  const getRandomWelcomeMessage = () => {
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  };

  // Add quick reply buttons after welcome message
  const addQuickReplies = () => {
    if (window.Tawk_API) {
      setTimeout(() => {
        // Add quick reply buttons
        quickReplies.forEach((reply, index) => {
          setTimeout(() => {
            window.Tawk_API?.sendMessage(`[Quick Reply ${index + 1}] ${reply}`);
          }, (index + 1) * 500); // Stagger the buttons
        });
      }, 2000); // Show after welcome message
    }
  };

  useEffect(() => {
    // Check if Tawk.to script is already loaded
    const existingScript = document.querySelector('script[src*="tawk.to"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Load Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/68ac5fffbe8646192a417352/1j3gle0m2';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    script.onload = () => {
      console.log('Tawk.to script loaded successfully');
      
      // Wait a bit for Tawk_API to be available
      setTimeout(() => {
        if (window.Tawk_API) {
          console.log('Tawk_API is available');
          // Set welcome message
          window.Tawk_API.onLoad = function() {
            console.log('Tawk.to widget loaded');
            try {
              // Set visitor attributes
              window.Tawk_API?.setAttributes({
                'name': 'PetXpress Customer',
                'email': '',
                'role': 'customer'
              });
              
              // Send welcome message with slight delay for better UX
              setTimeout(() => {
                window.Tawk_API?.sendMessage(getRandomWelcomeMessage());
                // Add quick reply buttons after welcome message
                addQuickReplies();
              }, 1000);
            } catch (error) {
              console.error('Error setting up Tawk.to:', error);
            }
          };
        } else {
          console.error('Tawk_API not available');
        }
      }, 1000);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Tawk.to script:', error);
    };
    
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src*="tawk.to"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Return null since we're using Tawk.to's built-in widget
  return null;
};

export default LiveChat;
```

---

## Integration Guide

### 1. Add to your App component (`src/App.tsx`)

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LiveChat from './components/LiveChat';
// ... other imports

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Your existing components */}
        <Routes>
          {/* Your routes */}
        </Routes>
        <LiveChat /> {/* Add this line */}
      </div>
    </Router>
  );
};

export default App;
```

### 2. Add to your tracking page

```typescript
import React from 'react';
import ShipmentMap from '../components/ShipmentMap';

const TrackPage: React.FC = () => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const { isDarkMode } = useTheme();

  return (
    <div>
      {/* Your existing tracking content */}
      
      {shipment && (
        <ShipmentMap 
          shipment={shipment} 
          isDarkMode={isDarkMode} 
        />
      )}
    </div>
  );
};
```

### 3. Create Theme Context (if not exists)

```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

---

## Dependencies

### Required Dependencies (`package.json`)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-icons": "^5.5.0",
    "react-router-dom": "^6.30.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^4.9.5"
  }
}
```

### External Services (No API Keys Required)

1. **Geocoding**: Nominatim (OpenStreetMap) - Free
2. **Maps**: Leaflet.js via CDN - Free
3. **Chat**: Tawk.to - Free tier available

### Installation Commands

```bash
# Install dependencies
npm install react react-dom react-icons react-router-dom tailwindcss typescript

# For TypeScript support
npm install --save-dev @types/react @types/react-dom
```

---

## Features Summary

### Live Map Features:
- ✅ Real-time address to coordinate conversion
- ✅ Interactive markers (origin, current, destination)
- ✅ Route visualization with different colors
- ✅ Zoom controls and reset functionality
- ✅ Dark mode support
- ✅ Error handling and fallbacks
- ✅ Mobile responsive
- ✅ No API key required

### Live Chat Features:
- ✅ Automatic widget loading
- ✅ Custom welcome messages
- ✅ Quick reply buttons
- ✅ Visitor tracking
- ✅ Mobile responsive
- ✅ Free tier available

---

## Customization

### Map Customization:
- Change marker colors in `LiveMap.tsx`
- Modify route line styles
- Adjust map center and zoom levels
- Custom popup content
- Add additional map controls

### Chat Customization:
- Modify welcome messages in `LiveChat.tsx`
- Change quick reply options
- Customize visitor attributes
- Adjust widget positioning

This implementation provides a complete, production-ready solution for both live mapping and live chat functionality that can be easily integrated into any React website.
