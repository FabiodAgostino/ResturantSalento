// client/src/lib/firebase-types.ts
// Tipi aggiornati per Firebase (ID come string invece di number)

export interface Restaurant {
  id: string;  // Cambiato da number a string per Firebase
  name: string;
  tripadvisorUrl: string;
  cuisine: string;
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
  createdAt?: Date;
}

export interface Booking {
  id: string;  // Cambiato da number a string per Firebase
  restaurantId: string;  // Cambiato da number a string
  date: Date;
  time: string;
  notes?: string;
  createdAt?: Date;
}

export interface User {
  id: string;  // Cambiato da number a string per Firebase
  username: string;
  password: string;
}

// API request/response types
export interface InsertRestaurant {
  name: string;
  tripadvisorUrl: string;
  cuisine: string;
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
}

export interface InsertBooking {
  restaurantId: string;  // Cambiato da number a string
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
  cuisine?: string;
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
  id: string;
  title: string;
  date: Date;
  color: string;
}

// Form data types
export interface AddRestaurantFormData {
  tripadvisorUrl: string;
  additionalUrls?: string[];
  name?: string;
  cuisine?: string;
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