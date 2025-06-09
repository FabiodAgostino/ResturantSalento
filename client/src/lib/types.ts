// client/src/lib/types.ts - Types finali corretti
// Frontend type definitions matching the backend schema
// Interfaccia Restaurant aggiornata con valutazioni utente
export interface Restaurant {
  id: number;
  name: string;
  tripadvisorUrl: string;
  cuisines: string[]; // Array di stringhe
  priceRange: string;
  rating: string;
  location: string;
  latitude?: string | null;
  longitude?: string | null;
  description?: string | null;
  phone?: string | null;
  hours?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  favorite?: boolean;
  isApproved?: boolean;
  createdAt?: Date;
  
  // ✅ Nuove valutazioni utente
  locationUser?: number; // Rating posizione (0-5)
  qualitàPrezzoUser?: number; // Rating qualità/prezzo (0-5)
  mediaPrezzo?: number; // Prezzo medio in euro
}

// Interfaccia InsertRestaurant aggiornata
export interface InsertRestaurant {
  id?: number;
  name: string;
  tripadvisorUrl: string;
  cuisines: string[];
  priceRange: string;
  rating: string;
  location: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  phone?: string;
  hours?: string;
  address?: string;
  imageUrl?: string;
  isApproved?: boolean;
  
  // ✅ Nuove valutazioni utente
  locationUser?: number;
  qualitàPrezzoUser?: number;
  mediaPrezzo?: number;
}

// Utility per validare i rating utente
export const validateUserRating = (value: number | undefined): boolean => {
  if (value === undefined) return true; // Optional fields
  return value >= 0 && value <= 5;
};

// Utility per validare il prezzo medio
export const validateAveragePrice = (value: number | undefined): boolean => {
  if (value === undefined) return true; // Optional field
  return value >= 0 && value <= 1000; // Max €1000 per pasto
};

// Utility per formattare i rating
export const formatUserRating = (rating: number | undefined): string => {
  if (!rating) return "Non valutato";
  return `${rating.toFixed(1)}/5`;
};

// Utility per formattare il prezzo medio
export const formatAveragePrice = (price: number | undefined): string => {
  if (!price) return "Non specificato";
  return `€${price.toFixed(2)}`;
};

export interface Booking {
  id: number;
  restaurantId: number;
  date: Date;
  time: string;
  notes?: string;
  createdAt?: Date;
}

export interface User {
  id: number;
  username: string;
  password: string;
}

export interface InsertBooking {
  restaurantId: number;
  date: Date;
  time: string;
  notes?: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

// Filter types for restaurant search
export interface RestaurantFilters {
  search?: string;
  cuisines?: string[];
  priceRange?: string;
  minRating?: number;
}

// Geolocation types
export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Calendar event types
export interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
}

// Form data types
export interface AddRestaurantFormData {
  tripadvisorUrl: string;
  additionalUrls?: string[];
  name?: string;
  cuisines?: string[];
  priceRange?: string;
  location?: string;
  description?: string;
  phone?: string;
  address?: string;
}

export interface BookingFormData {
  restaurantId: string;
  date: string;
  time: string;
  notes: string;
}

// API response types
export interface ExtractedRestaurantData {
  name: string;
  cuisines: string[] | undefined;
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

export interface ApiError {
  message: string;
  errors?: any[];
}

// Cuisine and price options
export const CUISINE_OPTIONS = [
  { value: "italiana", label: "Italiana" },
  { value: "mediterranea", label: "Mediterranea" },
  { value: "pesce", label: "Pesce" },
  { value: "barbecue", label: "Barbecue" },
  { value: "steakhouse", label: "Steakhouse" },
  { value: "pugliese", label: "Pugliese" },
] as const;

export const PRICE_OPTIONS = [
  { value: "€", label: "€ - Budget" },
  { value: "€€", label: "€€ - Moderate" },
  { value: "€€€", label: "€€€ - Expensive" },
  { value: "€€€€", label: "€€€€ - Fine Dining" },
] as const;

export const RATING_OPTIONS = [
  { value: "4.5", label: "4.5+ Stars" },
  { value: "4.0", label: "4.0+ Stars" },
  { value: "3.5", label: "3.5+ Stars" },
  { value: "3.0", label: "3.0+ Stars" },
] as const;

export type CuisineType = typeof CUISINE_OPTIONS[number]["value"];
export type PriceRangeType = typeof PRICE_OPTIONS[number]["value"];
export type RatingType = typeof RATING_OPTIONS[number]["value"];

// Helper functions per le cuisines
export const formatCuisines = (cuisines: string[]): string => {
  return cuisines.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
};

export const getCuisineLabel = (value: string): string => {
  const option = CUISINE_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value.charAt(0).toUpperCase() + value.slice(1);
};

// Utility function per normalizzare cuisines (backward compatibility)
export const normalizeCuisines = (cuisines: any): string[] => {
  if (!cuisines) return [];
  
  // Se è già un array, ritornalo
  if (Array.isArray(cuisines)) return cuisines;
  
  // Se è una stringa, prova a parsarla come JSON
  if (typeof cuisines === 'string') {
    try {
      const parsed = JSON.parse(cuisines);
      return Array.isArray(parsed) ? parsed : [cuisines];
    } catch {
      // Se non è JSON valido, trattala come singola cucina
      return [cuisines];
    }
  }
  
  return [];
};

// Utility function per validare cuisine types
export const isValidCuisineType = (cuisine: string): cuisine is CuisineType => {
  return CUISINE_OPTIONS.some(option => option.value === cuisine);
};