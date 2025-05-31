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

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
    
    console.log("Creating restaurant with input:", insertRestaurant);
    
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
      isApproved: true,
      createdAt: new Date()
    };

    console.log("DB restaurant to store:", dbRestaurant);
    
    this.restaurants.set(id, dbRestaurant);
    
    // Ritorna nel formato app
    const appRestaurant = convertDbToApp(dbRestaurant);
    console.log("Returning app restaurant:", appRestaurant);
    
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
    
    console.log("Filtering restaurants with filters:", filters);
    console.log("Total restaurants:", allRestaurants.length);
    
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
      
      if (filters.cuisines && filters.cuisines.length > 0) {
        console.log(`Restaurant ${restaurant.name}:`, {
          cuisines: restaurant.cuisines,
          filterCuisines: filters.cuisines,
          matchesCuisines,
          matches
        });
      }

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

export const storage = new MemStorage();