// client/src/services/restaurant-service.ts
import { apiRequest } from "@/lib/queryClient";
import type { Restaurant, InsertRestaurant, Booking, InsertBooking } from "@/lib/types";

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
  
  // ==========================================
  // SEZIONE: GESTIONE RISTORANTI - LETTURA
  // ==========================================
  
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
        isApproved: restaurant.isApproved ?? true,
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
      throw new RestaurantServiceError("Impossibile caricare i ristoranti", "FETCH_ERROR", error);
    }
  }

  /**
   * Ottiene un singolo ristorante per ID
   */
  static async getRestaurant(id: number): Promise<Restaurant> {
    try {
      const response = await apiRequest("GET", `/api/restaurants/${id}`);
      const restaurant = await response.json();
      
      return {
        ...restaurant,
        isApproved: restaurant.isApproved ?? true,
        createdAt: restaurant.createdAt ? new Date(restaurant.createdAt) : new Date(),
        description: restaurant.description || "Ristorante tradizionale",
        phone: restaurant.phone || null,
        hours: restaurant.hours || null,
        address: restaurant.address || null,
        imageUrl: restaurant.imageUrl || null,
        latitude: restaurant.latitude || "40.3515",
        longitude: restaurant.longitude || "18.1750"
      };
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      throw new RestaurantServiceError(`Impossibile caricare il ristorante con ID ${id}`, "FETCH_ERROR", error);
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
      throw new RestaurantServiceError("Errore nella ricerca dei ristoranti", "SEARCH_ERROR", error);
    }
  }

  // ==========================================
  // SEZIONE: GESTIONE RISTORANTI - SCRITTURA
  // ==========================================

  /**
   * Crea un nuovo ristorante
   */
  static async createRestaurant(restaurantData: InsertRestaurant): Promise<Restaurant> {
    try {
      // Validazione dei dati prima dell'invio
      const errors = RestaurantValidator.validateRestaurantData(restaurantData);
      if (errors.length > 0) {
        throw new RestaurantServiceError(`Dati non validi: ${errors.join(', ')}`, "VALIDATION_ERROR");
      }

      const response = await apiRequest("POST", "/api/restaurants", restaurantData);
      const restaurant = await response.json();
      
      return {
        ...restaurant,
        createdAt: restaurant.createdAt ? new Date(restaurant.createdAt) : new Date()
      };
    } catch (error) {
      console.error("Errore nella creazione:", error);
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError("Impossibile aggiungere il ristorante", "CREATE_ERROR", error);
    }
  }

  /**
   * Aggiorna un ristorante esistente
   */
  static async updateRestaurant(id: number, updates: Partial<Restaurant>): Promise<Restaurant> {
    try {
      if (!id || id <= 0) {
        throw new RestaurantServiceError("ID ristorante non valido", "INVALID_ID");
      }

      const response = await apiRequest("PUT", `/api/restaurants/${id}`, updates);
      const restaurant = await response.json();
      
      return {
        ...restaurant,
        createdAt: restaurant.createdAt ? new Date(restaurant.createdAt) : new Date()
      };
    } catch (error) {
      console.error("Error updating restaurant:", error);
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError(`Impossibile aggiornare il ristorante con ID ${id}`, "UPDATE_ERROR", error);
    }
  }

  /**
   * Elimina un ristorante
   */
  static async deleteRestaurant(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new RestaurantServiceError("ID ristorante non valido", "INVALID_ID");
      }

      const response = await apiRequest("DELETE", `/api/restaurants/${id}`);
      
      // Controlla se la risposta è ok
      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new RestaurantServiceError(
          errorData.message || "Errore nell'eliminazione del ristorante", 
          "DELETE_ERROR"
        );
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError(`Impossibile eliminare il ristorante con ID ${id}`, "DELETE_ERROR", error);
    }
  }

  // ==========================================
  // SEZIONE: ESTRAZIONE DATI TRIPADVISOR
  // ==========================================

  /**
   * Estrae dati da URL TripAdvisor usando il backend Express
   */
  static async extractRestaurantData(url: string): Promise<ExtractionResponse> {
    try {
      if (!url || !url.toLowerCase().includes('tripadvisor')) {
        throw new RestaurantServiceError("URL TripAdvisor non valido", "INVALID_URL");
      }

      // Validazione ulteriore dell'URL
      if (!RestaurantValidator.validateTripAdvisorUrl(url)) {
        throw new RestaurantServiceError("Formato URL TripAdvisor non supportato", "INVALID_URL_FORMAT");
      }

      const response = await apiRequest("POST", "/api/restaurants/extract", { url });
      const result = await response.json();
      
      if (!result.extracted) {
        throw new RestaurantServiceError("Nessun dato estratto dall'URL fornito", "NO_DATA_EXTRACTED");
      }
      
      return result;
    } catch (error) {
      console.error("❌ Errore nell'estrazione:", error);
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError("Impossibile estrarre i dati del ristorante. Verifica l'URL.", "EXTRACTION_ERROR", error);
    }
  }

  // ==========================================
  // SEZIONE: GESTIONE PRENOTAZIONI - LETTURA
  // ==========================================

  /**
   * Ottiene tutte le prenotazioni
   */
  static async getAllBookings(): Promise<Booking[]> {
    try {
      const response = await apiRequest("GET", "/api/bookings");
      const bookings = await response.json();
      
      return bookings.map((booking: any) => ({
        ...booking,
        date: new Date(booking.date),
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date()
      }));
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw new RestaurantServiceError("Impossibile caricare le prenotazioni", "FETCH_BOOKINGS_ERROR", error);
    }
  }

  /**
   * Ottiene le prenotazioni per un ristorante specifico
   */
  static async getBookingsByRestaurant(restaurantId: number): Promise<Booking[]> {
    try {
      if (!restaurantId || restaurantId <= 0) {
        throw new RestaurantServiceError("ID ristorante non valido", "INVALID_RESTAURANT_ID");
      }

      const response = await apiRequest("GET", `/api/bookings/restaurant/${restaurantId}`);
      const bookings = await response.json();
      
      return bookings.map((booking: any) => ({
        ...booking,
        date: new Date(booking.date),
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date()
      }));
    } catch (error) {
      console.error("Error fetching restaurant bookings:", error);
      throw new RestaurantServiceError(
        `Impossibile caricare le prenotazioni per il ristorante ${restaurantId}`, 
        "FETCH_RESTAURANT_BOOKINGS_ERROR", 
        error
      );
    }
  }

  /**
   * Ottiene una singola prenotazione per ID
   */
  static async getBooking(id: number): Promise<Booking> {
    try {
      if (!id || id <= 0) {
        throw new RestaurantServiceError("ID prenotazione non valido", "INVALID_BOOKING_ID");
      }

      const response = await apiRequest("GET", `/api/bookings/${id}`);
      const booking = await response.json();
      
      return {
        ...booking,
        date: new Date(booking.date),
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date()
      };
    } catch (error) {
      console.error("Error fetching booking:", error);
      throw new RestaurantServiceError(`Impossibile caricare la prenotazione con ID ${id}`, "FETCH_BOOKING_ERROR", error);
    }
  }

  // ==========================================
  // SEZIONE: GESTIONE PRENOTAZIONI - SCRITTURA
  // ==========================================

  /**
   * Crea una nuova prenotazione
   */
  static async createBooking(bookingData: InsertBooking): Promise<Booking> {
    console.log("CIAOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO")
    try {
      console.log(bookingData.restaurantId);
      // Validazione base dei dati
      if (!bookingData.restaurantId) {
        throw new RestaurantServiceError("ID ristorante non valido", "INVALID_RESTAURANT_ID");
      }
      
      if (!bookingData.date) {
        throw new RestaurantServiceError("Data prenotazione obbligatoria", "MISSING_DATE");
      }
      
      if (!bookingData.time) {
        throw new RestaurantServiceError("Orario prenotazione obbligatorio", "MISSING_TIME");
      }

      // Verifica che la data non sia nel passato
      const bookingDate = new Date(bookingData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        throw new RestaurantServiceError("Non è possibile prenotare per una data passata", "PAST_DATE");
      }

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      const booking = await response.json();
      
      return {
        ...booking,
        date: new Date(booking.date),
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date()
      };
    } catch (error) {
      console.error("Errore nella creazione prenotazione:", error);
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError("Impossibile aggiungere la prenotazione", "CREATE_BOOKING_ERROR", error);
    }
  }

  /**
   * Aggiorna una prenotazione esistente
   */
  static async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking> {
    try {
      if (!id || id <= 0) {
        throw new RestaurantServiceError("ID prenotazione non valido", "INVALID_BOOKING_ID");
      }

      // Se viene aggiornata la data, verifica che non sia nel passato
      if (updates.date) {
        const bookingDate = new Date(updates.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (bookingDate < today) {
          throw new RestaurantServiceError("Non è possibile spostare la prenotazione a una data passata", "PAST_DATE");
        }
      }

      const response = await apiRequest("PUT", `/api/bookings/${id}`, updates);
      const booking = await response.json();
      
      return {
        ...booking,
        date: new Date(booking.date),
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date()
      };
    } catch (error) {
      console.error("Error updating booking:", error);
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError(`Impossibile aggiornare la prenotazione con ID ${id}`, "UPDATE_BOOKING_ERROR", error);
    }
  }

  /**
   * Elimina una prenotazione
   */
  static async deleteBooking(id: number): Promise<boolean> {
    try {
      if (!id || id <= 0) {
        throw new RestaurantServiceError("ID prenotazione non valido", "INVALID_BOOKING_ID");
      }

      const response = await apiRequest("DELETE", `/api/bookings/${id}`);
      
      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new RestaurantServiceError(
          errorData.message || "Errore nell'eliminazione della prenotazione", 
          "DELETE_BOOKING_ERROR"
        );
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError(`Impossibile eliminare la prenotazione con ID ${id}`, "DELETE_BOOKING_ERROR", error);
    }
  }
}

