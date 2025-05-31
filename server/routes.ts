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
      const { search, cuisine, priceRange, minRating } = req.query;
      
      const filters = {
        search: search as string,
        cuisine: cuisine as string,
        priceRange: priceRange as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined
      };

      const restaurants = await storage.searchRestaurants(filters);
      res.json(restaurants);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      const restaurant = await storage.createRestaurant(validatedData);
      res.status(201).json(restaurant);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const { url } = req.body;
      
      if (!url || !url.includes('tripadvisor.com')) {
        return res.status(400).json({ message: "Valid TripAdvisor URL required" });
      }

      // Real web scraping implementation
      const response = await axios.get(url, {
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
                   "Restaurant";

      // Extract rating
      const ratingText = $('.biGQs._P.pZUbB.KxBGd').first().text().trim();
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      const rating = ratingMatch ? ratingMatch[1] : "4.0";

      // Extract price range - look for € symbols in various elements
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

      // Extract cuisine types
      let cuisine = "italiana";
      $('.HUMGB.cPbcf .biGQs._P.pZUbB.KxBGd').each((i, elem) => {
        const text = $(elem).text().trim().toLowerCase();
        if (text.includes('pugliese') || text.includes('apulian')) {
          cuisine = "pugliese";
        } else if (text.includes('pesce') || text.includes('seafood') || text.includes('fish')) {
          cuisine = "pesce";
        } else if (text.includes('mediterranea') || text.includes('mediterranean')) {
          cuisine = "mediterranea";
        } else if (text.includes('barbecue') || text.includes('grill')) {
          cuisine = "barbecue";
        } else if (text.includes('steakhouse') || text.includes('steak')) {
          cuisine = "steakhouse";
        } else if (text.includes('italiana') || text.includes('italian')) {
          cuisine = "italiana";
        }
      });

      // Extract description
      const description = $('.biGQs._P.pZUbB.avBIb.KxBGd').first().text().trim() ||
                         "Authentic restaurant serving local specialties";

      // Extract address
      const address = $('.biGQs._P.fiohW.fOtGX').first().text().trim() ||
                     "Salento, Puglia";

      // Extract coordinates from Google Maps link
      let latitude = "40.3515";
      let longitude = "18.1750";
      let location = "Salento";

      $('.BMQDV._F.Gv.bYExr.SwZTJ.FGwzt.ukgoS').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('maps.google.com')) {
          const coordMatch = href.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
          if (coordMatch) {
            latitude = coordMatch[1];
            longitude = coordMatch[2];
          }
          
          // Extract location from address
          const addressMatch = href.match(/daddr=([^@]+)@/);
          if (addressMatch) {
            const addressParts = decodeURIComponent(addressMatch[1]).split(',');
            if (addressParts.length > 1) {
              location = addressParts[addressParts.length - 2].trim();
            }
          }
        }
      });

      const extracted = {
        name,
        cuisine,
        priceRange,
        rating,
        location,
        description,
        address,
        latitude,
        longitude
      };

      res.json({ extracted });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ 
        message: "Failed to extract restaurant data. The page might be protected or the structure has changed." 
      });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
