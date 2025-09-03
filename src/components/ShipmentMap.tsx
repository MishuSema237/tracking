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
      const addresses = [shipment.origin, shipment.destination];
      if (shipment.currentLocation && shipment.currentLocation !== shipment.origin) {
        addresses.push(shipment.currentLocation);
      }

      const results = await geocodeMultipleAddresses(addresses);
      
      const locationMap = {
        origin: results[0] || null,
        destination: results[1] || null,
        current: shipment.currentLocation && shipment.currentLocation !== shipment.origin 
          ? (results[2] || null)
          : null
      };

      setGeocodedLocations(locationMap);
    } catch (err) {
      setError('Failed to load map locations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [shipment.origin, shipment.destination, shipment.currentLocation]);

  useEffect(() => {
    geocodeLocations();
  }, [geocodeLocations]);

  const getMapCenter = useCallback(() => {
    const locations = [
      geocodedLocations.origin,
      geocodedLocations.current,
      geocodedLocations.destination
    ].filter(Boolean);

    if (locations.length === 0) {
      return { lat: 39.8283, lng: -98.5795 };
    }

    const avgLat = locations.reduce((sum, loc) => sum + loc!.coordinates.lat, 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc!.coordinates.lng, 0) / locations.length;

    return { lat: avgLat, lng: avgLng };
  }, [geocodedLocations]);

  if (isLoading) {
    return (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-md`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Shipment Map
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <FaSpinner className="animate-spin text-2xl text-blue-500" />
            <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading map...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-md`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Shipment Map
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaMapMarkerAlt className="text-4xl text-red-500 mx-auto mb-2" />
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!geocodedLocations.origin && !geocodedLocations.destination) {
    return (
      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-md`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Shipment Map
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FaMapMarkerAlt className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Map data unavailable
            </p>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter = getMapCenter();

  return (
    <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} shadow-md`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
        
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="text-center p-4">
            <FaMapMarkerAlt className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Interactive map loading...
            </p>
          </div>
        </div>
      </div>
      
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
      
      <div className="mt-4 text-center">
        <a
          href={`https://www.google.com/maps/dir/${encodeURIComponent(shipment.origin)}/${encodeURIComponent(shipment.destination)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            isDarkMode
              ? 'bg-purple-600 text-white hover:bg-blue-600'
              : 'bg-blue-600 text-white hover:bg-purple-600'
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
