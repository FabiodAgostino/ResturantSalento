import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Edit, Trash2, Plus } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { useToast } from "@/hooks/use-toast";
import { useBookings, useRestaurants } from "@/hooks/use-firebase";
import type { Booking, Restaurant } from "@/lib/types";

const Calendar = () => {
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    restaurantId: "",
    date: "",
    time: "",
    notes: "",
  });

  const { toast } = useToast();

  // Hook Firebase per prenotazioni e ristoranti
  const { 
    bookings, 
    loading: bookingsLoading, 
    error: bookingsError, 
    createBooking, 
    updateBooking, 
    deleteBooking 
  } = useBookings();

  const { 
    restaurants, 
    loading: restaurantsLoading 
  } = useRestaurants();

  const resetForm = () => {
    setFormData({
      restaurantId: "",
      date: "",
      time: "",
      notes: "",
    });
    setSelectedBooking(null);
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
        restaurantId: formData.restaurantId,
        date: new Date(formData.date + "T00:00:00"),
        time: formData.time,
        notes: formData.notes,
      });

      setIsAddBookingOpen(false);
      resetForm();
      toast({
        title: "Prenotazione creata",
        description: "La tua prenotazione al ristorante è stata creata con successo.",
      });
    } catch (error) {
      console.error("Errore nella creazione della prenotazione:", error);
      toast({
        title: "Errore",
        description: "Errore nella creazione della prenotazione. Riprova.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      await updateBooking(bookingId, updates);
      toast({
        title: "Prenotazione aggiornata",
        description: "La prenotazione è stata aggiornata con successo.",
      });
    } catch (error) {
      console.error("Errore nell'aggiornamento della prenotazione:", error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento della prenotazione. Riprova.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (confirm("Sei sicuro di voler eliminare questa prenotazione?")) {
      try {
        await deleteBooking(bookingId);
        toast({
          title: "Prenotazione eliminata",
          description: "La tua prenotazione è stata eliminata con successo.",
        });
      } catch (error) {
        console.error("Errore nell'eliminazione della prenotazione:", error);
        toast({
          title: "Errore",
          description: "Errore nell'eliminazione della prenotazione. Riprova.",
          variant: "destructive",
        });
      }
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
    };
  });

  // Filtra le prenotazioni future e ordinale per data
  const upcomingBookings = bookings
    .filter(booking => new Date(booking.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Stati di caricamento
  if (bookingsLoading || restaurantsLoading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--terracotta))]"></div>
          </div>
        </div>
      </main>
    );
  }

  // Gestione errori
  if (bookingsError) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Errore nel caricamento
                </h3>
                <p className="text-gray-600">{bookingsError}</p>
              </div>
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
                            <SelectItem key={restaurant.id} value={restaurant.id}>
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
                        onClick={() => setIsAddBookingOpen(false)}
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
          <CalendarView events={calendarEvents} />
        </div>

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
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
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
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-[hsl(var(--terracotta))] hover:text-[hsl(var(--saddle))]"
                          onClick={() => {
                            // TODO: Implementa modifica prenotazione
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
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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