// ==========================================
// SEZIONE: GESTIONE ERRORI
// ==========================================

/**
 * Classe per gestire errori specifici del servizio ristoranti
 */
export class RestaurantServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'RestaurantServiceError';
  }

  /**
   * Restituisce un messaggio user-friendly basato sul codice errore
   */
  getUserFriendlyMessage(): string {
    switch (this.code) {
      case 'FETCH_ERROR':
        return 'Problemi di connessione. Riprova tra qualche minuto.';
      case 'VALIDATION_ERROR':
        return 'I dati inseriti non sono corretti. Controlla i campi evidenziati.';
      case 'INVALID_URL':
        return 'L\'URL di TripAdvisor non è valido. Assicurati di copiare il link completo.';
      case 'EXTRACTION_ERROR':
        return 'Impossibile estrarre i dati da TripAdvisor. L\'URL potrebbe non essere accessibile.';
      case 'PAST_DATE':
        return 'Non puoi prenotare per una data già passata.';
      case 'INVALID_ID':
      case 'INVALID_RESTAURANT_ID':
      case 'INVALID_BOOKING_ID':
        return 'ID non valido. Ricarica la pagina e riprova.';
      default:
        return this.message;
    }
  }
}

// ==========================================
// SEZIONE: VALIDATORI
// ==========================================

