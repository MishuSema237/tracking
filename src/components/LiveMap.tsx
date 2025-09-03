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
  origin?: LocationMarker;
  destination?: LocationMarker;
  currentLocation?: LocationMarker;
  showRoute?: boolean;
  routeColor?: string;
  completedRouteColor?: string;
}

const LiveMap: React.FC<LiveMapProps> = ({
  center = { lat: 51.5074, lng: -0.1278 },
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
      if (!mapRef.current) return;

      if (!(window as any).L) {
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

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

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error removing existing map:', error);
        }
        mapInstanceRef.current = null;
      }

      if (mapRef.current) {
        try {
          const existingElements = mapRef.current.querySelectorAll('.leaflet-container, .leaflet-control-container, .leaflet-pane');
          existingElements.forEach(el => el.remove());
          mapRef.current.innerHTML = '';
        } catch (error) {
          console.warn('Error cleaning container:', error);
        }
      }

      if (!isMounted || !mapRef.current) return;

      try {
        if (!mapRef.current || !mapRef.current.offsetParent) {
          console.warn('Map container not ready');
          return;
        }

        mapInstanceRef.current = L.map(mapRef.current, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: true,
          attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        if (origin && destination) {
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

          const destIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          L.marker([destination.lat, destination.lng], { icon: destIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>Destination:</b> ${destination.title}`);

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

          if (showRoute) {
            if (currentLocation) {
              const completedRoute = L.polyline([
                [origin.lat, origin.lng],
                [currentLocation.lat, currentLocation.lng]
              ], {
                color: completedRouteColor,
                weight: 4,
                opacity: 0.8,
                dashArray: '5, 5'
              }).addTo(mapInstanceRef.current);

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

            const bounds = L.latLngBounds([
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
              ...(currentLocation ? [[currentLocation.lat, currentLocation.lng]] : [])
            ]);
            mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
          }
        } else if (showMarker) {
          L.marker([center.lat, center.lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(markerTitle)
            .openPopup();
        }

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
          style={{ zIndex: 30 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
      
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
