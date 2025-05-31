import { users, restaurants, bookings, type User, type InsertUser, type Restaurant, type InsertRestaurant, type Booking, type InsertBooking } from "@shared/schema";

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
    cuisine?: string;
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
  private restaurants: Map<number, Restaurant>;
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
    
    // Inizializza con dati di esempio
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Aggiungi alcuni ristoranti di esempio del Salento
    const sampleRestaurants: Omit<Restaurant, 'id'>[] = [
      {
        name: "Osteria del Borgo",
        tripadvisorUrl: "https://www.tripadvisor.it/Restaurant_Review-g187884-d12345678",
        cuisine: "pugliese",
        priceRange: "€€",
        rating: "4.5",
        location: "Lecce Centro",
        latitude: "40.3515",
        longitude: "18.1750",
        description: "Autentica cucina pugliese nel cuore di Lecce, con specialità locali e ingredienti freschi",
        phone: "+39 0832 123456",
        hours: "12:00-15:00, 19:00-23:00",
        address: "Via Palmieri 15, Lecce",
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        isApproved: true,
        createdAt: new Date('2024-01-15')
      },
      {
        name: "Il Pescatore",
        tripadvisorUrl: "https://www.tripadvisor.it/Restaurant_Review-g187884-d87654321",
        cuisine: "pesce",
        priceRange: "€€€",
        rating: "4.7",
        location: "Gallipoli",
        latitude: "40.0559",
        longitude: "17.9926",
        description: "Ristorante sul mare con pesce freschissimo e vista mozzafiato sul tramonto",
        phone: "+39 0833 987654",
        hours: "19:00-24:00",
        address: "Lungomare Marconi 8, Gallipoli",
        imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        isApproved: true,
        createdAt: new Date('2024-01-20')
      },
      {
        name: "Trattoria della Nonna",
        tripadvisorUrl: "https://www.tripadvisor.it/Restaurant_Review-g187884-d11223344",
        cuisine: "italiana",
        priceRange: "€",
        rating: "4.3",
        location: "Otranto",
        latitude: "40.1439",
        longitude: "18.4903",
        description: "Cucina casalinga della tradizione, come quella della nonna. Ambiente familiare e accogliente",
        phone: "+39 0836 555777",
        hours: "12:00-14:30, 19:30-22:30",
        address: "Via Castello 22, Otranto",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        isApproved: true,
        createdAt: new Date('2024-02-01')
      },
      {
        name: "Masseria San Domenico",
        tripadvisorUrl: "https://www.tripadvisor.it/Restaurant_Review-g187884-d99887766",
        cuisine: "mediterranea",
        priceRange: "€€€€",
        rating: "4.9",
        location: "Fasano",
        latitude: "40.8394",
        longitude: "17.3640",
        description: "Elegante ristorante in masseria storica, cucina gourmet con prodotti del territorio",
        phone: "+39 080 482 7769",
        hours: "19:30-23:00",
        address: "SS 379 Km 27, Fasano",
        imageUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        isApproved: true,
        createdAt: new Date('2024-02-10')
      },
      {
        name: "Braceria del Salento",
        tripadvisorUrl: "https://www.tripadvisor.it/Restaurant_Review-g187884-d55443322",
        cuisine: "barbecue",
        priceRange: "€€",
        rating: "4.4",
        location: "Taranto",
        latitude: "40.4677",
        longitude: "17.2507",
        description: "Specialità alla griglia con carni selezionate e contorni della tradizione pugliese",
        phone: "+39 099 123 4567",
        hours: "19:00-23:30",
        address: "Via Dante 45, Taranto",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
        isApproved: true,
        createdAt: new Date('2024-02-15')
      }
    ];

    // Aggiungi i ristoranti di esempio
    sampleRestaurants.forEach(restaurantData => {
      const id = this.currentRestaurantId++;
      const restaurant: Restaurant = {
        ...restaurantData,
        id,
        isApproved: restaurantData.isApproved ?? true,
        createdAt: restaurantData.createdAt || new Date()
      };
      this.restaurants.set(id, restaurant);
    });
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
    return Array.from(this.restaurants.values()).map(restaurant => ({
      ...restaurant,
      // Assicurati che tutte le proprietà necessarie siano presenti
      isApproved: restaurant.isApproved ?? true,
      createdAt: restaurant.createdAt || new Date(),
      description: restaurant.description || "Ristorante tradizionale",
      phone: restaurant.phone || null,
      hours: restaurant.hours || null,
      address: restaurant.address || null,
      imageUrl: restaurant.imageUrl || null,
      latitude: restaurant.latitude || "40.3515",
      longitude: restaurant.longitude || "18.1750"
    }));
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;
    
    return {
      ...restaurant,
      isApproved: restaurant.isApproved ?? true,
      createdAt: restaurant.createdAt || new Date()
    };
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentRestaurantId++;
    const restaurant: Restaurant = {
      ...insertRestaurant,
      id,
      isApproved: true, // Auto-approva per la demo
      createdAt: new Date(),
      address: insertRestaurant.address || null,
      latitude: insertRestaurant.latitude || "40.3515",
      longitude: insertRestaurant.longitude || "18.1750",
      description: insertRestaurant.description || "Ristorante tradizionale",
      phone: insertRestaurant.phone || null,
      hours: insertRestaurant.hours || null,
      imageUrl: insertRestaurant.imageUrl || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: number, updates: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;

    const updated = { 
      ...restaurant, 
      ...updates,
      isApproved: updates.isApproved ?? restaurant.isApproved ?? true
    };
    this.restaurants.set(id, updated);
    return updated;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  async searchRestaurants(filters: {
    search?: string;
    cuisine?: string;
    priceRange?: string;
    minRating?: number;
  }): Promise<Restaurant[]> {
    const restaurants = await this.getAllRestaurants();
    
    return restaurants.filter(restaurant => {
      // Filtro per approvazione
      if (!restaurant.isApproved) return false;
      
      const matchesSearch = !filters.search || 
        restaurant.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCuisine = !filters.cuisine || restaurant.cuisine === filters.cuisine;
      const matchesPrice = !filters.priceRange || restaurant.priceRange === filters.priceRange;
      const matchesRating = !filters.minRating || parseFloat(restaurant.rating) >= filters.minRating;

      return matchesSearch && matchesCuisine && matchesPrice && matchesRating;
    });
  }

  // Booking methods
  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).map(booking => ({
      ...booking,
      createdAt: booking.createdAt || new Date(),
      notes: booking.notes || null
    }));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    return {
      ...booking,
      createdAt: booking.createdAt || new Date(),
      notes: booking.notes || null
    };
  }

  async getBookingsByRestaurant(restaurantId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.restaurantId === restaurantId)
      .map(booking => ({
        ...booking,
        createdAt: booking.createdAt || new Date(),
        notes: booking.notes || null
      }));
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

  // Metodi di utilità per debugging
  getStats() {
    return {
      totalRestaurants: this.restaurants.size,
      approvedRestaurants: Array.from(this.restaurants.values()).filter(r => r.isApproved).length,
      totalBookings: this.bookings.size,
      totalUsers: this.users.size
    };
  }

  // Metodo per ripulire i dati
  clearAllData() {
    this.users.clear();
    this.restaurants.clear();
    this.bookings.clear();
    this.currentUserId = 1;
    this.currentRestaurantId = 1;
    this.currentBookingId = 1;
  }
}

export const storage = new MemStorage();