import { useState, useCallback } from "react";
import type { GeolocationPosition, GeolocationError } from "@/lib/types";

interface UseGeolocationReturn {
  location: GeolocationPosition | null;
  isLoading: boolean;
  error: GeolocationError | null;
  getCurrentLocation: () => void;
  clearError: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: "Geolocation is not supported by this browser"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLoading(false);
      },
      (err) => {
        let errorMessage: string;
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
          default:
            errorMessage = "An unknown error occurred while retrieving location";
            break;
        }

        setError({
          code: err.code,
          message: errorMessage
        });
        setIsLoading(false);
      },
      options
    );
  }, []);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    clearError
  };
};
