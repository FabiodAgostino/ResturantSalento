// server/storage.ts - Storage finale corretto
import { 
  users, 
  restaurants, 
  bookings, 
  type User, 
  type InsertUser, 
  type Restaurant, 
  type RestaurantDB,
  type InsertRestaurant, 
  type Booking, 
  type InsertBooking,
  convertDbToApp,
  convertAppToDb,
  type CuisineType
} from "@shared/schema";
import { FirestoreStorage } from "./firestore-storage";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
export interface IStorage {
  // Restaurant methods
  getAllRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, updates: Partial<Restaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;
  searchRestaurants(filters: {
    search?: string;
    cuisines?: string[];
    priceRange?: string;
    minRating?: number;
  }): Promise<Restaurant[]>;

  // Booking methods
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByRestaurant(restaurantId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
}


export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, RestaurantDB>; // Salva nel formato DB
  private bookings: Map<number, Booking>;
  private currentUserId: number;
  private currentRestaurantId: number;
  private currentBookingId: number;

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.bookings = new Map();
    this.currentUserId = 1;
    this.currentRestaurantId = 1;
    this.currentBookingId = 1;
  }


  // Restaurant methods
  async getAllRestaurants(): Promise<Restaurant[]> {
    const dbRestaurants = Array.from(this.restaurants.values());
    return dbRestaurants.map(convertDbToApp);
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const dbRestaurant = this.restaurants.get(id);
    return dbRestaurant ? convertDbToApp(dbRestaurant) : undefined;
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentRestaurantId++;
    
    
    // Crea direttamente il formato DB
    const dbRestaurant: RestaurantDB = {
      id,
      name: insertRestaurant.name,
      tripadvisorUrl: insertRestaurant.tripadvisorUrl,
      cuisines: JSON.stringify(insertRestaurant.cuisines), // JSON string per DB
      priceRange: insertRestaurant.priceRange,
      rating: insertRestaurant.rating,
      location: insertRestaurant.location,
      latitude: insertRestaurant.latitude || null,
      longitude: insertRestaurant.longitude || null,
      description: insertRestaurant.description || null,
      phone: insertRestaurant.phone || null,
      hours: insertRestaurant.hours || null,
      address: insertRestaurant.address || null,
      imageUrl: insertRestaurant.imageUrl || null,
      favorite: insertRestaurant.favorite || null,
      isApproved: true,
      createdAt: new Date()
    };

    
    this.restaurants.set(id, dbRestaurant);
    
    // Ritorna nel formato app
    const appRestaurant = convertDbToApp(dbRestaurant);
    
    return appRestaurant;
  }

  async updateRestaurant(id: number, updates: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const existingDb = this.restaurants.get(id);
    if (!existingDb) return undefined;

    // Converte updates dal formato app al formato DB
    const dbUpdates = convertAppToDb(updates);
    const updatedDb = { ...existingDb, ...dbUpdates } as RestaurantDB;
    
    this.restaurants.set(id, updatedDb);
    return convertDbToApp(updatedDb);
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  async searchRestaurants(filters: {
    search?: string;
    cuisines?: string[];
    priceRange?: string;
    minRating?: number;
  }): Promise<Restaurant[]> {
    const allRestaurants = await this.getAllRestaurants();
    
    return allRestaurants.filter(restaurant => {
      const matchesSearch = !filters.search || 
        restaurant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      // Filtro per multiple cuisines
      const matchesCuisines = !filters.cuisines || filters.cuisines.length === 0 ||
        filters.cuisines.some(filterCuisine => 
          restaurant.cuisines.includes(filterCuisine as CuisineType)
        );
      
      const matchesPrice = !filters.priceRange || restaurant.priceRange === filters.priceRange;
      const matchesRating = !filters.minRating || parseFloat(restaurant.rating) >= filters.minRating;

      const matches = matchesSearch && matchesCuisines && matchesPrice && matchesRating;
      return matches;
    });
  }

  // Booking methods (unchanged)
  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByRestaurant(restaurantId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.restaurantId === restaurantId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const booking: Booking = {
      ...insertBooking,
      id,
      createdAt: new Date(),
      notes: insertBooking.notes || null
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updated = { ...booking, ...updates };
    this.bookings.set(id, updated);
    return updated;
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }
}


export const storage: IStorage = createStorage();

  function createStorage(): IStorage {
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔍 Loading .env from:', envPath);

if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('❌ Error loading .env:', result.error);
  } else {
    console.log('✅ .env loaded successfully');
    
    // Debug delle variabili Firebase (senza mostrare le credenziali complete)
    console.log('🔧 Firebase Environment Check:');
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'MISSING');
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING');
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'MISSING');
    console.log('- USE_FIRESTORE:', process.env.USE_FIRESTORE);
  }
} else {
  console.error('❌ .env file not found at:', envPath);
}
  const useFirestore = process.env.USE_FIRESTORE === 'true' || 
                       process.env.NODE_ENV === 'production';
  
  if (useFirestore) {
    console.log('🔥 Usando Firestore come database');
    return new FirestoreStorage();
  } else {
    console.log('💾 Usando storage in memoria');
    return new MemStorage();
  }
}