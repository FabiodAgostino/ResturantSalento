import { useEffect, useRef } from "react";
import type { Restaurant } from "@/lib/types";

interface InteractiveMapProps {
  restaurants: Restaurant[];
  onRestaurantClick?: (restaurant: Restaurant) => void;
  className?: string;
}

const InteractiveMap = ({ restaurants, onRestaurantClick, className = "" }: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Dynamically load Leaflet if not already loaded
    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [restaurants]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center map on Salento region
    mapInstanceRef.current = ((window as any).L).map(mapRef.current).setView([40.2, 18.2], 10);

    ((window as any).L).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !((window as any).L)) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add restaurant markers
    restaurants.forEach(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        const lat = parseFloat(restaurant.latitude);
        const lng = parseFloat(restaurant.longitude);
        
        const marker =((window as any).L).marker([lat, lng]).addTo(mapInstanceRef.current);
        
        const popupContent = `
          <div class="p-2">
            <h3 class="font-semibold text-lg mb-1">${restaurant.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${restaurant.location}</p>
            <div class="flex items-center mb-2">
              <span class="text-yellow-500 mr-1">★</span>
              <span class="mr-2">${restaurant.rating}</span>
              <span class="text-orange-600 font-medium">${restaurant.priceRange}</span>
            </div>
            <button 
              onclick="window.openRestaurantFromMap?.(${restaurant.id})"
              class="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
            >
              Dettagli
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);

        // Handle marker click
        marker.on('click', () => {
          onRestaurantClick?.(restaurant);
        });
      }
    });

    // Set up global function for popup button clicks
    (window as any).openRestaurantFromMap = (restaurantId: number) => {
      const restaurant = restaurants.find(r => r.id === restaurantId);
      if (restaurant && onRestaurantClick) {
        onRestaurantClick(restaurant);
      }
    };
  };

  return <div ref={mapRef} className={`h-96 rounded-xl ${className}`} />;
};

export default InteractiveMap;
