// client/src/services/restaurant-service.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Restaurant, InsertRestaurant, Booking, InsertBooking, ExtractionResponse } from "../src/lib/types";
import { SnowflakeIdGenerator } from "@/utils/SnowflakeIdGenerator";
import { scrapingService, ScrapingRequest } from './scrapingService';

// Configurazione Firebase (sostituisci con i tuoi valori)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date();
}

function initializeFirebase() {
  // Verifica che le variabili d'ambiente siano configurate
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new RestaurantServiceError(
      'Configurazione Firebase incompleta. Verificare le variabili d\'ambiente VITE_FIREBASE_*.',
      'FIREBASE_CONFIG_ERROR'
    );
  }

  if (!getApps().length) {
    try {
      initializeApp(firebaseConfig);
      console.log('🔥 Firebase Client initialized successfully');
    } catch (error) {
      throw new RestaurantServiceError(
        'Errore nell\'inizializzazione di Firebase',
        'FIREBASE_INIT_ERROR',
        error
      );
    }
  }
  
  SnowflakeIdGenerator.setMachineId(100);
  const db = getFirestore();
  
  return db;
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
      case 'FIREBASE_CONFIG_ERROR':
        return 'Errore di configurazione del database. Contatta il supporto tecnico.';
      case 'FIREBASE_INIT_ERROR':
        return 'Impossibile connettersi al database. Riprova tra qualche minuto.';
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
      case 'NOT_FOUND':
        return 'Elemento non trovato.';
      case 'DELETE_ERROR':
        return 'Impossibile eliminare l\'elemento. Riprova.';
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

  /**
   * Valida un ID
   */
  static validateId(id: number): boolean {
    return Number.isInteger(id) && id > 0;
  }
}

// ==========================================
// SEZIONE: SERVIZIO RISTORANTI
// ==========================================

export class RestaurantService {
  private readonly db: ReturnType<typeof getFirestore>;
  private readonly restaurantsRef: ReturnType<typeof collection>;
  private readonly bookingsRef: ReturnType<typeof collection>;

  constructor() {
    try {
      // Inizializza Firebase solo quando la classe viene istanziata
      this.db = initializeFirebase();
      
      // Collections references
      this.restaurantsRef = collection(this.db, 'restaurants');
      this.bookingsRef = collection(this.db, 'bookings');
    } catch (error) {
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError(
        'Errore nell\'inizializzazione del servizio',
        'SERVICE_INIT_ERROR',
        error
      );
    }
  }
  
  // ==========================================
  // SEZIONE: GESTIONE RISTORANTI - LETTURA
  // ==========================================
  
