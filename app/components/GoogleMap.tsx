"use client";

import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { useEffect, useRef, useState } from "react";

interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  children?: React.ReactNode;
}

const Map: React.FC<MapProps> = ({ center, zoom, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();

  useEffect(() => {
    if (ref.current && !map) {
      setMap(
        new window.google.maps.Map(ref.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
      );
    }
  }, [ref, map, center, zoom]);

  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return (
    <>
      <div ref={ref} className="w-full h-full" />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { map });
        }
      })}
    </>
  );
};

interface MarkerProps {
  position: google.maps.LatLngLiteral;
  map?: google.maps.Map;
  title?: string;
}

const Marker: React.FC<MarkerProps> = ({ position, map, title }) => {
  const [marker, setMarker] = useState<google.maps.Marker>();

  useEffect(() => {
    if (!marker && map) {
      const newMarker = new google.maps.Marker({
        position,
        map,
        title: title || "Your Location",
        icon: {
          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%234F46E5'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
      });
      setMarker(newMarker);
    }

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker, map, position, title]);

  useEffect(() => {
    if (marker) {
      marker.setPosition(position);
    }
  }, [marker, position]);

  return null;
};

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <svg
              className="w-8 h-8 text-red-500 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-red-600">Failed to load Google Maps</p>
            <p className="text-sm text-red-500 mt-1">
              Please check your API key configuration
            </p>
          </div>
        </div>
      );
    default:
      return null;
  }
};

interface GoogleMapProps {
  apiKey: string;
  className?: string;
}

export default function GoogleMap({ apiKey, className = "" }: GoogleMapProps) {
  const [userLocation, setUserLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Default center (San Francisco) in case geolocation fails
  const defaultCenter = { lat: 37.7749, lng: -122.4194 };

  useEffect(() => {
    console.log("LOG =====> Requesting user location");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log("LOG =====> User location obtained:", location);
        setUserLocation(location);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.log("LOG =====> Geolocation error:", error.message);
        setLocationError(error.message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  if (isLoadingLocation) {
    return (
      <div
        className={`flex items-center justify-center h-96 bg-gray-100 rounded-lg ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  const center = userLocation || defaultCenter;
  const zoom = userLocation ? 15 : 10;

  return (
    <div
      className={`h-96 rounded-lg overflow-hidden shadow-sm border border-gray-200 ${className}`}
    >
      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-t-lg px-4 py-2">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Location access denied:</span>{" "}
            {locationError}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Showing default location. Enable location access for accurate
            positioning.
          </p>
        </div>
      )}

      <Wrapper apiKey={apiKey} render={render}>
        <Map center={center} zoom={zoom}>
          <Marker
            position={center}
            title={userLocation ? "Your Current Location" : "Default Location"}
          />
        </Map>
      </Wrapper>
    </div>
  );
}
