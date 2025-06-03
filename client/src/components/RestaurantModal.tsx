import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, DollarSign, Star, Calendar, ArrowRight, Heart, Globe } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { useFavorites } from "@/hooks/use-favorites";

interface RestaurantModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onBookVisit?: (restaurant: Restaurant) => void;
}

const RestaurantModal = ({ restaurant, isOpen, onClose, onBookVisit }: RestaurantModalProps) => {
  const { favorites, toggleFavorite } = useFavorites();

  if (!restaurant) return null;

  const isFavorite = favorites.includes(restaurant.id.toString());

  const handleFavoriteClick = () => {
    toggleFavorite(restaurant.id.toString());
  };
 const getCuisineColor = (cuisine: string) => {
    const colors: Record<string, string> = {
      pugliese: "bg-[hsl(var(--forest-green))]/10 text-[hsl(var(--forest-green))]",
      italiana: "bg-[hsl(var(--olive-drab))]/10 text-[hsl(var(--olive-drab))]",
      pesce: "bg-blue-100 text-blue-700",
      barbecue: "bg-red-100 text-red-700",
      steakhouse: "bg-gray-100 text-gray-700",
      mediterranea: "bg-[hsl(var(--olive-drab))]/10 text-[hsl(var(--olive-drab))]",
    };
    return colors[cuisine] || "bg-gray-100 text-gray-700";
  };
  const handleGetDirections = () => {
    if (restaurant.latitude && restaurant.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
      window.open(url, '_blank');
    }
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex text-[hsl(var(--goldenrod))]">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars 
                ? "fill-current" 
                : i === fullStars && hasHalfStar 
                ? "fill-current opacity-50" 
                : ""
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-[hsl(var(--dark-slate))]">
            {restaurant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Restaurant Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src={restaurant.imageUrl || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"}
              alt={restaurant.name}
              className="w-full h-64 object-cover rounded-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
              alt="Chef preparing food"
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>

          {/* Restaurant Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-[hsl(var(--dark-slate))] mb-4">Dettaglio</h4>
              <p className="text-[hsl(var(--dark-slate))]/70 mb-4">
                {restaurant.description || "Experience authentic cuisine in a warm, family-friendly atmosphere. Our restaurant has been serving traditional recipes using only the finest local ingredients."}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-[hsl(var(--terracotta))] mr-3" />
                  <span className="text-[hsl(var(--dark-slate))]">{restaurant.address || restaurant.location}</span>
                </div>
                
                {restaurant.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-[hsl(var(--terracotta))] mr-3" />
                    <span className="text-[hsl(var(--dark-slate))]">{restaurant.phone}</span>
                  </div>
                )}
                
                {restaurant.hours && (
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-[hsl(var(--terracotta))] mr-3" />
                    <span className="text-[hsl(var(--dark-slate))]">{restaurant.hours}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-[hsl(var(--terracotta))] mr-3" />
                  <span className="text-[hsl(var(--dark-slate))]">{restaurant.priceRange}</span>
                </div>

                <div className="flex items-center">
                  {renderStars(restaurant.rating)}
                  <span className="ml-2 text-[hsl(var(--dark-slate))] font-medium">{restaurant.rating}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="mt-4">
  <div className="flex flex-wrap gap-2">
    {restaurant.cuisines?.map((cuisine, index) => (
      <Badge 
        key={`${cuisine}-${index}`}
        className={getCuisineColor(cuisine)}
      >
        {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
      </Badge>
    )) || (
      <Badge className="bg-gray-100 text-gray-600">
        Cucina non specificata
      </Badge>
    )}
  </div>
</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button
              className="flex-1 bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))] transition-colors font-medium"
              onClick={() => onBookVisit?.(restaurant)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Prenota
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10 transition-colors font-medium"
              onClick={handleGetDirections}
            >
              <Globe className="w-4 h-4 mr-2" />
              Ottieni Indicazioni
           </Button>
            
            <Button
              variant="outline"
              className={`border-gray-300 hover:bg-gray-50 transition-colors font-medium ${
                isFavorite ? "text-[hsl(var(--tomato))]" : "text-[hsl(var(--dark-slate))]"
              }`}
              onClick={handleFavoriteClick}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantModal;
