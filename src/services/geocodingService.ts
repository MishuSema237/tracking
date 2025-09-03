export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
}

const geocodingCache = new Map<string, GeocodingResult>();

const fallbackCoordinates = {
  us: { lat: 39.8283, lng: -98.5795 },
  europe: { lat: 54.5260, lng: 15.2551 },
  asia: { lat: 34.0479, lng: 100.6197 },
  default: { lat: 39.8283, lng: -98.5795 }
};

export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  if (geocodingCache.has(address)) {
    return geocodingCache.get(address)!;
  }

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
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Invalid coordinates returned');
      }
      
      const result: GeocodingResult = {
        coordinates: { lat, lng },
        formattedAddress: data[0].display_name || cleanAddress
      };
      
      geocodingCache.set(address, result);
      return result;
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error(`Geocoding error for "${cleanAddress}":`, error);
    
    const lowerAddress = cleanAddress.toLowerCase();
    let fallbackCoords = fallbackCoordinates.default;
    
    if (lowerAddress.includes('europe') || lowerAddress.includes('uk') || lowerAddress.includes('germany') || lowerAddress.includes('france')) {
      fallbackCoords = fallbackCoordinates.europe;
    } else if (lowerAddress.includes('asia') || lowerAddress.includes('china') || lowerAddress.includes('japan') || lowerAddress.includes('india')) {
      fallbackCoords = fallbackCoordinates.asia;
    }
    
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
      results.push({
        coordinates: fallbackCoordinates.default,
        formattedAddress: address
      });
    }
  }
  
  return results;
};
