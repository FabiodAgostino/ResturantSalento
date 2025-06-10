import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, DollarSign, Star, Calendar, Heart, Globe, Trash2, Euro, TrendingUp, Award } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { useFavorites } from "@/hooks/use-favorites";
import BookingModal from "@/components/BookingModal";
import { useState, useCallback } from "react";
import { getCuisineColor } from "@/utils/UtilsMethods";
import { useRestaurants } from "../../services/restaurant-service";

interface RestaurantModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onBookVisit?: (restaurant: Restaurant) => void;
  onDelete?: (restaurantId: number) => void; // Callback per gestire l'eliminazione
  allowDelete?: boolean; // Flag per mostrare/nascondere il bottone elimina
}

const RestaurantModal = ({ 
  restaurant, 
  isOpen, 
  onClose, 
  onBookVisit,
  onDelete,
  allowDelete = true 
}: RestaurantModalProps) => {
  const { favorites, toggleFavorite } = useFavorites();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBookVisit = () => {
    setIsBookingModalOpen(true);
  };

  const handleBookingClose = () => {
    setIsBookingModalOpen(false);
    onClose(); // Chiude anche il RestaurantModal
  };

  // ✅ Gestisce l'eliminazione del ristorante
  const handleDeleteClick = useCallback(async () => {
    if (!restaurant) return;
    
    // Conferma eliminazione
    if (!window.confirm(`Sei sicuro di voler eliminare "${restaurant.name}"?`)) {
      return;
    }
    setIsDeleting(true);
    
    try {
      if (onDelete) {
        onDelete(restaurant.id);
      }
      
      // Chiude il modal dopo l'eliminazione
      onClose();
    } catch (error) {
      console.error('Errore nell\'eliminazione del ristorante:', error);
      
    } finally {
      setIsDeleting(false);
    }
  }, [restaurant, onDelete, onClose]);

  if (!restaurant) return null;
  
  const isFavorite = favorites.includes(restaurant.id);

  const handleFavoriteClick = () => {
    toggleFavorite(restaurant.id);
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

  // ✅ Render stelle per valutazioni utente
  const renderUserStars = (rating: number | undefined) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex text-[hsl(var(--terracotta))]">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars 
                ? "fill-current" 
                : i === fullStars && hasHalfStar 
                ? "fill-current opacity-50" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // ✅ Controlla se ci sono valutazioni utente
  const hasUserRatings = restaurant.locationUser || restaurant.qualitàPrezzoUser || restaurant.mediaPrezzo;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-display font-bold text-[hsl(var(--dark-slate))] mb-2">
                  {restaurant.name}
                </DialogTitle>
                {/* ✅ Badge valutazioni utente se presenti */}
                {hasUserRatings && (
                  <Badge className="bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] border-[hsl(var(--terracotta))]/20">
                    <Award className="w-3 h-3 mr-1" />
                    Valutato dalla community
                  </Badge>
                )}
              </div>
              {allowDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  title="Elimina ristorante"
                >
                  <Trash2 className={`w-5 h-5 ${isDeleting ? 'animate-pulse' : ''}`} />
                </Button>
              )}
            </div>
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

            {/* ✅ Sezione Valutazioni Utente */}
            {hasUserRatings && (
              <div className="bg-gradient-to-r from-[hsl(var(--terracotta))]/5 to-[hsl(var(--saddle))]/5 rounded-lg p-6 border border-[hsl(var(--terracotta))]/20">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 text-[hsl(var(--terracotta))] mr-2" />
                  <h4 className="text-lg font-semibold text-[hsl(var(--dark-slate))]">
                    Valutazioni della Community
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Rating Posizione */}
                  {restaurant.locationUser && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <MapPin className="w-5 h-5 text-[hsl(var(--terracotta))] mr-2" />
                        <span className="font-medium text-[hsl(var(--dark-slate))]">Posizione</span>
                      </div>
                      <div className="flex justify-center mb-1">
                        {renderUserStars(restaurant.locationUser)}
                      </div>
                      <div className="text-2xl font-bold text-[hsl(var(--terracotta))] mb-1">
                        {restaurant.locationUser.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Accessibilità, parcheggio, zona
                      </div>
                    </div>
                  )}
                  
                  {/* Rating Qualità/Prezzo */}
                  {restaurant.qualitàPrezzoUser && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Star className="w-5 h-5 text-[hsl(var(--terracotta))] mr-2" />
                        <span className="font-medium text-[hsl(var(--dark-slate))]">Qualità/Prezzo</span>
                      </div>
                      <div className="flex justify-center mb-1">
                        {renderUserStars(restaurant.qualitàPrezzoUser)}
                      </div>
                      <div className="text-2xl font-bold text-[hsl(var(--terracotta))] mb-1">
                        {restaurant.qualitàPrezzoUser.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Rapporto qualità vs prezzo
                      </div>
                    </div>
                  )}
                  
                  {/* Prezzo Medio */}
                  {restaurant.mediaPrezzo && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Euro className="w-5 h-5 text-[hsl(var(--terracotta))] mr-2" />
                        <span className="font-medium text-[hsl(var(--dark-slate))]">Prezzo Medio</span>
                      </div>
                      <div className="text-2xl font-bold text-[hsl(var(--terracotta))] mb-1">
                        €{restaurant.mediaPrezzo.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">
                        Per persona (secondo la community)
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600 italic">
                    Valutazioni basate sull'esperienza della community di utenti
                  </p>
                </div>
              </div>
            )}

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
                    {/* ✅ Mostra prezzo medio accanto alla fascia di prezzo */}
                    {restaurant.mediaPrezzo && (
                      <span className="text-[hsl(var(--dark-slate))]/60 ml-2">
                        (Media: €{restaurant.mediaPrezzo.toFixed(2)})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center">
                    {renderStars(restaurant.rating)}
                    <span className="ml-2 text-[hsl(var(--dark-slate))] font-medium">{restaurant.rating}</span>
                    <span className="text-[hsl(var(--dark-slate))]/50 ml-2">TripAdvisor</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-[hsl(var(--dark-slate))] mb-4">Cucine e Specialità</h4>
                <div className="flex flex-wrap gap-2 mb-6">
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

                {/* ✅ Sezione riassuntiva se ci sono valutazioni utente */}
                {hasUserRatings && (
                  <div className="bg-white border border-[hsl(var(--terracotta))]/20 rounded-lg p-4">
                    <h5 className="font-medium text-[hsl(var(--dark-slate))] mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-[hsl(var(--terracotta))]" />
                      Highlights Community
                    </h5>
                    <div className="space-y-2 text-sm">
                      {restaurant.locationUser && (
                        <div className="flex justify-between items-center">
                          <span className="text-[hsl(var(--dark-slate))]/70">Posizione</span>
                          <div className="flex items-center">
                            <span className="font-medium text-[hsl(var(--terracotta))] mr-1">
                              {restaurant.locationUser.toFixed(1)}
                            </span>
                            <Star className="w-3 h-3 text-[hsl(var(--terracotta))]" />
                          </div>
                        </div>
                      )}
                      
                      {restaurant.qualitàPrezzoUser && (
                        <div className="flex justify-between items-center">
                          <span className="text-[hsl(var(--dark-slate))]/70">Qualità/Prezzo</span>
                          <div className="flex items-center">
                            <span className="font-medium text-[hsl(var(--terracotta))] mr-1">
                              {restaurant.qualitàPrezzoUser.toFixed(1)}
                            </span>
                            <Star className="w-3 h-3 text-[hsl(var(--terracotta))]" />
                          </div>
                        </div>
                      )}
                      
                      {restaurant.mediaPrezzo && (
                        <div className="flex justify-between items-center">
                          <span className="text-[hsl(var(--dark-slate))]/70">Prezzo Tipico</span>
                          <div className="flex items-center">
                            <Euro className="w-3 h-3 text-[hsl(var(--terracotta))] mr-1" />
                            <span className="font-medium text-[hsl(var(--terracotta))]">
                              {restaurant.mediaPrezzo.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                className="flex-1 bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))] transition-colors font-medium"
                onClick={handleBookVisit} 
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

      <BookingModal
        restaurant={restaurant}
        isOpen={isBookingModalOpen}
        onClose={handleBookingClose} 
      />
    </>
  );
};

export default RestaurantModal;