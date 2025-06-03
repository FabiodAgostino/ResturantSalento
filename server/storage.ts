// server/storage.ts - Storage finale corretto

import { FirestoreStorage } from "./firestore-storage";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Booking, CuisineType, InsertBooking, InsertRestaurant, Restaurant, User } from "@/lib/types";
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
    return new FirestoreStorage();
}