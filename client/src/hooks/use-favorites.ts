import { useState, useEffect, useCallback } from "react";

const FAVORITES_STORAGE_KEY = "salento-favorites";

interface UseFavoritesReturn {
  favorites: number[];
  addFavorite: (restaurantId: number) => void;
  removeFavorite: (restaurantId: number) => void;
  toggleFavorite: (restaurantId: number) => void;
  isFavorite: (restaurantId: number) => boolean;
  clearFavorites: () => void;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<number[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to load favorites from localStorage:", error);
        // Clear corrupted data
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error);
    }
  }, [favorites]);

  const addFavorite = useCallback((restaurantId: number) => {
    setFavorites(prev => {
      if (prev.includes(restaurantId)) {
        return prev; // Already in favorites
      }
      return [...prev, restaurantId];
    });
  }, []);

  const removeFavorite = useCallback((restaurantId: number) => {
    setFavorites(prev => prev.filter(id => id !== restaurantId));
  }, []);

  const toggleFavorite = useCallback((restaurantId: number) => {
    setFavorites(prev => {
      if (prev.includes(restaurantId)) {
        return prev.filter(id => id !== restaurantId);
      } else {
        return [...prev, restaurantId];
      }
    });
  }, []);

  const isFavorite = useCallback((restaurantId: number) => {
    return favorites.includes(restaurantId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites
  };
};
