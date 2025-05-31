// client/src/hooks/use-firebase.ts
import { useState, useEffect } from 'react';
import { RestaurantService } from '@/lib/restaurant-service';
import type { Restaurant, Booking, InsertRestaurant, InsertBooking } from '@/lib/types';

// Hook per ristoranti
export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RestaurantService.getAllRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento ristoranti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const createRestaurant = async (restaurantData: InsertRestaurant) => {
    try {
      const newRestaurant = await RestaurantService.createRestaurant(restaurantData);
      setRestaurants(prev => [newRestaurant, ...prev]);
      return newRestaurant;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Errore nella creazione del ristorante');
    }
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    try {
      const updated = await RestaurantService.updateRestaurant(id, updates);
      if (updated) {
        setRestaurants(prev => prev.map(r => r.id === id ? updated : r));
      }
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Errore nell\'aggiornamento del ristorante');
    }
  };

  const deleteRestaurant = async (id: string) => {
    try {
      const success = await RestaurantService.deleteRestaurant(id);
      if (success) {
        setRestaurants(prev => prev.filter(r => r.id !== id));
      }
      return success;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Errore nella cancellazione del ristorante');
    }
  };

  const searchRestaurants = async (filters: {
    search?: string;
    cuisine?: string;
    priceRange?: string;
    minRating?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await RestaurantService.searchRestaurants(filters);
      setRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella ricerca');
    } finally {
      setLoading(false);
    }
  };

  return {
    restaurants,
    loading,
    error,
    fetchRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    searchRestaurants
  };
};

// Hook per prenotazioni
export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RestaurantService.getAllBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento prenotazioni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const createBooking = async (bookingData: InsertBooking) => {
    try {
      const newBooking = await RestaurantService.createBooking(bookingData);
      setBookings(prev => [newBooking, ...prev]);
      return newBooking;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Errore nella creazione della prenotazione');
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    try {
      const updated = await RestaurantService.updateBooking(id, updates);
      if (updated) {
        setBookings(prev => prev.map(b => b.id === id ? updated : b));
      }
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Errore nell\'aggiornamento della prenotazione');
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const success = await RestaurantService.deleteBooking(id);
      if (success) {
        setBookings(prev => prev.filter(b => b.id !== id));
      }
      return success;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Errore nella cancellazione della prenotazione');
    }
  };

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking
  };
};

// Hook per singolo ristorante
export const useRestaurant = (id: string) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RestaurantService.getRestaurant(id);
        setRestaurant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nel caricamento del ristorante');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRestaurant();
    }
  }, [id]);

  return { restaurant, loading, error };
};