import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import RestaurantCard from "@/components/RestaurantCard";
import RestaurantModal from "@/components/RestaurantModal";
import { useFavorites } from "@/hooks/use-favorites";
import { useState } from "react";
import type { Restaurant } from "@/lib/types";

const Favorites = () => {
  const { favorites } = useFavorites();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const favoriteRestaurants = restaurants.filter(restaurant => 
    favorites.includes(restaurant.id)
  );

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Your Favorite Restaurants
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Your curated list of must-visit places
          </p>
        </div>

        {favoriteRestaurants.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Card>
              <CardContent className="p-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                  No Favorites Yet
                </h3>
                <p className="text-[hsl(var(--dark-slate))]/70 mb-6">
                  Start exploring restaurants and add them to your favorites!
                </p>
                <Link href="/">
                  <Button className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]">
                    Explore Restaurants
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Favorites Grid */
          <div>
            {/* Favorites Count */}
            <div className="mb-6">
              <p className="text-[hsl(var(--dark-slate))]/70">
                {favoriteRestaurants.length} favorite restaurant{favoriteRestaurants.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Restaurants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRestaurants.map(restaurant => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Tips */}
            <Card className="mt-8 bg-[hsl(var(--terracotta))]/5 border-[hsl(var(--terracotta))]/20">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <Heart className="w-6 h-6 text-[hsl(var(--terracotta))] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--dark-slate))] mb-2">
                      Pro Tips for Your Favorites
                    </h3>
                    <ul className="text-[hsl(var(--dark-slate))]/70 space-y-1 text-sm">
                      <li>• Click the heart icon on any restaurant card to add it to favorites</li>
                      <li>• Your favorites are saved locally and will persist between visits</li>
                      <li>• Use the calendar to plan visits to your favorite restaurants</li>
                      <li>• Share your favorite restaurants with friends and family</li>
                    </ul>
                  </div>
                </div>
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

export default Favorites;
