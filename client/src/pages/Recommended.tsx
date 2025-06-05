import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Target, Star, Clock, TrendingUp } from "lucide-react";
import RestaurantModal from "@/components/RestaurantModal";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useRestaurants, formatServiceError, logError } from "../../services/restaurant-service";
import { useFavorites } from "@/hooks/use-favorites";
import type { Restaurant } from "@/lib/types";

const Recommended = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);

  const [preferredCuisine, setPreferredCuisine] = useState("pugliese");
  const [preferredPrice, setPreferredPrice] = useState("€€");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { location, isLoading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();
  const { favorites } = useFavorites();

  // Hook Firebase per ottenere i ristoranti
  const { getAllRestaurants } = useRestaurants();

  // Calcola la distanza tra due punti usando la formula di Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raggio della Terra in chilometri
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distanza in chilometri
    return d;
  };

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setRestaurantsLoading(true);
        setRestaurantsError(null);
        
        const data = await getAllRestaurants();
        setRestaurants(data);
      } catch (error) {
        const errorMessage = formatServiceError(error);
        setRestaurantsError(errorMessage);
        logError('Caricamento ristoranti in Recommended', error);
      } finally {
        setRestaurantsLoading(false);
      }
    };

    loadRestaurants();
  }, []); // ✅ Array vuoto - esegui solo al mount

  const getRecommendations = () => {
    if (!restaurants.length) return [];

    let scored = restaurants.map(restaurant => {
      let score = 0;
      
      // Punteggio preferenza cucina (35% peso)
      if (restaurant.cuisines.find(x => x === preferredCuisine)) {
        score += 35;
      }
      
      // Punteggio preferenza prezzo (20% peso)
      if (restaurant.priceRange === preferredPrice) {
        score += 20;
      }
      
      // Punteggio rating (25% peso)
      const ratingScore = (parseFloat(restaurant.rating) / 5) * 25;
      score += ratingScore;
      
      // Bonus per ristoranti nei preferiti (10% peso)
      if (favorites.includes(restaurant.id)) {
        score += 10;
      }
      
      // Punteggio distanza (10% peso) - solo se la posizione è disponibile
      let distance = null;
      if (location && restaurant.latitude && restaurant.longitude) {
        distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(restaurant.latitude), 
          parseFloat(restaurant.longitude)
        );
        // Ristoranti più vicini ottengono punteggi più alti (max 10 punti per < 1km)
        const distanceScore = Math.max(0, 10 - (distance / 2));
        score += distanceScore;
      }
      
      return { ...restaurant, score, distance };
    });

    return scored.sort((a, b) => b.score - a.score);
  };

  const recommendations = getRecommendations();
  const topRecommendation = recommendations[0];
  const otherRecommendations = recommendations.slice(1, 4);

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
    return `${minutes} min a piedi`;
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
    { value: "€", label: "€ - Economico" },
    { value: "€€", label: "€€ - Moderato" },
    { value: "€€€", label: "€€€ - Costoso" },
    { value: "€€€€", label: "€€€€ - Fine Dining" },
  ];

  // Stato di caricamento
  if (restaurantsLoading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
              Consigliati per te
            </h2>
            <p className="text-lg text-[hsl(var(--dark-slate))]/70">
              Basato sulla tua posizione e preferenze
            </p>
          </div>
          
          {/* Loading State */}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--terracotta))] mx-auto mb-4"></div>
              <p className="text-[hsl(var(--dark-slate))]/70">
                Caricamento dei consigli personalizzati...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Gestione errori
  if (restaurantsError) {
    return (
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
              Consigliati per te
            </h2>
          </div>
          
          {/* Error State */}
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-red-500 mb-4">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                Errore nel caricamento
              </h3>
              <p className="text-[hsl(var(--dark-slate))]/70 mb-6">
                {restaurantsError}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
              >
                Riprova
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Consigliati per te
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Basato sulla tua posizione e preferenze
          </p>
        </div>

        {/* Stato della posizione */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-[hsl(var(--terracotta))] mr-3" />
                <div>
                  <h3 className="font-semibold text-[hsl(var(--dark-slate))]">La tua posizione</h3>
                  <p className="text-[hsl(var(--dark-slate))]/70">
                    {locationLoading 
                      ? "Rilevamento posizione..." 
                      : location 
                      ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
                      : locationError
                      ? "Impossibile rilevare la posizione"
                      : "Clicca per rilevare la tua posizione"
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
                {locationLoading ? "Rilevamento..." : "Rileva posizione"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selezione preferenze */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Le tue preferenze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--dark-slate))] mb-2">
                  Cucina preferita
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
                  Fascia di prezzo
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
            
            {/* Info sui filtri attivi */}
            <div className="mt-4 p-3 bg-[hsl(var(--terracotta))]/5 rounded-lg">
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-[hsl(var(--terracotta))] mr-2" />
                <span className="text-[hsl(var(--dark-slate))]/70">
                  Consigli basati su: cucina {preferredCuisine}, fascia {preferredPrice}
                  {location && ", distanza dalla tua posizione"}
                  {favorites.length > 0 && `, ${favorites.length} preferiti`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ristoranti consigliati */}
        <div className="space-y-6">
          {/* Consiglio principale */}
          {topRecommendation && (
            <div className="bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--saddle))] rounded-xl text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[hsl(var(--goldenrod))] text-[hsl(var(--dark-slate))] px-3 py-1 rounded-bl-lg font-bold text-sm">
                #1 SCELTA
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
                    Perfetta corrispondenza per gli amanti della cucina {preferredCuisine}
                    {topRecommendation.distance && ` • Solo ${formatDistance(topRecommendation.distance)} di distanza`}
                    {favorites.includes(topRecommendation.id) && " • ❤️ Nei tuoi preferiti"}
                  </p>
                  <div className="flex items-center justify-center md:justify-start space-x-4 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-[hsl(var(--goldenrod))] mr-1 fill-current" />
                      <span>{topRecommendation.rating}</span>
                    </div>
                    <span>{topRecommendation.priceRange}</span>
                    {topRecommendation.distance && (
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {getWalkingTime(topRecommendation.distance)}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedRestaurant(topRecommendation);
                      setIsModalOpen(true);
                    }}
                    className="bg-white text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--warm-beige))] font-semibold"
                  >
                    Visualizza ristorante
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Altri consigli */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {otherRecommendations.map((restaurant, index) => (
              <Card key={restaurant.id} className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] px-2 py-1 rounded-full text-sm font-medium">
                      #{index + 2}
                    </span>
                    <div className="text-right text-sm text-[hsl(var(--dark-slate))]/60">
                      {restaurant.distance && (
                        <div>{formatDistance(restaurant.distance)} di distanza</div>
                      )}
                      {favorites.includes(restaurant.id) && (
                        <div className="text-[hsl(var(--tomato))]">❤️ Preferito</div>
                      )}
                    </div>
                  </div>
                  
                  <img
                    src={restaurant.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
                    alt={restaurant.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  
                  <h4 className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                    {restaurant.name}
                  </h4>
                  
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
                      Dettagli
                    </Button>
                  </div>
                  
                  {/* Motivo del consiglio */}
                  <div className="mt-3 text-xs text-[hsl(var(--dark-slate))]/50">
                    {restaurant.cuisines.find(x => x === preferredCuisine) && restaurant.priceRange === preferredPrice
                      ? "✨ Corrisponde perfettamente alle tue preferenze"
                      : restaurant.cuisines.find(x => x === preferredCuisine)
                      ? "🍽️ Cucina preferita"
                      : restaurant.priceRange === preferredPrice
                      ? "💰 Fascia di prezzo preferita"
                      : "⭐ Alto rating"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stato vuoto */}
        {recommendations.length === 0 && (
          <div className="text-center py-12">
            <Card>
              <CardContent className="p-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                  Nessun consiglio disponibile
                </h3>
                <p className="text-[hsl(var(--dark-slate))]/70">
                  Prova ad aggiustare le tue preferenze o controlla più tardi
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal del ristorante */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};

export default Recommended;