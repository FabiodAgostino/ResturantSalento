// server/firestore-storage.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { IStorage } from "./storage";
import { Booking, InsertBooking, InsertRestaurant, Restaurant } from '@/lib/types';

// Helper function per convertire Timestamp di Firestore in Date
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return new Date();
}

let db: FirebaseFirestore.Firestore;

// Funzione per inizializzare Firebase
function initializeFirebase() {
  // Debug delle variabili d'ambiente
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error(`
❌ Firebase configuration incomplete! 
Please set the following environment variables in your .env file:
- FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || 'MISSING'}
- FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL || 'MISSING'}  
- FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING'}

You can get these from Firebase Console > Project Settings > Service Accounts > Generate new private key
    `);
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    
    console.log('🔥 Firebase Admin initialized successfully');
  }
  SnowflakeIdGenerator.setMachineId(100);
  const db = getFirestore();
  
  // Configura Firestore per ignorare i valori undefined
  db.settings({
    ignoreUndefinedProperties: true
  });
  
  return db;
}
export class FirestoreStorage implements IStorage {
  private readonly db: FirebaseFirestore.Firestore;
  private readonly usersCollection: FirebaseFirestore.CollectionReference;
  private readonly restaurantsCollection: FirebaseFirestore.CollectionReference;
  private readonly bookingsCollection: FirebaseFirestore.CollectionReference;

  constructor() {
    // Inizializza Firebase solo quando la classe viene istanziata
    this.db = initializeFirebase();
    
    // Collections references
    this.usersCollection = this.db.collection('users');
    this.restaurantsCollection = this.db.collection('restaurants');
    this.bookingsCollection = this.db.collection('bookings');
  }

