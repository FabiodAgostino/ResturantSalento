import { useState, useEffect, useCallback } from "react";

// Chiave per il localStorage
const FAVORITES_STORAGE_KEY = "salento-favorites";

// Interface per il ritorno del hook
interface UseFavoritesReturn {
  favorites: string[];
  addFavorite: (restaurantId: string) => void;
  removeFavorite: (restaurantId: string) => void;
  toggleFavorite: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  clearFavorites: () => void;
  favoritesCount: number;
  importFavorites: (favoriteIds: string[]) => void;
  exportFavorites: () => string[];
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Carica i preferiti dal localStorage al mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Converte eventuali ID numerici in stringhe per compatibilità Firebase
            const stringIds = parsed.map(id => String(id));
            setFavorites(stringIds);
            
            // Se abbiamo convertito ID numerici, salva la versione aggiornata
            if (parsed.some(id => typeof id === 'number')) {
              localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(stringIds));
            }
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento dei preferiti dal localStorage:", error);
        // Rimuove dati corrotti
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
      }
    };

    loadFavorites();
  }, []);

  // Salva i preferiti nel localStorage ogni volta che cambiano
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Errore nel salvataggio dei preferiti nel localStorage:", error);
    }
  }, [favorites]);

  // Aggiunge un ristorante ai preferiti
  const addFavorite = useCallback((restaurantId: string) => {
    const id = String(restaurantId); // Assicura che sia una stringa
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev; // Già nei preferiti
      }
      return [...prev, id];
    });
  }, []);

  // Rimuove un ristorante dai preferiti
  const removeFavorite = useCallback((restaurantId: string) => {
    const id = String(restaurantId); // Assicura che sia una stringa
    setFavorites(prev => prev.filter(favId => favId !== id));
  }, []);

  // Alterna lo stato di preferito di un ristorante
  const toggleFavorite = useCallback((restaurantId: string) => {
    const id = String(restaurantId); // Assicura che sia una stringa
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(favId => favId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Controlla se un ristorante è nei preferiti
  const isFavorite = useCallback((restaurantId: string) => {
    const id = String(restaurantId); // Assicura che sia una stringa
    return favorites.includes(id);
  }, [favorites]);

  // Rimuove tutti i preferiti
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch (error) {
      console.error("Errore nella rimozione dei preferiti dal localStorage:", error);
    }
  }, []);

  // Importa una lista di preferiti (utile per sincronizzazione o migrazione)
  const importFavorites = useCallback((favoriteIds: string[]) => {
    const stringIds = favoriteIds.map(id => String(id)); // Converte tutti in stringhe
    setFavorites(stringIds);
  }, []);

  // Esporta la lista dei preferiti
  const exportFavorites = useCallback(() => {
    return [...favorites];
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favorites.length,
    importFavorites,
    exportFavorites
  };
};

// Hook aggiuntivo per statistiche sui preferiti
export const useFavoritesStats = (restaurants: any[] = []) => {
  const { favorites } = useFavorites();

  const favoriteRestaurants = restaurants.filter(restaurant => 
    favorites.includes(String(restaurant.id))
  );

  const stats = {
    total: favoriteRestaurants.length,
    byCuisine: favoriteRestaurants.reduce((acc, restaurant) => {
      acc[restaurant.cuisine] = (acc[restaurant.cuisine] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPriceRange: favoriteRestaurants.reduce((acc, restaurant) => {
      acc[restaurant.priceRange] = (acc[restaurant.priceRange] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageRating: favoriteRestaurants.length > 0 
      ? favoriteRestaurants.reduce((sum, restaurant) => sum + parseFloat(restaurant.rating), 0) / favoriteRestaurants.length
      : 0,
    topCuisine: '',
    topPriceRange: ''
  };

  // Trova la cucina più frequente con tipizzazione esplicita
  const cuisineEntries: [string, number][] = Object.entries(stats.byCuisine);
  if (cuisineEntries.length > 0) {
    const topCuisineEntry = cuisineEntries.reduce((a: [string, number], b: [string, number]) => 
      a[1] > b[1] ? a : b
    );
    stats.topCuisine = topCuisineEntry[0];
  }

  // Trova la fascia di prezzo più frequente con tipizzazione esplicita
  const priceEntries: [string, number][] = Object.entries(stats.byPriceRange);
  if (priceEntries.length > 0) {
    const topPriceEntry = priceEntries.reduce((a: [string, number], b: [string, number]) => 
      a[1] > b[1] ? a : b
    );
    stats.topPriceRange = topPriceEntry[0];
  }

  return {
    favoriteRestaurants,
    stats: {
      ...stats,
      averageRating: Math.round(stats.averageRating * 10) / 10 // Arrotonda a 1 decimale
    }
  };
};

// Hook per gestire la migrazione da ID numerici a stringhe
export const useFavoritesMigration = () => {
  const migrateFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Converte tutti gli ID in stringhe
          const migratedIds = parsed.map(id => String(id));
          localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(migratedIds));
          return migratedIds;
        }
      }
      return [];
    } catch (error) {
      console.error("Errore nella migrazione dei preferiti:", error);
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      return [];
    }
  }, []);

  const needsMigration = useCallback(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.some(id => typeof id === 'number');
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    migrateFavorites,
    needsMigration
  };
};

// Utilità per la gestione dei preferiti
export const favoritesUtils = {
  // Controlla se il localStorage è disponibile
  isLocalStorageAvailable: (): boolean => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  // Ottiene i preferiti direttamente dal localStorage (senza hook)
  getFavoritesSync: (): string[] => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(id => String(id)) : [];
      }
      return [];
    } catch {
      return [];
    }
  },

  // Salva i preferiti direttamente nel localStorage (senza hook)
  saveFavoritesSync: (favorites: string[]): boolean => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      return true;
    } catch {
      return false;
    }
  },

  // Pulisce i dati corrotti
  cleanupCorruptedData: (): void => {
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }
};