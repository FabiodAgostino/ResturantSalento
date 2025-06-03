import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface UseFavoritesReturn {
  favorites: number[];
  addFavorite: (restaurantId: number) => Promise<void>;
  removeFavorite: (restaurantId: number) => Promise<void>;
  toggleFavorite: (restaurantId: number) => Promise<void>;
  isFavorite: (restaurantId: number) => boolean;
  clearFavorites: () => void;
  isLoading: boolean;
  error: string | null;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Carica i favoriti dai dati esistenti dei ristoranti
  useEffect(() => {
    const loadFavoritesFromRestaurants = () => {
      try {
        // Prende i dati dei ristoranti dalla cache di React Query
        const restaurantsData = queryClient.getQueryData<any[]>(["/api/restaurants"]);
        
        if (restaurantsData) {
          const favoriteIds = restaurantsData
            .filter(restaurant => restaurant.favorite === true)
            .map(restaurant => restaurant.id);
          
          setFavorites(favoriteIds);
        }
      } catch (error) {
        console.error("Errore nel caricamento dei favoriti:", error);
      }
    };

    loadFavoritesFromRestaurants();
  }, [queryClient]);

  // Aggiorna il campo favorite del ristorante su Firestore
  const updateRestaurantFavorite = useCallback(async (restaurantId: number, isFavorite: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      // Chiamata API per aggiornare il ristorante
      await apiRequest("PUT", `/api/restaurants/${restaurantId}`, {
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

      // Invalida e ricarica la cache dei ristoranti
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      
    } catch (error) {
      console.error("Errore nell'aggiornamento del favorito:", error);
      setError("Errore nell'aggiornamento del favorito");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

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

  const clearFavorites = useCallback(() => {
    // Per cancellare tutti i favoriti, dovremmo iterare su tutti i ristoranti
    // È meglio implementare un endpoint specifico per questo
    console.warn("clearFavorites non implementato per Firestore. Implementa un endpoint dedicato.");
  }, []);

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