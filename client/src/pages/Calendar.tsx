import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Edit, Trash2, Plus, Clock, MapPin, Users, AlertTriangle, X } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { useToast } from "@/hooks/use-toast";
import { useRestaurants, formatServiceError, logError } from "../../services/restaurant-service";
import type { Booking, Restaurant } from "@/lib/types";

const Calendar = () => {
  // Stati per i dati
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Stati per l'UI
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    restaurantId: "",
    date: "",
    time: "",
    notes: "",
  });

  const { toast } = useToast();

  // Hook Firebase per prenotazioni e ristoranti
  const { 
    getAllRestaurants,
    getAllBookings,
    createBooking,
    updateBooking,
    deleteBooking
  } = useRestaurants();

  // Carica ristoranti e prenotazioni all'inizializzazione
  useEffect(() => {
    const loadData = async () => {
      try {
        setRestaurantsLoading(true);
        setRestaurantsError(null);
        
        const restaurantsData = await getAllRestaurants();
        setRestaurants(restaurantsData);
      } catch (error) {
        const errorMessage = formatServiceError(error);
        setRestaurantsError(errorMessage);
        logError('Caricamento ristoranti in Calendar', error);
      } finally {
        setRestaurantsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setBookingsLoading(true);
        setBookingsError(null);
        
        const bookingsData = await getAllBookings();
        setBookings(bookingsData);
      } catch (error) {
        const errorMessage = formatServiceError(error);
        setBookingsError(errorMessage);
        logError('Caricamento prenotazioni in Calendar', error);
      } finally {
        setBookingsLoading(false);
      }
    };

    loadBookings();
  }, []);

  const resetForm = () => {
    setFormData({
      restaurantId: "",
      date: "",
      time: "",
      notes: "",
    });
    setSelectedBooking(null);
  };

  const reloadBookings = async () => {
    try {
      const bookingsData = await getAllBookings();
      setBookings(bookingsData);
    } catch (error) {
      logError('Ricaricamento prenotazioni', error);
    }
  };

  // Gestione click su giorno del calendario
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayDetailOpen(true);
  };

  // Ottieni prenotazioni per una data specifica
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.restaurantId || !formData.date || !formData.time) {
      toast({
        title: "Informazioni mancanti",
        description: "Compila tutti i campi obbligatori.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBooking({
        restaurantId: parseInt(formData.restaurantId),
        date: new Date(formData.date + "T00:00:00"),
        time: formData.time,
        notes: formData.notes,
      });

      setIsAddBookingOpen(false);
      resetForm();
      await reloadBookings();
      
      toast({
        title: "Prenotazione creata",
        description: "La tua prenotazione al ristorante è stata creata con successo.",
      });
    } catch (error) {
      const errorMessage = formatServiceError(error);
      logError('Creazione prenotazione', error);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    setDeletingBookingId(bookingId);
    
    try {
      await deleteBooking(bookingId);
      await reloadBookings();
      
      toast({
        title: "Prenotazione eliminata",
        description: "La prenotazione è stata eliminata con successo.",
        variant: "default",
      });
    } catch (error) {
      const errorMessage = formatServiceError(error);
      logError('Eliminazione prenotazione', error);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeletingBookingId(null);
    }
  };

  // Converti le prenotazioni in eventi del calendario
  const calendarEvents = bookings.map(booking => {
    const restaurant = restaurants.find(r => r.id === booking.restaurantId);
    return {
      id: booking.id,
      title: `${restaurant?.name || 'Ristorante'} ${booking.time}`,
      date: new Date(booking.date),
      color: 'bg-[hsl(var(--terracotta))] text-white',
      onClick: () => handleDayClick(new Date(booking.date)), // Aggiungi handler per click
    };
  });

  // Filtra le prenotazioni future e ordinale per data
  const upcomingBookings = bookings
    .filter(booking => new Date(booking.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Ottieni prenotazioni per la data selezionata
  const dayBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  // Formatta la data selezionata
  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Gestione aggiunta prenotazione rapida dal day detail
  const handleQuickBooking = () => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: dateString }));
    }
    setIsDayDetailOpen(false);
    setIsAddBookingOpen(true);
  };

  // Stati di caricamento
  if (bookingsLoading || restaurantsLoading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
              Calendario Ristoranti
            </h2>
            <p className="text-lg text-[hsl(var(--dark-slate))]/70">
              Pianifica le tue avventure culinarie
            </p>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--terracotta))] mx-auto mb-4"></div>
              <p className="text-[hsl(var(--dark-slate))]/70">
                Caricamento calendario e prenotazioni...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Gestione errori
  if (bookingsError || restaurantsError) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
              Calendario Ristoranti
            </h2>
          </div>
          
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-red-500 mb-4">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                Errore nel caricamento
              </h3>
              <p className="text-[hsl(var(--dark-slate))]/70 mb-6">
                {bookingsError || restaurantsError}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
              >
                Riprova
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Calendario Ristoranti
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Pianifica le tue avventure culinarie
          </p>
        </div>

        {/* Header Calendario */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <CalendarIcon className="w-6 h-6 text-[hsl(var(--terracotta))]" />
                <h3 className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
                  Le tue prenotazioni
                </h3>
              </div>
              
              <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]">
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi prenotazione
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuova prenotazione</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    <div>
                      <Label htmlFor="restaurant">Ristorante *</Label>
                      <Select 
                        value={formData.restaurantId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, restaurantId: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un ristorante" />
                        </SelectTrigger>
                        <SelectContent>
                          {restaurants.map(restaurant => (
                            <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                              {restaurant.name} - {restaurant.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="time">Orario *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Note</Label>
                      <Textarea
                        id="notes"
                        placeholder="Richieste speciali, numero di ospiti, ecc."
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsAddBookingOpen(false);
                          resetForm();
                        }}
                      >
                        Annulla
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                      >
                        Crea prenotazione
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Calendario */}
        <div className="mb-8">
          <CalendarView 
            events={calendarEvents} 
            onDayClick={handleDayClick}
          />
        </div>

        {/* Day Detail Modal */}
        <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl font-display font-bold text-[hsl(var(--dark-slate))] mb-2">
                    {selectedDate ? formatSelectedDate(selectedDate) : ''}
                  </DialogTitle>
                  <p className="text-[hsl(var(--dark-slate))]/60">
                    {dayBookings.length} prenotazion{dayBookings.length !== 1 ? 'i' : 'e'} in programma
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDayDetailOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Header con azioni */}
              <div className="flex justify-between items-center pb-4 border-b">
                <div className="flex items-center text-[hsl(var(--terracotta))]">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  <span className="font-medium">Prenotazioni del giorno</span>
                </div>
                <Button
                  onClick={handleQuickBooking}
                  size="sm"
                  className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuova prenotazione
                </Button>
              </div>

              {/* Lista prenotazioni */}
              {dayBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--dark-slate))] mb-2">
                    Nessuna prenotazione
                  </h3>
                  <p className="text-[hsl(var(--dark-slate))]/60 mb-6">
                    Non hai ancora prenotazioni per questo giorno.
                  </p>
                  <Button
                    onClick={handleQuickBooking}
                    className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi prenotazione
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayBookings.map((booking, index) => {
                    const restaurant = restaurants.find(r => r.id === booking.restaurantId);
                    const isDeleting = deletingBookingId === booking.id;
                    
                    return (
                      <div 
                        key={booking.id} 
                        className="group relative bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                      >
                        {/* Badge orario */}
                        <div className="absolute -top-2 left-6">
                          <div className="bg-[hsl(var(--terracotta))] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {booking.time}
                          </div>
                        </div>

                        <div className="pt-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                                {restaurant?.name || 'Ristorante sconosciuto'}
                              </h4>
                              
                              <div className="space-y-2">
                                <div className="flex items-center text-[hsl(var(--dark-slate))]/70">
                                  <MapPin className="w-4 h-4 mr-2 text-[hsl(var(--terracotta))]" />
                                  <span className="text-sm">{restaurant?.location}</span>
                                  {restaurant?.priceRange && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span className="text-sm font-medium">{restaurant.priceRange}</span>
                                    </>
                                  )}
                                </div>
                                
                                {booking.notes && (
                                  <div className="flex items-start text-[hsl(var(--dark-slate))]/60">
                                    <Users className="w-4 h-4 mr-2 mt-0.5 text-[hsl(var(--terracotta))] flex-shrink-0" />
                                    <span className="text-sm italic">{booking.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Azioni */}
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-[hsl(var(--terracotta))] hover:text-[hsl(var(--saddle))] hover:bg-[hsl(var(--terracotta))]/10"
                                onClick={() => {
                                  toast({
                                    title: "Funzionalità in arrivo",
                                    description: "La modifica delle prenotazioni sarà disponibile presto."
                                  });
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={isDeleting}
                                onClick={() => {
                                  if (window.confirm(`Sei sicuro di voler eliminare la prenotazione da ${restaurant?.name || 'questo ristorante'}?`)) {
                                    handleDeleteBooking(booking.id);
                                  }
                                }}
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Decorazione */}
                        <div className="absolute right-4 bottom-4 opacity-5">
                          <CalendarIcon className="w-8 h-8" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer con statistiche */}
              {dayBookings.length > 0 && (
                <div className="pt-4 border-t bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm text-[hsl(var(--dark-slate))]/60">
                    <span>Giornata culinaria completa!</span>
                    <span>{dayBookings.length} ristorante{dayBookings.length !== 1 ? 'i' : ''} da visitare</span>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Prossime prenotazioni */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Prossime prenotazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[hsl(var(--dark-slate))] mb-2">
                  Nessuna prenotazione futura
                </h3>
                <p className="text-[hsl(var(--dark-slate))]/70 mb-4">
                  Inizia a pianificare la tua prossima avventura culinaria!
                </p>
                <Button
                  onClick={() => setIsAddBookingOpen(true)}
                  className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                >
                  Aggiungi la tua prima prenotazione
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(booking => {
                  const restaurant = restaurants.find(r => r.id === booking.restaurantId);
                  const bookingDate = new Date(booking.date);
                  
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => handleDayClick(bookingDate)}>
                      <div className="flex items-center">
                        <div className="bg-[hsl(var(--terracotta))] text-white rounded-lg p-3 mr-4">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[hsl(var(--dark-slate))]">
                            {restaurant?.name || 'Ristorante sconosciuto'}
                          </h4>
                          <p className="text-[hsl(var(--dark-slate))]/70">
                            {bookingDate.toLocaleDateString('it-IT', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} alle {booking.time}
                          </p>
                          <p className="text-[hsl(var(--dark-slate))]/60 text-sm">
                            {restaurant?.location} • {restaurant?.priceRange}
                          </p>
                          {booking.notes && (
                            <p className="text-[hsl(var(--dark-slate))]/60 text-sm mt-1">
                              Note: {booking.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-[hsl(var(--dark-slate))]/40">
                        <span className="text-sm">Clicca per dettagli</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Calendar;