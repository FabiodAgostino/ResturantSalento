// client/src/pages/Home.tsx - Fix per filtri cuisines
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, Map } from "lucide-react";
import RestaurantCard from "@/components/RestaurantCard";
import RestaurantModal from "@/components/RestaurantModal";
import InteractiveMap from "@/components/InteractiveMap";
import CuisineTagSelector from "@/components/CuisineTagSelector";
import type { Restaurant } from "@/lib/types";
import { normalizeCuisines } from "@/lib/types";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: restaurants = [], isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Normalizza cuisines del ristorante e controlla match
      const restaurantCuisines = normalizeCuisines(restaurant.cuisines);
      const matchesCuisines = selectedCuisines.length === 0 ||
        selectedCuisines.some(selectedCuisine => 
          restaurantCuisines.includes(selectedCuisine)
        );
      
      const matchesPrice = selectedPrice === "all" || restaurant.priceRange === selectedPrice;
      const matchesRating = selectedRating === "all" || parseFloat(restaurant.rating) >= parseFloat(selectedRating);

      return matchesSearch && matchesCuisines && matchesPrice && matchesRating;
    });
  }, [restaurants, searchTerm, selectedCuisines, selectedPrice, selectedRating]);

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCuisines([]);
    setSelectedPrice("all");
    setSelectedRating("all");
  };

  const priceOptions = [
    { value: "€", label: "€ - Budget" },
    { value: "€€", label: "€€ - Moderate" },
    { value: "€€€", label: "€€€ - Expensive" },
    { value: "€€€€", label: "€€€€ - Fine Dining" },
  ];

  const ratingOptions = [
    { value: "4.5", label: "4.5+ Stars" },
    { value: "4.0", label: "4.0+ Stars" },
    { value: "3.5", label: "3.5+ Stars" },
    { value: "3.0", label: "3.0+ Stars" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--terracotta))]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Lu mare, lu sole, lu spinning
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70 max-w-2xl mx-auto">
            Esplora i ristoranti autentici nel cuore della Puglia, dalle trattorie tradizionali alle esperienze culinarie moderne.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--dark-slate))]/50 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))] focus:border-transparent"
              />
            </div>

            {/* Cuisine Filter con Tag Selector */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--dark-slate))] mb-2">
                Tipi di Cucina
              </label>
              <CuisineTagSelector
                selectedCuisines={selectedCuisines}
                onCuisinesChange={setSelectedCuisines}
                placeholder="Filtra per tipo di cucina..."
              />
            </div>

            {/* Price and Rating Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--dark-slate))] mb-2">
                  Fascia di Prezzo
                </label>
                <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                  <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                    <SelectValue placeholder="Tutte le fasce" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le fasce</SelectItem>
                    {priceOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--dark-slate))] mb-2">
                  Rating Minimo
                </label>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                    <SelectValue placeholder="Tutti i rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i rating</SelectItem>
                    {ratingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* View Toggle and Results Count */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="flex space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-[hsl(var(--terracotta))] text-white" : ""}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
                className={viewMode === "map" ? "bg-[hsl(var(--terracotta))] text-white" : ""}
              >
                <Map className="w-4 h-4 mr-2" />
                Map
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-[hsl(var(--dark-slate))]/70">
                {filteredRestaurants.length} ristorante{filteredRestaurants.length !== 1 ? 'i' : ''} trovato{filteredRestaurants.length !== 1 ? 'i' : ''}
              </span>
              
              {/* Clear Filters Button */}
              {(searchTerm || selectedCuisines.length > 0 || selectedPrice !== "all" || selectedRating !== "all") && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="text-[hsl(var(--terracotta))] border-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] hover:text-white"
                >
                  Cancella Filtri
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Map View */}
        {viewMode === "map" && (
          <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
            <InteractiveMap
              restaurants={filteredRestaurants}
              onRestaurantClick={handleViewDetails}
            />
          </div>
        )}

        {/* Restaurant Grid */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                Nessun ristorante trovato
              </h3>
              <p className="text-[hsl(var(--dark-slate))]/70 mb-6">
                Prova a modificare i criteri di ricerca o i filtri
              </p>
              <Button
                onClick={clearFilters}
                className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
              >
                Cancella Filtri
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(searchTerm || selectedCuisines.length > 0 || selectedPrice !== "all" || selectedRating !== "all") && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Filtri Attivi:</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Ricerca: "{searchTerm}"
                </span>
              )}
              {selectedCuisines.length > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Cucine: {selectedCuisines.join(", ")}
                </span>
              )}
              {selectedPrice !== "all" && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Prezzo: {selectedPrice}
                </span>
              )}
              {selectedRating !== "all" && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Rating: {selectedRating}+ stelle
                </span>
              )}
            </div>
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

export default Home;