  /**
   * Ottiene tutti i ristoranti
   */
  public async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      const snapshot = await getDocs(this.restaurantsRef);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: data.id || parseInt(docSnap.id),
          ...data,
          createdAt: toDate(data.createdAt)
        };
      }) as Restaurant[];
    } catch (error) {
      throw new RestaurantServiceError(
        'Errore nel recupero dei ristoranti',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Ottiene un singolo ristorante per ID
   */
  public async getRestaurant(id: number): Promise<Restaurant | undefined> {
    if (!RestaurantValidator.validateId(id)) {
      throw new RestaurantServiceError(
        'ID ristorante non valido',
        'INVALID_RESTAURANT_ID'
      );
    }

    try {
      // Cerca per campo id invece che per document ID
      const q = query(this.restaurantsRef, where('id', '==', id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return undefined;
      }
      
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return {
        id,
        ...data,
        createdAt: toDate(data.createdAt)
      } as Restaurant;
    } catch (error) {
      throw new RestaurantServiceError(
        `Errore nel recupero del ristorante ${id}`,
        'FETCH_ERROR',
        error
      );
    }
  }

  // ==========================================
  // SEZIONE: GESTIONE RISTORANTI - SCRITTURA
  // ==========================================

  /**
   * Crea un nuovo ristorante
   */
  public async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    // Validazione dei dati
    const validationErrors = RestaurantValidator.validateRestaurantData(insertRestaurant);
    if (validationErrors.length > 0) {
      throw new RestaurantServiceError(
        `Dati non validi: ${validationErrors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    try {
      const restaurantId = SnowflakeIdGenerator.generateId();
      const restaurantData = {
        ...insertRestaurant,
        id: restaurantId,
        isApproved: true,
        createdAt: Timestamp.now(),
      };

      // Rimuovi i campi undefined
      const cleanData = Object.fromEntries(
        Object.entries(restaurantData).filter(([_, value]) => value !== undefined)
      );

      console.log('🔥 Data to save to Firestore:', JSON.stringify(cleanData, null, 2));

      await addDoc(this.restaurantsRef, cleanData);
      
      return { 
        ...cleanData,
        createdAt: toDate(cleanData.createdAt)
      } as Restaurant;
    } catch (error) {
      throw new RestaurantServiceError(
        'Errore nella creazione del ristorante',
        'CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Aggiorna un ristorante esistente
   */
  public async updateRestaurant(id: number, updates: Partial<Restaurant>): Promise<Restaurant | undefined> {
    if (!RestaurantValidator.validateId(id)) {
      throw new RestaurantServiceError(
        'ID ristorante non valido',
        'INVALID_RESTAURANT_ID'
      );
    }

    try {
      // Query per trovare il documento con il campo id uguale al numero passato
      const q = query(this.restaurantsRef, where('id', '==', id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log(`Nessun ristorante trovato con id: ${id}`);
        return undefined;
      }
      
      // Dovrebbe esserci solo un documento con questo ID
      const docSnap = snapshot.docs[0];
      const docRef = doc(this.db, 'restaurants', docSnap.id);
      
      // Aggiorna il documento
      await updateDoc(docRef, updates);
      
      // Ottieni i dati aggiornati
      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data();
      
      return {
        id,
        ...updatedData,
        createdAt: toDate(updatedData?.createdAt)
      } as Restaurant;
      
    } catch (error) {
      throw new RestaurantServiceError(
        `Errore nell'aggiornamento del ristorante ${id}`,
        'UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Elimina un ristorante
   */
  public async deleteRestaurant(id: number): Promise<boolean> {
    if (!RestaurantValidator.validateId(id)) {
      throw new RestaurantServiceError(
        'ID ristorante non valido',
        'INVALID_RESTAURANT_ID'
      );
    }

    try {
      const q = query(this.restaurantsRef, where('id', '==', id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return false;
      }
      
      const docSnap = snapshot.docs[0];
      const docRef = doc(this.db, 'restaurants', docSnap.id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      throw new RestaurantServiceError(
        `Errore nell'eliminazione del ristorante ${id}`,
        'DELETE_ERROR',
        error
      );
    }
  }

  // ==========================================
  // SEZIONE: ESTRAZIONE DATI TRIPADVISOR
  // ==========================================

  /**
   * Estrae dati da URL TripAdvisor usando servizio di scraping esterno
   */
  public async extractRestaurantData(url: string): Promise<ExtractionResponse> {
    if (!RestaurantValidator.validateTripAdvisorUrl(url)) {
      throw new RestaurantServiceError(
        'URL TripAdvisor non valido',
        'INVALID_URL'
      );
    }

    try {
      // Per ora implementiamo un mock - dovrai sostituire con la tua API di scraping
      var req: ScrapingRequest =
      {
        url: url
      }
     var response = await scrapingService.scrapeRestaurant(req);
      var data: ExtractionResponse =
      {
        extracted: response
      };

     return data;
    } catch (error) {
      console.error("❌ Errore nell'estrazione:", error);
      throw new RestaurantServiceError(
        "Impossibile estrarre i dati del ristorante. Verifica l'URL.",
        'EXTRACTION_ERROR',
        error
      );
    }
  }

  // ==========================================
  // SEZIONE: GESTIONE PRENOTAZIONI
  // ==========================================

  /**
   * Ottiene tutte le prenotazioni
   */
  public async getAllBookings(): Promise<Booking[]> {
    try {
      const snapshot = await getDocs(this.bookingsRef);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: data.id || parseInt(docSnap.id),
          ...data,
          date: toDate(data.date),
          createdAt: toDate(data.createdAt)
        };
      }) as Booking[];
    } catch (error) {
      throw new RestaurantServiceError(
        'Errore nel recupero delle prenotazioni',
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Ottiene le prenotazioni per un ristorante specifico
   */
  public async getBookingsByRestaurant(restaurantId: number): Promise<Booking[]> {
    if (!RestaurantValidator.validateId(restaurantId)) {
      throw new RestaurantServiceError(
        'ID ristorante non valido',
        'INVALID_RESTAURANT_ID'
      );
    }

    try {
      const q = query(this.bookingsRef, where('restaurantId', '==', restaurantId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: data.id || parseInt(docSnap.id),
          ...data,
          date: toDate(data.date),
          createdAt: toDate(data.createdAt)
        };
      }) as Booking[];
    } catch (error) {
      throw new RestaurantServiceError(
        `Errore nel recupero delle prenotazioni per il ristorante ${restaurantId}`,
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Ottiene una singola prenotazione per ID
   */
  public async getBooking(id: number): Promise<Booking> {
    if (!RestaurantValidator.validateId(id)) {
      throw new RestaurantServiceError(
        'ID prenotazione non valido',
        'INVALID_BOOKING_ID'
      );
    }

    try {
      const q = query(this.bookingsRef, where('id', '==', id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new RestaurantServiceError(
          `Prenotazione ${id} non trovata`,
          'NOT_FOUND'
        );
      }
      
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      return {
        id,
        ...data,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt)
      } as Booking;
    } catch (error) {
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError(
        `Errore nel recupero della prenotazione ${id}`,
        'FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Crea una nuova prenotazione
   */
  public async createBooking(booking: InsertBooking): Promise<Booking> {
    // Validazione dei dati
    const validationErrors = RestaurantValidator.validateBookingData(booking);
    if (validationErrors.length > 0) {
      throw new RestaurantServiceError(
        `Dati prenotazione non validi: ${validationErrors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    try {
      const bookingId = SnowflakeIdGenerator.generateId();
      const bookingData = {
        ...booking,
        id: bookingId,
        createdAt: Timestamp.now()
      };

      // Rimuovi i campi undefined
      const cleanData = Object.fromEntries(
        Object.entries(bookingData).filter(([_, value]) => value !== undefined)
      );

      await addDoc(this.bookingsRef, cleanData);
      
      return { 
        ...cleanData,
        createdAt: toDate(cleanData.createdAt)
      } as Booking;
    } catch (error) {
      throw new RestaurantServiceError(
        'Errore nella creazione della prenotazione',
        'CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Aggiorna una prenotazione esistente
   */
  public async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking> {
    if (!RestaurantValidator.validateId(id)) {
      throw new RestaurantServiceError(
        'ID prenotazione non valido',
        'INVALID_BOOKING_ID'
      );
    }

    try {
      const q = query(this.bookingsRef, where('id', '==', id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new RestaurantServiceError(
          `Prenotazione ${id} non trovata`,
          'NOT_FOUND'
        );
      }
      
      const docSnap = snapshot.docs[0];
      const docRef = doc(this.db, 'bookings', docSnap.id);
      
      await updateDoc(docRef, updates);
      
      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data()!;
      
      return {
        id,
        ...updatedData,
        date: toDate(updatedData.date),
        createdAt: toDate(updatedData.createdAt)
      } as Booking;
    } catch (error) {
      if (error instanceof RestaurantServiceError) {
        throw error;
      }
      throw new RestaurantServiceError(
        `Errore nell'aggiornamento della prenotazione ${id}`,
        'UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Elimina una prenotazione
   */
  public async deleteBooking(id: number): Promise<boolean> {
    if (!RestaurantValidator.validateId(id)) {
      throw new RestaurantServiceError(
        'ID prenotazione non valido',
        'INVALID_BOOKING_ID'
      );
    }

    try {
      const q = query(this.bookingsRef, where('id', '==', id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return false;
      }
      
      const docSnap = snapshot.docs[0];
      const docRef = doc(this.db, 'bookings', docSnap.id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      throw new RestaurantServiceError(
        `Errore nell'eliminazione della prenotazione ${id}`,
        'DELETE_ERROR',
        error
      );
    }
  }
}

// ==========================================
// SEZIONE: SINGLETON INSTANCE
// ==========================================

/**
 * Istanza singleton del servizio ristoranti
 */
let restaurantServiceInstance: RestaurantService | null = null;

/**
 * Ottiene l'istanza singleton del servizio ristoranti
 */
export const getRestaurantService = (): RestaurantService => {
  if (!restaurantServiceInstance) {
    restaurantServiceInstance = new RestaurantService();
  }
  return restaurantServiceInstance;
};

// ==========================================
// SEZIONE: HOOK PERSONALIZZATI PER REACT
// ==========================================

/**
 * Hook personalizzato per React Query - utilizza l'istanza singleton
 */
export const useRestaurants = () => {
  const service = getRestaurantService();
  
  return {
    // Metodi ristoranti
    getAllRestaurants: () => service.getAllRestaurants(),
    getRestaurant: (id: number) => service.getRestaurant(id),
    createRestaurant: (data: InsertRestaurant) => service.createRestaurant(data),
    updateRestaurant: (id: number, updates: Partial<Restaurant>) => service.updateRestaurant(id, updates),
    deleteRestaurant: (id: number) => service.deleteRestaurant(id),
    extractRestaurantData: (url: string) => service.extractRestaurantData(url),
    
    // Metodi prenotazioni
    getAllBookings: () => service.getAllBookings(),
    getBookingsByRestaurant: (restaurantId: number) => service.getBookingsByRestaurant(restaurantId),
    getBooking: (id: number) => service.getBooking(id),
    createBooking: (data: InsertBooking) => service.createBooking(data),
    updateBooking: (id: number, updates: Partial<Booking>) => service.updateBooking(id, updates),
    deleteBooking: (id: number) => service.deleteBooking(id),
    
    // Validatori statici
    validateRestaurantData: RestaurantValidator.validateRestaurantData,
    validateBookingData: RestaurantValidator.validateBookingData,
    validateTripAdvisorUrl: RestaurantValidator.validateTripAdvisorUrl,
    
    // Istanza del servizio per uso diretto
    service
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
    const retryableCodes = ['FETCH_ERROR', 'NETWORK_ERROR', 'TIMEOUT_ERROR', 'CREATE_ERROR', 'UPDATE_ERROR'];
    return retryableCodes.includes(error.code || '');
  }
  return false;
};

/**
 * Utility per loggare errori in modo consistente
 */
export const logError = (context: string, error: unknown): void => {
  console.error(`[RestaurantService] ${context}:`, error);
  
  if (error instanceof RestaurantServiceError) {
    console.error(`- Code: ${error.code}`);
    console.error(`- Original Error:`, error.originalError);
  }
};