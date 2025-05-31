// server/routes.ts - Routes completamente corrette
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRestaurantSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Restaurant routes
  app.get("/api/restaurants", async (req, res) => {
    try {
      const { search, cuisines, priceRange, minRating } = req.query;
      
      // Parse cuisines se è una stringa (dalla query string)
      let parsedCuisines: string[] | undefined;
      if (cuisines) {
        if (typeof cuisines === 'string') {
          try {
            parsedCuisines = JSON.parse(cuisines);
          } catch {
            parsedCuisines = [cuisines]; // Singola cucina
          }
        } else if (Array.isArray(cuisines)) {
          parsedCuisines = cuisines as string[];
        }
      }
      
      const filters = {
        search: search as string,
        cuisines: parsedCuisines,
        priceRange: priceRange as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined
      };

      console.log("API - Getting restaurants with filters:", filters);
      const restaurants = await storage.searchRestaurants(filters);
      console.log("API - Returning restaurants:", restaurants.length);
      
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    try {
      console.log("API - Creating restaurant with body:", req.body);
      
      // Assicurati che cuisines sia un array
      if (req.body.cuisines && !Array.isArray(req.body.cuisines)) {
        req.body.cuisines = [req.body.cuisines];
      }
      
      // Validazione con lo schema
      const validatedData = insertRestaurantSchema.parse(req.body);
      console.log("API - Validated data:", validatedData);
      
      const restaurant = await storage.createRestaurant(validatedData);
      console.log("API - Created restaurant:", restaurant);
      
      res.status(201).json(restaurant);
    } catch (error) {
      console.error("Restaurant creation error:", error);
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid restaurant data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  app.post("/api/restaurants/extract", async (req, res) => {
    try {
      console.log("=== EXTRACT ENDPOINT ===");
      console.log("Request body:", req.body);
      console.log("Content-Type:", req.headers['content-type']);
      
      const { url } = req.body;
      
      console.log("Extracted URL:", url);
      console.log("URL type:", typeof url);
      
      // Validazione più dettagliata
      if (!url) {
        console.log("ERROR: URL is missing or empty");
        return res.status(400).json({ 
          message: "URL is required",
          received: url
        });
      }
      
      if (typeof url !== 'string') {
        console.log("ERROR: URL is not a string:", typeof url);
        return res.status(400).json({ 
          message: "URL must be a string",
          received: typeof url
        });
      }
      
      // Trim dell'URL per rimuovere spazi
      const trimmedUrl = url.trim();
      console.log("Trimmed URL:", trimmedUrl);
      
      if (!trimmedUrl.includes('tripadvisor.com') && !trimmedUrl.includes('tripadvisor.it')) {
        console.log("ERROR: URL does not contain tripadvisor domain");
        return res.status(400).json({ 
          message: "Valid TripAdvisor URL required",
          received: trimmedUrl
        });
      }

      console.log("URL validation passed, proceeding with extraction...");

      // Web scraping implementation
      const response = await axios.get(trimmedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract restaurant name
      const name = $('.biGQs._P.hzzSG.rRtyp').first().text().trim() || 
                   $('h1').first().text().trim() || 
                   $('.HjBfq').first().text().trim() ||
                   "Restaurant";

      console.log("Extracted name:", name);

      // Extract rating
      const ratingText = $('.biGQs._P.pZUbB.KxBGd').first().text().trim();
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      const rating = ratingMatch ? ratingMatch[1] : "4.0";

      console.log("Extracted rating:", rating);

      // Extract price range
      let priceRange = "€€";
      $('.biGQs._P.pZUbB.KxBGd').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.includes('€€€€')) {
          priceRange = "€€€€";
        } else if (text.includes('€€€')) {
          priceRange = "€€€";
        } else if (text.includes('€€')) {
          priceRange = "€€";
        } else if (text.includes('€') && !text.includes('€€')) {
          priceRange = "€";
        }
      });

      console.log("Extracted price range:", priceRange);

      // Extract multiple cuisine types
      const cuisines: string[] = [];
      const cuisineMapping = {
        'pugliese': ['pugliese', 'apulian', 'puglia', 'salentina', 'salento', 'tipica pugliese'],
        'italiana': ['italiana', 'italian', 'italy', 'tradizionale italiana'],
        'mediterranea': ['mediterranea', 'mediterranean', 'mediter'],
        'pesce': ['pesce', 'seafood', 'fish', 'mare', 'frutti di mare', 'crudo', 'sushi', 'sashimi'],
        'barbecue': ['barbecue', 'grill', 'griglia', 'alla griglia', 'bbq', 'braceria'],
        'steakhouse': ['steakhouse', 'steak', 'bistecca', 'carne', 'beef', 'braceria']
      };

      console.log("Looking for cuisine types...");

      // Cerca nella classe specifica per le cuisines
      $('.biGQs._P.pZUbB.KxBGd').each((i, elem) => {
        const text = $(elem).text().trim().toLowerCase();
        console.log(`Cuisine text ${i}:`, text);
        
        Object.entries(cuisineMapping).forEach(([cuisineType, keywords]) => {
          if (keywords.some(keyword => text.includes(keyword))) {
            if (!cuisines.includes(cuisineType)) {
              cuisines.push(cuisineType);
              console.log(`Found cuisine: ${cuisineType} from text: ${text}`);
            }
          }
        });
      });

      // Fallback search in other areas
      if (cuisines.length === 0) {
        console.log("No cuisines found in main section, searching fallback areas...");
        
        $('[data-test-target="restaurant-detail-overview"]').find('span, div').each((i, elem) => {
          const text = $(elem).text().trim().toLowerCase();
          Object.entries(cuisineMapping).forEach(([cuisineType, keywords]) => {
            if (keywords.some(keyword => text.includes(keyword))) {
              if (!cuisines.includes(cuisineType)) {
                cuisines.push(cuisineType);
                console.log(`Found cuisine in fallback: ${cuisineType}`);
              }
            }
          });
        });

        // Search in breadcrumbs
        $('.breadcrumbs').find('span, a').each((i, elem) => {
          const text = $(elem).text().trim().toLowerCase();
          Object.entries(cuisineMapping).forEach(([cuisineType, keywords]) => {
            if (keywords.some(keyword => text.includes(keyword))) {
              if (!cuisines.includes(cuisineType)) {
                cuisines.push(cuisineType);
                console.log(`Found cuisine in breadcrumb: ${cuisineType}`);
              }
            }
          });
        });
      }

      // Default fallback
      if (cuisines.length === 0) {
        cuisines.push('italiana');
        console.log("No cuisines found, using default: italiana");
      }

      console.log("Final extracted cuisines:", cuisines);

      // Extract other data
      const description = $('.biGQs._P.pZUbB.avBIb.KxBGd').first().text().trim() ||
                         $('.biGQs._P.pZUbB.hmDzD').first().text().trim() ||
                         "Authentic restaurant serving local specialties";

      const address = $('.biGQs._P.fiohW.fOtGX').first().text().trim() ||
                     $('.AYHFM').first().text().trim() ||
                     "Salento, Puglia";

      // Extract coordinates
      let latitude = "40.3515";
      let longitude = "18.1750";
      let location = "Salento";

      // Cerca link di Google Maps
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && (href.includes('maps.google.com') || href.includes('goo.gl/maps'))) {
          console.log("Found maps link:", href);
          
          const coordMatch = href.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
          if (coordMatch) {
            latitude = coordMatch[1];
            longitude = coordMatch[2];
            console.log(`Extracted coordinates: ${latitude}, ${longitude}`);
          }
          
          // Extract location from address
          const addressMatch = href.match(/daddr=([^@&]+)/);
          if (addressMatch) {
            const addressParts = decodeURIComponent(addressMatch[1]).split(',');
            if (addressParts.length > 1) {
              location = addressParts[addressParts.length - 2].trim();
              console.log("Extracted location from maps:", location);
            }
          }
        }
      });

      // Fallback per location dall'indirizzo
      if (location === "Salento" && address) {
        const addressParts = address.split(',');
        if (addressParts.length > 1) {
          location = addressParts[addressParts.length - 1].trim();
        }
      }

      console.log("Final location:", location);

      // Extract phone (se disponibile)
      let phone = "";
      $('.biGQs._P.pZUbB.KxBGd').each((i, elem) => {
        const text = $(elem).text().trim();
        const phoneMatch = text.match(/(\+39\s?)?(\d{2,4}\s?\d{6,8}|\d{3}\s?\d{3}\s?\d{4})/);
        if (phoneMatch && !phone) {
          phone = phoneMatch[0];
          console.log("Extracted phone:", phone);
        }
      });

      const extracted = {
        name,
        cuisines, // Array di cuisines
        priceRange,
        rating,
        location,
        description,
        address,
        latitude,
        longitude,
        phone: phone || undefined
      };

      console.log("Final extracted data:", extracted);

      res.json({ extracted });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ 
        message: "Failed to extract restaurant data. The page might be protected or the structure has changed.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const booking = await storage.updateBooking(id, updates);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Booking update error:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBooking(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json({ message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Booking deletion error:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}