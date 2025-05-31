// shared/schema.ts - Schema finale corretto
import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tripadvisorUrl: text("tripadvisor_url").notNull(),
  // Salviamo come JSON string nel DB
  cuisines: text("cuisines").notNull(), // JSON stringificato: '["italiana", "mediterranea"]'
  priceRange: text("price_range").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  description: text("description"),
  phone: text("phone"),
  hours: text("hours"),
  address: text("address"),
  imageUrl: text("image_url"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").references(() => restaurants.id).notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Tipi di cucina validi
const VALID_CUISINES = [
  "italiana", 
  "mediterranea", 
  "pesce", 
  "barbecue", 
  "steakhouse", 
  "pugliese"
] as const;

export type CuisineType = typeof VALID_CUISINES[number];

// Schema per l'input che accetta array di stringhe
export const insertRestaurantSchema = z.object({
  name: z.string().min(1, "Nome richiesto"),
  tripadvisorUrl: z.string().url("URL TripAdvisor valido richiesto"),
  cuisines: z.array(z.enum(VALID_CUISINES)).min(1, "Almeno un tipo di cucina è richiesto"),
  priceRange: z.enum(["€", "€€", "€€€", "€€€€"]),
  rating: z.string().regex(/^\d+(\.\d)?$/, "Rating valido richiesto"),
  location: z.string().min(1, "Località richiesta"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  hours: z.string().optional(),
  address: z.string().optional(),
  imageUrl: z.string().optional()
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true
});

// Tipi TypeScript
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

// Tipo per il database (quello che ritorna drizzle)
export type RestaurantDB = typeof restaurants.$inferSelect;

// Tipo per l'applicazione (quello che usa il frontend)
export type Restaurant = {
  id: number;
  name: string;
  tripadvisorUrl: string;
  cuisines: CuisineType[]; // Array di cuisine types
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
};

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Keep existing user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Utility functions per conversione tra app e database
export const convertDbToApp = (dbRestaurant: RestaurantDB): Restaurant => {
  let cuisines: CuisineType[];
  try {
    cuisines = JSON.parse(dbRestaurant.cuisines);
  } catch {
    // Fallback per compatibilità con dati esistenti
    cuisines = [dbRestaurant.cuisines as CuisineType];
  }
  
  return {
    id: dbRestaurant.id,
    name: dbRestaurant.name,
    tripadvisorUrl: dbRestaurant.tripadvisorUrl,
    cuisines,
    priceRange: dbRestaurant.priceRange,
    rating: dbRestaurant.rating,
    location: dbRestaurant.location,
    latitude: dbRestaurant.latitude || undefined,
    longitude: dbRestaurant.longitude || undefined,
    description: dbRestaurant.description || undefined,
    phone: dbRestaurant.phone || undefined,
    hours: dbRestaurant.hours || undefined,
    address: dbRestaurant.address || undefined,
    imageUrl: dbRestaurant.imageUrl || undefined,
    isApproved: dbRestaurant.isApproved || undefined,
    createdAt: dbRestaurant.createdAt || undefined
  };
};

export const convertAppToDb = (appRestaurant: Partial<Restaurant>): Partial<RestaurantDB> => {
  const result: any = { ...appRestaurant };
  
  if (appRestaurant.cuisines) {
    result.cuisines = JSON.stringify(appRestaurant.cuisines);
  }
  
  // Converti undefined in null per il database
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      result[key] = null;
    }
  });
  
  return result;
};