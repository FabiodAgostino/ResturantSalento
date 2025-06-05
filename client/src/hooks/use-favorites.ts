import { useState, useEffect, useCallback } from "react";
import { useRestaurants, formatServiceError, logError } from "../../services/restaurant-service";

interface UseFavoritesReturn {
  favorites: number[];
  addFavorite: (restaurantId: number) => Promise<void>;
  removeFavorite: (restaurantId: number) => Promise<void>;
  toggleFavorite: (restaurantId: number) => Promise<void>;
  isFavorite: (restaurantId: number) => boolean;
  clearFavorites: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook Firebase per gestire i ristoranti
  const { getAllRestaurants, updateRestaurant } = useRestaurants();

  // Carica i favoriti dai dati dei ristoranti
  useEffect(() => {
    const loadFavoritesFromRestaurants = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const restaurantsData = await getAllRestaurants();
        
        if (restaurantsData) {
          const favoriteIds = restaurantsData
            .filter(restaurant => restaurant.favorite === true)
            .map(restaurant => restaurant.id);
          
          setFavorites(favoriteIds);
        }
      } catch (error) {
        const errorMessage = formatServiceError(error);
        setError(errorMessage);
        logError("Caricamento favoriti", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavoritesFromRestaurants();
  }, []); // ✅ Array vuoto - esegui solo al mount

  // Aggiorna il campo favorite del ristorante su Firestore
  const updateRestaurantFavorite = useCallback(async (restaurantId: number, isFavorite: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Chiamata al servizio Firebase per aggiornare il ristorante
      await updateRestaurant(restaurantId, {
        favorite: isFavorite
      });

      // Aggiorna lo stato locale
      setFavorites(prev => {
        if (isFavorite) {
          return prev.includes(restaurantId) ? prev : [...prev, restaurantId];
        } else {
          return prev.filter(id => id !== restaurantId);
        }
      });
      
    } catch (error) {
      const errorMessage = formatServiceError(error);
      setError(errorMessage);
      logError("Aggiornamento favorito", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateRestaurant]);

  const addFavorite = useCallback(async (restaurantId: number) => {
    if (!favorites.includes(restaurantId)) {
      await updateRestaurantFavorite(restaurantId, true);
    }
  }, [favorites, updateRestaurantFavorite]);

  const removeFavorite = useCallback(async (restaurantId: number) => {
    if (favorites.includes(restaurantId)) {
      await updateRestaurantFavorite(restaurantId, false);
    }
  }, [favorites, updateRestaurantFavorite]);

  const toggleFavorite = useCallback(async (restaurantId: number) => {
    const isFavorite = favorites.includes(restaurantId);
    await updateRestaurantFavorite(restaurantId, !isFavorite);
  }, [favorites, updateRestaurantFavorite]);

  const isFavorite = useCallback((restaurantId: number) => {
    return favorites.includes(restaurantId);
  }, [favorites]);

  const clearFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ottieni tutti i ristoranti favoriti
      const restaurantsData = await getAllRestaurants();
      const favoriteRestaurants = restaurantsData.filter(restaurant => restaurant.favorite === true);
      
      // Aggiorna tutti i ristoranti favoriti per rimuovere il flag favorite
      const updatePromises = favoriteRestaurants.map(restaurant => 
        updateRestaurant(restaurant.id, { favorite: false })
      );
      
      await Promise.all(updatePromises);
      
      // Aggiorna lo stato locale
      setFavorites([]);
      
    } catch (error) {
      const errorMessage = formatServiceError(error);
      setError(errorMessage);
      logError("Cancellazione favoriti", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getAllRestaurants, updateRestaurant]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    isLoading,
    error
  };
};