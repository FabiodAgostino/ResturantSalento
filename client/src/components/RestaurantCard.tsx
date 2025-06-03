// client/src/components/RestaurantCard.tsx - Aggiornato per multiple cuisines
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { useFavorites } from "@/hooks/use-favorites";
import { getCuisineLabel } from "@/lib/types";
import { getRestaurantPlaceholder, isValidImageUrl } from "@/utils/TripAdvisorImageExtractor";
import { useState } from "react";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewDetails: (restaurant: Restaurant) => void;
}

const RestaurantCard = ({ restaurant, onViewDetails }: RestaurantCardProps) => {
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites.includes(restaurant.id.toString());

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(restaurant.id.toString());
  };
  const [imageUrl, setImageUrl] = useState(
    restaurant.imageUrl && isValidImageUrl(restaurant.imageUrl) 
      ? restaurant.imageUrl 
      : getRestaurantPlaceholder(restaurant.cuisines[0])
  );
  const [imageError, setImageError] = useState(false);

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

  // Gestisce sia array che string (per backward compatibility)
  const cuisines = Array.isArray(restaurant.cuisines) 
    ? restaurant.cuisines 
    : [restaurant.cuisines];

  return (
    <Card className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <div className="relative">
        <img
          src={restaurant.imageUrl || undefined}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 ${
            isFavorite 
              ? "text-[hsl(var(--tomato))] hover:text-red-600" 
              : "text-gray-400 hover:text-[hsl(var(--tomato))]"
          } bg-white/80 hover:bg-white/90`}
          onClick={handleFavoriteClick}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
        </Button>
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
            {restaurant.name}
          </h3>
        </div>
        
        <div className="flex items-center mb-3">
          {renderStars(restaurant.rating)}
          <span className="text-[hsl(var(--dark-slate))] font-medium ml-2">
            {restaurant.rating}
          </span>
          <span className="text-[hsl(var(--dark-slate))]/50 mx-2">•</span>
          <span className="text-[hsl(var(--terracotta))] font-medium">
            {restaurant.priceRange}
          </span>
        </div>
        
        <p className="text-[hsl(var(--dark-slate))]/70 mb-3 line-clamp-2">
          {restaurant.description}
        </p>
        
        {/* AGGIORNATO: Mostra multiple cuisine tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {cuisines.slice(0, 3).map((cuisine, index) => (
            <Badge key={index} className={getCuisineColor(cuisine)}>
              {getCuisineLabel(cuisine)}
            </Badge>
          ))}
          {cuisines.length > 3 && (
            <Badge className="bg-gray-100 text-gray-700">
              +{cuisines.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center text-[hsl(var(--dark-slate))]/60 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{restaurant.location}</span>
          </div>
          <Button
            className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))] transition-colors text-sm font-medium"
            onClick={() => onViewDetails(restaurant)}
          >
            Dettagli
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;