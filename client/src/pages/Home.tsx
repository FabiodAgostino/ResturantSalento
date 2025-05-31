import { useState, useMemo } from "react";
import { useRestaurants } from "@/hooks/use-firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3X3, Map } from "lucide-react";
import RestaurantCard from "@/components/RestaurantCard";
import RestaurantModal from "@/components/RestaurantModal";
import InteractiveMap from "@/components/InteractiveMap";
import type { Restaurant } from "@/lib/types";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

const { restaurants, loading: isLoading, searchRestaurants } = useRestaurants();

const handleSearch = () => {
  searchRestaurants({
    search: searchTerm,
    cuisine: selectedCuisine === "all" ? undefined : selectedCuisine,
    priceRange: selectedPrice === "all" ? undefined : selectedPrice,
    minRating: selectedRating === "all" ? undefined : parseFloat(selectedRating)
  });
};
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
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

  const cuisineOptions = [
    { value: "italiana", label: "Italiana" },
    { value: "mediterranea", label: "Mediterranea" },
    { value: "pesce", label: "Pesce" },
    { value: "barbecue", label: "Barbecue" },
    { value: "steakhouse", label: "Steakhouse" },
    { value: "pugliese", label: "Pugliese" },
  ];

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
            Discover Salento's Culinary Treasures
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70 max-w-2xl mx-auto">
            Explore authentic restaurants in the heart of Puglia, from traditional trattorias to modern culinary experiences.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Cuisine Filter */}
            <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
              <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                <SelectValue placeholder="All Cuisines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisines</SelectItem>
                {cuisineOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Filter */}
            <Select value={selectedPrice} onValueChange={setSelectedPrice}>
              <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                {priceOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rating Filter */}
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="py-3 border-gray-200 focus:ring-2 focus:ring-[hsl(var(--terracotta))]">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex justify-between items-center mt-4">
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
            <span className="text-[hsl(var(--dark-slate))]/70">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            </span>
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
                No restaurants found
              </h3>
              <p className="text-[hsl(var(--dark-slate))]/70 mb-6">
                Try adjusting your search criteria or filters
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCuisine("all");
                  setSelectedPrice("all");
                  setSelectedRating("all");
                }}
                className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
              >
                Clear Filters
              </Button>
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