  // Restaurant methods
  async getAllRestaurants(): Promise<Restaurant[]> {
    const snapshot = await this.restaurantsCollection.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: parseInt(doc.id),
        ...data,
        createdAt: toDate(data.createdAt)
      };
    }) as Restaurant[];
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const doc = await this.restaurantsCollection.doc(id.toString()).get();
    if (!doc.exists) return undefined;
    
    const data = doc.data();
    return {
      id,
      ...data,
      createdAt: toDate(data?.createdAt)
    } as Restaurant;
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    insertRestaurant.id = SnowflakeIdGenerator.generateId();
    const restaurantData: any = {
      ...insertRestaurant,
      isApproved: true,
      createdAt: new Date(),
    };

    // Rimuovi i campi undefined (Firestore non li accetta)
    Object.keys(restaurantData).forEach(key => {
      if (restaurantData[key] === undefined) {
        delete restaurantData[key];
      }
    });

    console.log('🔥 Data to save to Firestore:', JSON.stringify(restaurantData, null, 2));

    const docRef = await this.restaurantsCollection.add(restaurantData);
    
    return { 
      ...restaurantData,
      // Assicurati che i campi opzionali siano undefined se non presenti
      id: restaurantData.id,
      address: restaurantData.address || undefined,
      latitude: restaurantData.latitude || undefined,
      longitude: restaurantData.longitude || undefined,
      description: restaurantData.description || undefined,
      phone: restaurantData.phone || undefined,
      hours: restaurantData.hours || undefined,
      imageUrl: restaurantData.imageUrl || undefined
    };
  }

 async updateRestaurant(id: number, updates: Partial<Restaurant>): Promise<Restaurant | undefined> {
  try {
    // Query per trovare il documento con il campo id uguale al numero passato
    const query = this.restaurantsCollection.where('id', '==', id);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log(`Nessun ristorante trovato con id: ${id}`);
      return undefined;
    }
    
    // Dovrebbe esserci solo un documento con questo ID
    const doc = snapshot.docs[0];
    const docRef = doc.ref;
    
    // Aggiorna il documento
    await docRef.update(updates);
    
    // Ottieni i dati aggiornati
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    
    return {
      id,
      ...updatedData,
      createdAt: toDate(updatedData?.createdAt)
    } as Restaurant;
    
  } catch (error) {
    console.error(`Errore nell'aggiornamento del ristorante ${id}:`, error);
    throw error;
  }
}

  async deleteRestaurant(id: number): Promise<boolean> {
    try {
      await this.restaurantsCollection.doc(id.toString()).delete();
      return true;
    } catch (error) {
      return false;
    }
  }

  async searchRestaurants(filters: {
    search?: string;
    cuisine?: string;
    priceRange?: string;
    minRating?: number;
  }): Promise<Restaurant[]> {
    let query: FirebaseFirestore.Query = this.restaurantsCollection;

    // Applica filtri Firestore dove possibile
    if (filters.cuisine) {
      query = query.where('cuisine', '==', filters.cuisine);
    }
    
    if (filters.priceRange) {
      query = query.where('priceRange', '==', filters.priceRange);
    }

    const snapshot = await query.get();
    let restaurants = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: parseInt(doc.id),
        ...data,
        createdAt: toDate(data.createdAt)
      };
    }) as Restaurant[];

    // Applica filtri che richiedono elaborazione lato client
    if (filters.search) {
      restaurants = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.minRating) {
      restaurants = restaurants.filter(restaurant => 
        parseFloat(restaurant.rating) >= filters.minRating!
      );
    }

    return restaurants;
  }

  // Booking methods
  async getAllBookings(): Promise<Booking[]> {
    const snapshot = await this.bookingsCollection.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: parseInt(doc.id),
        ...data,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt)
      };
    }) as Booking[];
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const doc = await this.bookingsCollection.doc(id.toString()).get();
    if (!doc.exists) return undefined;
    
    const data = doc.data()!;
    return {
      id,
      ...data,
      date: toDate(data.date),
      createdAt: toDate(data.createdAt)
    } as Booking;
  }

  async getBookingsByRestaurant(restaurantId: number): Promise<Booking[]> {
    const snapshot = await this.bookingsCollection
      .where('restaurantId', '==', restaurantId)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: parseInt(doc.id),
        ...data,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt)
      };
    }) as Booking[];
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const bookingData: any = {
      ...insertBooking,
      createdAt: new Date()
    };

    // Rimuovi i campi undefined (Firestore non li accetta)
    Object.keys(bookingData).forEach(key => {
      if (bookingData[key] === undefined) {
        delete bookingData[key];
      }
    });

    const docRef = await this.bookingsCollection.add(bookingData);
    const id = parseInt(docRef.id);
    
    return { 
      id, 
      ...bookingData,
      notes: bookingData.notes || undefined
    };
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const docRef = this.bookingsCollection.doc(id.toString());
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    await docRef.update(updates);
    const updatedData = { ...doc.data(), ...updates };
    
    return {
      id,
      ...updatedData,
      date: toDate(updatedData.date),
      createdAt: toDate(updatedData.createdAt)
    } as Booking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    try {
      await this.bookingsCollection.doc(id.toString()).delete();
      return true;
    } catch (error) {
      return false;
    }
  }
}

class SnowflakeIdGenerator {
  private static sequence = 0;
  private static lastTimestamp = 0;
  private static readonly machineId: number = 1; // Puoi cambiare questo valore se necessario

  // Metodo per impostare il machineId se necessario
  static setMachineId(machineId: number): void {
    (this as any).machineId = machineId % 1024;
  }

  static generateId(): number {
    let timestamp = Date.now();

    // Se il timestamp è indietro nel tempo, aspetta
    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards');
    }

    // Se stesso timestamp, incrementa sequenza
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) % 4096; // Massimo 4096 per timestamp
      
      // Se la sequenza è piena, aspetta il prossimo ms
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // Combina: timestamp (41 bit) + machineId (10 bit) + sequence (12 bit)
    return ((timestamp - 1640995200000) << 22) | (this.machineId << 12) | this.sequence;
  }

  private static waitNextMillis(lastTimestamp: number): number {
    let timestamp = Date.now();
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now();
    }
    return timestamp;
  }
}