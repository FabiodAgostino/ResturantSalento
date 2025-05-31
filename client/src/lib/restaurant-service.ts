// client/src/services/restaurant-service.ts
import { apiRequest } from "@/lib/queryClient";
import type { Restaurant, InsertRestaurant } from "@/lib/types";

export interface ExtractedRestaurantData {
  name: string;
  cuisine: string;
  priceRange: string;
  rating: string;
  location: string;
  description?: string;
  phone?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export interface ExtractionResponse {
  extracted: ExtractedRestaurantData;
}

export class RestaurantService {
  /**
   * Ottiene tutti i ristoranti dal backend Express
   */
  static async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      const response = await apiRequest("GET", "/api/restaurants");
      const restaurants = await response.json();
      
      // Assicurati che ogni ristorante abbia le proprietà necessarie
      return restaurants.map((restaurant: any) => ({
        ...restaurant,
        isApproved: restaurant.isApproved ?? true, // Default a true se non definito
        createdAt: restaurant.createdAt ? new Date(restaurant.createdAt) : new Date(),
        description: restaurant.description || "Ristorante tradizionale",
        phone: restaurant.phone || null,
        hours: restaurant.hours || null,
        address: restaurant.address || null,
        imageUrl: restaurant.imageUrl || null,
        latitude: restaurant.latitude || "40.3515",
        longitude: restaurant.longitude || "18.1750"
      }));
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw new Error("Impossibile caricare i ristoranti");
    }
  }

  /**
   * Estrae dati da URL TripAdvisor usando il backend Express
   */
  // Nel metodo extractRestaurantData
static async extractRestaurantData(url: string): Promise<ExtractionResponse> {
  try {
    if (!url || !url.toLowerCase().includes('tripadvisor')) {
      throw new Error("URL TripAdvisor non valido");
    }
    
    console.log('🔍 Inizio estrazione da:', url);
    const response = await apiRequest("POST", "/api/restaurants/extract", { url });
    const result = await response.json();
    console.log('✅ Estrazione completata:', result.extracted?.name);
    
    return result;
  } catch (error) {
    console.error("❌ Errore nell'estrazione:", error);
    throw new Error("Impossibile estrarre i dati del ristorante. Verifica l'URL.");
  }
}
  /**
   * Crea un nuovo ristorante
   */
  static async createRestaurant(restaurantData: InsertRestaurant): Promise<Restaurant> {
    try {
      const response = await apiRequest("POST", "/api/restaurants", restaurantData);
      return await response.json();
    } catch (error) {
      console.error("Errore nella creazione:", error);
      throw new Error("Impossibile aggiungere il ristorante");
    }
  }

  /**
   * Cerca ristoranti con filtri
   */
  static async searchRestaurants(filters: {
    search?: string;
    cuisine?: string;
    priceRange?: string;
    minRating?: number;
  }): Promise<Restaurant[]> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `/api/restaurants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      const restaurants = await response.json();
      
      return restaurants.map((restaurant: any) => ({
        ...restaurant,
        isApproved: restaurant.isApproved ?? true,
        createdAt: restaurant.createdAt ? new Date(restaurant.createdAt) : new Date()
      }));
    } catch (error) {
      console.error("Error searching restaurants:", error);
      throw new Error("Errore nella ricerca dei ristoranti");
    }
  }
}

// Tipi per gestire gli errori
export class RestaurantServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'RestaurantServiceError';
  }
}

// Utilities per la validazione
export class RestaurantValidator {
  static validateTripAdvisorUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('tripadvisor.com') || 
             urlObj.hostname.includes('tripadvisor.it');
    } catch {
      return false;
    }
  }

  static validateRestaurantData(data: Partial<InsertRestaurant>): string[] {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push("Il nome del ristorante deve avere almeno 2 caratteri");
    }
    
    if (!data.tripadvisorUrl || !this.validateTripAdvisorUrl(data.tripadvisorUrl)) {
      errors.push("URL TripAdvisor non valido");
    }
    
    if (!data.cuisine) {
      errors.push("Tipo di cucina obbligatorio");
    }
    
    if (!data.priceRange) {
      errors.push("Fascia di prezzo obbligatoria");
    }
    
    if (!data.location || data.location.trim().length < 2) {
      errors.push("Posizione obbligatoria");
    }
    
    return errors;
  }
}

// Hook personalizzato per React Query
export const useRestaurants = () => {
  return {
    getAllRestaurants: RestaurantService.getAllRestaurants,
    extractRestaurantData: RestaurantService.extractRestaurantData,
    createRestaurant: RestaurantService.createRestaurant,
    searchRestaurants: RestaurantService.searchRestaurants,
  };
};