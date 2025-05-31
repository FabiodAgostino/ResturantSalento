import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Target, Star, Clock } from "lucide-react";
import RestaurantModal from "@/components/RestaurantModal";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { Restaurant } from "@/lib/types";

const Recommended = () => {
  const [preferredCuisine, setPreferredCuisine] = useState("pugliese");
  const [preferredPrice, setPreferredPrice] = useState("€€");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { location, isLoading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in kilometers
    return d;
  };

  const getRecommendations = () => {
    if (!restaurants.length) return [];

    let scored = restaurants.map(restaurant => {
      let score = 0;
      
      // Cuisine preference score (40% weight)
      if (restaurant.cuisine === preferredCuisine) {
        score += 40;
      }
      
      // Price preference score (20% weight)
      if (restaurant.priceRange === preferredPrice) {
        score += 20;
      }
      
      // Rating score (30% weight)
      const ratingScore = (parseFloat(restaurant.rating) / 5) * 30;
      score += ratingScore;
      
      // Distance score (10% weight) - only if location is available
      let distance = null;
      if (location && restaurant.latitude && restaurant.longitude) {
        distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(restaurant.latitude), 
          parseFloat(restaurant.longitude)
        );
        // Closer restaurants get higher scores (max 10 points for < 1km)
        const distanceScore = Math.max(0, 10 - (distance / 2));
        score += distanceScore;
      }
      
      return { ...restaurant, score, distance };
    });

    return scored.sort((a, b) => b.score - a.score);
  };

  const recommendations = getRecommendations();
  const topRecommendation = recommendations[0];
  const otherRecommendations = recommendations.slice(1, 3);

  const formatDistance = (distance: number | null) => {
    if (!distance) return null;
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getWalkingTime = (distance: number | null) => {
    if (!distance) return null;
    const walkingSpeed = 5; // km/h
    const minutes = Math.round((distance / walkingSpeed) * 60);
    return `${minutes} min walk`;
  };

  const cuisineOptions = [
    { value: "pugliese", label: "Pugliese" },
    { value: "italiana", label: "Italiana" },
    { value: "mediterranea", label: "Mediterranea" },
    { value: "pesce", label: "Pesce" },
    { value: "barbecue", label: "Barbecue" },
    { value: "steakhouse", label: "Steakhouse" },
  ];

  const priceOptions = [
    { value: "€", label: "€ - Budget" },
    { value: "€€", label: "€€ - Moderate" },
    { value: "€€€", label: "€€€ - Expensive" },
    { value: "€€€€", label: "€€€€ - Fine Dining" },
  ];

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Recommended for You
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Based on your location and preferences
          </p>
        </div>

        {/* Location Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-[hsl(var(--terracotta))] mr-3" />
                <div>
                  <h3 className="font-semibold text-[hsl(var(--dark-slate))]">Your Location</h3>
                  <p className="text-[hsl(var(--dark-slate))]/70">
                    {locationLoading 
                      ? "Detecting location..." 
                      : location 
                      ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
                      : locationError
                      ? "Unable to detect location"
                      : "Click to detect your location"
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
              >
                <Target className="w-4 h-4 mr-2" />
                {locationLoading ? "Detecting..." : "Detect Location"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preference Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Your Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--dark-slate))] mb-2">
                  Preferred Cuisine
                </label>
                <Select value={preferredCuisine} onValueChange={setPreferredCuisine}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--dark-slate))] mb-2">
                  Price Range
                </label>
                <Select value={preferredPrice} onValueChange={setPreferredPrice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Restaurants */}
        <div className="space-y-6">
          {/* Top Recommendation */}
          {topRecommendation && (
            <div className="bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--saddle))] rounded-xl text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[hsl(var(--goldenrod))] text-[hsl(var(--dark-slate))] px-3 py-1 rounded-bl-lg font-bold text-sm">
                #1 CHOICE
              </div>
              <div className="flex flex-col md:flex-row items-center">
                <img
                  src={topRecommendation.imageUrl || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150"}
                  alt={topRecommendation.name}
                  className="w-full md:w-48 h-32 object-cover rounded-lg mb-4 md:mb-0 md:mr-6"
                />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-display font-bold mb-2">
                    {topRecommendation.name}
                  </h3>
                  <p className="mb-3 opacity-90">
                    Perfect match for {preferredCuisine} cuisine lovers
                    {topRecommendation.distance && ` • Only ${formatDistance(topRecommendation.distance)} away`}
                  </p>
                  <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-[hsl(var(--goldenrod))] mr-1 fill-current" />
                      <span>{topRecommendation.rating}</span>
                    </div>
                    <span>{topRecommendation.priceRange}</span>
                    {topRecommendation.distance && (
                      <span>{getWalkingTime(topRecommendation.distance)}</span>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedRestaurant(topRecommendation);
                      setIsModalOpen(true);
                    }}
                    className="bg-white text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--warm-beige))] font-semibold"
                  >
                    View Restaurant
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Other Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherRecommendations.map((restaurant, index) => (
              <Card key={restaurant.id} className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] px-2 py-1 rounded-full text-sm font-medium">
                      #{index + 2}
                    </span>
                    {restaurant.distance && (
                      <span className="text-[hsl(var(--dark-slate))]/60 text-sm">
                        {formatDistance(restaurant.distance)} away
                      </span>
                    )}
                  </div>
                  
                  <img
                    src={restaurant.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
                    alt={restaurant.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  
                  <h4 className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                    {restaurant.name}
                  </h4>
                  
                  <p className="text-[hsl(var(--dark-slate))]/70 mb-3 line-clamp-2">
                    {restaurant.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-[hsl(var(--goldenrod))]">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        <span>{restaurant.rating}</span>
                      </div>
                      <span className="text-[hsl(var(--terracotta))]">
                        {restaurant.priceRange}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setIsModalOpen(true);
                      }}
                      className="text-[hsl(var(--terracotta))] hover:text-[hsl(var(--saddle))]"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {recommendations.length === 0 && (
          <div className="text-center py-12">
            <Card>
              <CardContent className="p-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                  No recommendations available
                </h3>
                <p className="text-[hsl(var(--dark-slate))]/70">
                  Try adjusting your preferences or check back later
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Restaurant Modal */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};

export default Recommended;