/**
 * Classe per validare i dati dei ristoranti e prenotazioni
 */
export class RestaurantValidator {
  /**
   * Valida un URL di TripAdvisor
   */
  static validateTripAdvisorUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('tripadvisor.com') || 
             urlObj.hostname.includes('tripadvisor.it') ||
             urlObj.hostname.includes('tripadvisor.');
    } catch {
      return false;
    }
  }

  /**
   * Valida i dati di un ristorante
   */
  static validateRestaurantData(data: Partial<InsertRestaurant>): string[] {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push("Il nome del ristorante deve avere almeno 2 caratteri");
    }
    
    if (data.name && data.name.length > 100) {
      errors.push("Il nome del ristorante non può superare i 100 caratteri");
    }
    
    if (!data.tripadvisorUrl || !this.validateTripAdvisorUrl(data.tripadvisorUrl)) {
      errors.push("URL TripAdvisor non valido");
    }
    
    if (!data.cuisines || data.cuisines.length === 0) {
      errors.push("Almeno un tipo di cucina è obbligatorio");
    }
    
    if (!data.priceRange) {
      errors.push("Fascia di prezzo obbligatoria");
    }
    
    if (!['€', '€€', '€€€', '€€€€'].includes(data.priceRange || '')) {
      errors.push("Fascia di prezzo non valida");
    }
    
    if (!data.location || data.location.trim().length < 2) {
      errors.push("Posizione obbligatoria");
    }
    
    if (data.location && data.location.length > 200) {
      errors.push("La posizione non può superare i 200 caratteri");
    }
    
    if (data.phone && !/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
      errors.push("Numero di telefono non valido");
    }
    
    if (data.rating && !this.validateRating(data.rating)) {
      errors.push("Rating non valido (deve essere tra 1.0 e 5.0)");
    }
    
    return errors;
  }

  /**
   * Valida i dati di una prenotazione
   */
  static validateBookingData(data: Partial<InsertBooking>): string[] {
    const errors: string[] = [];
    
    if (!data.restaurantId || data.restaurantId <= 0) {
      errors.push("ID ristorante non valido");
    }
    
    if (!data.date) {
      errors.push("Data prenotazione obbligatoria");
    } else {
      const bookingDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        errors.push("Non è possibile prenotare per una data passata");
      }
    }
    
    if (!data.time) {
      errors.push("Orario prenotazione obbligatorio");
    } else if (!this.validateTime(data.time)) {
      errors.push("Formato orario non valido (usa HH:MM)");
    }
    
    if (data.notes && data.notes.length > 500) {
      errors.push("Le note non possono superare i 500 caratteri");
    }
    
    return errors;
  }

  /**
   * Valida un rating (1.0 - 5.0)
   */
  private static validateRating(rating: string): boolean {
    const numRating = parseFloat(rating);
    return !isNaN(numRating) && numRating >= 1.0 && numRating <= 5.0;
  }

  /**
   * Valida un orario in formato HH:MM
   */
  private static validateTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}

