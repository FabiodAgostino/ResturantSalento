import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  type DocumentData 
} from 'firebase/firestore';
import { db } from './firebase-config';
import type { Restaurant, InsertRestaurant, Booking, InsertBooking } from './types';

// Collections
const RESTAURANTS_COLLECTION = 'restaurants';
const BOOKINGS_COLLECTION = 'bookings';

export class RestaurantService {
  // Restaurant methods
  static async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      const querySnapshot = await getDocs(collection(db, RESTAURANTS_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw new Error('Failed to fetch restaurants');
    }
  }

  static async getRestaurant(id: string): Promise<Restaurant | null> {
    try {
      const docRef = doc(db, RESTAURANTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Restaurant;
      }
      return null;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      throw new Error('Failed to fetch restaurant');
    }
  }

  static async createRestaurant(restaurantData: InsertRestaurant): Promise<Restaurant> {
    try {
      const docRef = await addDoc(collection(db, RESTAURANTS_COLLECTION), {
        ...restaurantData,
        isApproved: false,
        createdAt: serverTimestamp()
      });
      
      // Get the created document
      const newDoc = await getDoc(docRef);
      return {
        id: newDoc.id,
        ...newDoc.data()
      } as Restaurant;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw new Error('Failed to create restaurant');
    }
  }

  static async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<Restaurant | null> {
    try {
      const docRef = doc(db, RESTAURANTS_COLLECTION, id);
      await updateDoc(docRef, updates);
      
      // Return updated document
      return await this.getRestaurant(id);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      throw new Error('Failed to update restaurant');
    }
  }

  static async deleteRestaurant(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, RESTAURANTS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return false;
    }
  }

  static async searchRestaurants(filters: {
    search?: string;
    cuisine?: string;
    priceRange?: string;
    minRating?: number;
  }): Promise<Restaurant[]> {
    try {
      let q = query(collection(db, RESTAURANTS_COLLECTION));

      // Apply filters
      if (filters.cuisine) {
        q = query(q, where('cuisine', '==', filters.cuisine));
      }
      
      if (filters.priceRange) {
        q = query(q, where('priceRange', '==', filters.priceRange));
      }

      if (filters.minRating) {
        q = query(q, where('rating', '>=', filters.minRating.toString()));
      }

      // Add ordering
      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      let restaurants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];

      // Apply text search client-side (Firestore doesn't support full-text search)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        restaurants = restaurants.filter(restaurant => 
          restaurant.name.toLowerCase().includes(searchTerm) ||
          restaurant.description?.toLowerCase().includes(searchTerm) ||
          restaurant.location.toLowerCase().includes(searchTerm)
        );
      }

      return restaurants;
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw new Error('Failed to search restaurants');
    }
  }

  // Booking methods
  static async getAllBookings(): Promise<Booking[]> {
    try {
      const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate() // Convert Firestore timestamp to Date
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  static async getBooking(id: string): Promise<Booking | null> {
    try {
      const docRef = doc(db, BOOKINGS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          date: data.date.toDate()
        } as Booking;
      }
      return null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw new Error('Failed to fetch booking');
    }
  }

  static async createBooking(bookingData: InsertBooking): Promise<Booking> {
    try {
      const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
        ...bookingData,
        createdAt: serverTimestamp()
      });
      
      const newDoc = await getDoc(docRef);
      const data = newDoc.data()!;
      return {
        id: newDoc.id,
        ...data,
        date: data.date.toDate()
      } as Booking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  static async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    try {
      const docRef = doc(db, BOOKINGS_COLLECTION, id);
      await updateDoc(docRef, updates);
      
      return await this.getBooking(id);
    } catch (error) {
      console.error('Error updating booking:', error);
      throw new Error('Failed to update booking');
    }
  }

  static async deleteBooking(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  }

  static async getBookingsByRestaurant(restaurantId: string): Promise<Booking[]> {
    try {
      const q = query(
        collection(db, BOOKINGS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching restaurant bookings:', error);
      throw new Error('Failed to fetch restaurant bookings');
    }
  }
}