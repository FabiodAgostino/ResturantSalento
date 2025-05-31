/**
 * Favorites utility functions for restaurant management
 * Note: This file provides utility functions that complement the use-favorites hook
 */

import type { Restaurant } from "@/lib/types";

export interface FavoriteRestaurant {
  id: number;
  name: string;
  cuisine: string;
  priceRange: string;
  rating: string;
  location: string;
  addedAt: Date;
}

/**
 * Storage key for favorites in localStorage
 */
export const FAVORITES_STORAGE_KEY = "salento-favorites";

/**
 * Get favorites from localStorage
 */
export const getFavoritesFromStorage = (): number[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Failed to load favorites from localStorage:", error);
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
  }
  return [];
};

/**
 * Save favorites to localStorage
 */
export const saveFavoritesToStorage = (favorites: number[]): void => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Failed to save favorites to localStorage:", error);
  }
};

/**
 * Check if a restaurant is in favorites
 */
export const isRestaurantFavorite = (restaurantId: number, favorites: number[]): boolean => {
  return favorites.includes(restaurantId);
};

/**
 * Add a restaurant to favorites
 */
export const addToFavorites = (restaurantId: number, currentFavorites: number[]): number[] => {
  if (currentFavorites.includes(restaurantId)) {
    return currentFavorites;
  }
  return [...currentFavorites, restaurantId];
};

/**
 * Remove a restaurant from favorites
 */
export const removeFromFavorites = (restaurantId: number, currentFavorites: number[]): number[] => {
  return currentFavorites.filter(id => id !== restaurantId);
};

/**
 * Toggle a restaurant's favorite status
 */
export const toggleFavoriteStatus = (restaurantId: number, currentFavorites: number[]): number[] => {
  if (currentFavorites.includes(restaurantId)) {
    return removeFromFavorites(restaurantId, currentFavorites);
  } else {
    return addToFavorites(restaurantId, currentFavorites);
  }
};

/**
 * Get favorite restaurants from a list of all restaurants
 */
export const getFavoriteRestaurants = (
  restaurants: Restaurant[], 
  favoriteIds: number[]
): Restaurant[] => {
  return restaurants.filter(restaurant => favoriteIds.includes(restaurant.id));
};

/**
 * Sort restaurants by favorite status (favorites first)
 */
export const sortByFavoriteStatus = (
  restaurants: Restaurant[], 
  favoriteIds: number[]
): Restaurant[] => {
  return [...restaurants].sort((a, b) => {
    const aIsFavorite = favoriteIds.includes(a.id);
    const bIsFavorite = favoriteIds.includes(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });
};

/**
 * Get statistics about favorites
 */
export const getFavoritesStats = (
  restaurants: Restaurant[], 
  favoriteIds: number[]
): {
  total: number;
  byCuisine: Record<string, number>;
  byPriceRange: Record<string, number>;
  averageRating: number;
} => {
  const favoriteRestaurants = getFavoriteRestaurants(restaurants, favoriteIds);
  
  const byCuisine: Record<string, number> = {};
  const byPriceRange: Record<string, number> = {};
  let totalRating = 0;

  favoriteRestaurants.forEach(restaurant => {
    // Count by cuisine
    byCuisine[restaurant.cuisine] = (byCuisine[restaurant.cuisine] || 0) + 1;
    
    // Count by price range
    byPriceRange[restaurant.priceRange] = (byPriceRange[restaurant.priceRange] || 0) + 1;
    
    // Sum ratings
    totalRating += parseFloat(restaurant.rating);
  });

  const averageRating = favoriteRestaurants.length > 0 
    ? totalRating / favoriteRestaurants.length 
    : 0;

  return {
    total: favoriteRestaurants.length,
    byCuisine,
    byPriceRange,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
  };
};

/**
 * Export favorites data for sharing or backup
 */
export const exportFavorites = (
  restaurants: Restaurant[], 
  favoriteIds: number[]
): FavoriteRestaurant[] => {
  const favoriteRestaurants = getFavoriteRestaurants(restaurants, favoriteIds);
  
  return favoriteRestaurants.map(restaurant => ({
    id: restaurant.id,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    priceRange: restaurant.priceRange,
    rating: restaurant.rating,
    location: restaurant.location,
    addedAt: new Date(), // In a real app, this would be stored
  }));
};

/**
 * Import favorites from exported data
 */
export const importFavorites = (exportedFavorites: FavoriteRestaurant[]): number[] => {
  return exportedFavorites.map(fav => fav.id);
};

/**
 * Clear all favorites
 */
export const clearAllFavorites = (): void => {
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear favorites from localStorage:", error);
  }
};

/**
 * Migrate favorites from old storage format (if needed)
 */
export const migrateFavoritesFormat = (): number[] => {
  try {
    // Check for old format favorites
    const oldFormatKey = "restaurant-favorites";
    const oldFavorites = localStorage.getItem(oldFormatKey);
    
    if (oldFavorites && !localStorage.getItem(FAVORITES_STORAGE_KEY)) {
      const parsed = JSON.parse(oldFavorites);
      if (Array.isArray(parsed)) {
        saveFavoritesToStorage(parsed);
        localStorage.removeItem(oldFormatKey);
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to migrate favorites format:", error);
  }
  
  return getFavoritesFromStorage();
};