// ==========================================
// SEZIONE: HOOK PERSONALIZZATI PER REACT
// ==========================================

/**
 * Hook personalizzato per React Query - fornisce tutti i metodi del servizio
 */
export const useRestaurants = () => {
  return {
    // Metodi ristoranti
    getAllRestaurants: RestaurantService.getAllRestaurants,
    getRestaurant: RestaurantService.getRestaurant,
    searchRestaurants: RestaurantService.searchRestaurants,
    createRestaurant: RestaurantService.createRestaurant,
    updateRestaurant: RestaurantService.updateRestaurant,
    deleteRestaurant: RestaurantService.deleteRestaurant,
    extractRestaurantData: RestaurantService.extractRestaurantData,
    
    // Metodi prenotazioni
    getAllBookings: RestaurantService.getAllBookings,
    getBookingsByRestaurant: RestaurantService.getBookingsByRestaurant,
    getBooking: RestaurantService.getBooking,
    createBooking: RestaurantService.createBooking,
    updateBooking: RestaurantService.updateBooking,
    deleteBooking: RestaurantService.deleteBooking,
    
    // Validatori
    validateRestaurantData: RestaurantValidator.validateRestaurantData,
    validateBookingData: RestaurantValidator.validateBookingData,
    validateTripAdvisorUrl: RestaurantValidator.validateTripAdvisorUrl,
  };
};

// ==========================================
// SEZIONE: UTILITY FUNCTIONS
// ==========================================

/**
 * Utility per formattare gli errori per l'interfaccia utente
 */
export const formatServiceError = (error: unknown): string => {
  if (error instanceof RestaurantServiceError) {
    return error.getUserFriendlyMessage();
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Si è verificato un errore imprevisto. Riprova tra qualche minuto.';
};

/**
 * Utility per verificare se un errore è recuperabile
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof RestaurantServiceError) {
    const retryableCodes = ['FETCH_ERROR', 'NETWORK_ERROR', 'TIMEOUT_ERROR'];
    return retryableCodes.includes(error.code || '');
  }
  return false;
};