import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, Map, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RestaurantCard from "@/components/RestaurantCard";
import RestaurantModal from "@/components/RestaurantModal";
import InteractiveMap from "@/components/InteractiveMap";
import type { Restaurant } from "@/lib/types";
import { RestaurantService } from "@/lib/restaurant-service";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { 
    data: restaurants = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    queryFn: RestaurantService.getAllRestaurants,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    
    return restaurants.filter(restaurant => {
      // Filtra solo ristoranti approvati
      if (!restaurant.isApproved) return false;
      
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCuisine = selectedCuisine === "all" || restaurant.cuisine === selectedCuisine;
      const matchesPrice = selectedPrice === "all" || restaurant.priceRange === selectedPrice;
      const matchesRating = selectedRating === "all" || parseFloat(restaurant.rating) >= parseFloat(selectedRating);

      return matchesSearch && matchesCuisine && matchesPrice && matchesRating;
    });
  }, [restaurants, searchTerm, selectedCuisine, selectedPrice, selectedRating]);

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCuisine("all");
    setSelectedPrice("all");
    setSelectedRating("all");
  };

  const cuisineOptions = [
    { value: "italiana", label: "Italiana" },
    { value: "mediterranea", label: "Mediterranea" },
    { value: "pesce", label: "Pesce" },
    { value: "barbecue", label: "Barbecue" },
    { value: "steakhouse", label: "Steakhouse" },
    { value: "pugliese", label: "Pugliese" },
  ];

  const priceOptions = [
    { value: "€", label: "€ - Economico" },
    { value: "€€", label: "€€ - Moderato" },
    { value: "€€€", label: "€€€ - Costoso" },
    { value: "€€€€", label: "€€€€ - Fine Dining" },
  ];

  const ratingOptions = [
    { value: "4.5", label: "4.5+ Stelle" },
    { value: "4.0", label: "4.0+ Stelle" },
    { value: "3.5", label: "3.5+ Stelle" },
    { value: "3.0", label: "3.0+ Stelle" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--terracotta))] mx-auto mb-4"></div>
          <p className="text-[hsl(var(--dark-slate))]">Caricamento ristoranti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Errore nel caricamento dei ristoranti.</p>
              <Button 
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Riprova
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sezione Hero */}
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Scopri i Tesori Culinari del Salento
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70 max-w-2xl mx-auto">
            Esplora ristoranti autentici nel cuore della Puglia, dalle tradizionali trattorie alle moderne esperienze culinarie.
          </p>
        </div>

        {/* Ricerca e Filtri */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Campo Ricerca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--dark-slate))]/50 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cerca ristoranti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))] focus:border-transparent"
              />
            </div>

            {/* Filtro Cucina */}
            <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
              <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                <SelectValue placeholder="Tutte le Cucine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le Cucine</SelectItem>
                {cuisineOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Prezzo */}
            <Select value={selectedPrice} onValueChange={setSelectedPrice}>
              <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                <SelectValue placeholder="Tutti i Prezzi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Prezzi</SelectItem>
                {priceOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Rating */}
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                <SelectValue placeholder="Tutti i Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Rating</SelectItem>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Vista */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-[hsl(var(--terracotta))] text-white" : ""}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Griglia
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
                className={viewMode === "map" ? "bg-[hsl(var(--terracotta))] text-white" : ""}
              >
                <Map className="w-4 h-4 mr-2" />
                Mappa
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-[hsl(var(--dark-slate))]/70">
                {filteredRestaurants.length} ristorante{filteredRestaurants.length !== 1 ? 'i' : ''} trovato
              </span>
              {(searchTerm || selectedCuisine !== "all" || selectedPrice !== "all" || selectedRating !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-[hsl(var(--terracotta))] hover:text-[hsl(var(--saddle))]"
                >
                  Pulisci Filtri
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Vista Mappa */}
        {viewMode === "map" && (
          <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
            <InteractiveMap
              restaurants={filteredRestaurants}
              onRestaurantClick={handleViewDetails}
            />
          </div>
        )}

        {/* Griglia Ristoranti */}
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

        {/* Stato Vuoto */}
        {filteredRestaurants.length === 0 && !isLoading && (
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
                onClick={handleClearFilters}
                className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
              >
                Pulisci Filtri
              </Button>
            </div>
          </div>
        )}

        {/* Statistiche */}
        {restaurants.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--terracotta))]">
                  {restaurants.length}
                </div>
                <div className="text-sm text-[hsl(var(--dark-slate))]/70">
                  Ristoranti Totali
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--forest-green))]">
                  {cuisineOptions.length}
                </div>
                <div className="text-sm text-[hsl(var(--dark-slate))]/70">
                  Tipi di Cucina
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--goldenrod))]">
                  {(restaurants.reduce((sum, r) => sum + parseFloat(r.rating), 0) / restaurants.length).toFixed(1)}
                </div>
                <div className="text-sm text-[hsl(var(--dark-slate))]/70">
                  Rating Medio
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--tomato))]">
                  {restaurants.filter(r => parseFloat(r.rating) >= 4.5).length}
                </div>
                <div className="text-sm text-[hsl(var(--dark-slate))]/70">
                  Eccellenti (4.5+)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ristorante */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};

export default Home;