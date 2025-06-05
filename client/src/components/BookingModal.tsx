import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InsertBooking, Restaurant } from "@/lib/types";
import { useRestaurants, formatServiceError, logError } from "../../services/restaurant-service"

var loading: Boolean;
interface BookingModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}
const BookingModal = ({ restaurant, isOpen, onClose }: BookingModalProps) => {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    notes: "",
  });

  const { toast } = useToast();
  const resetForm = () => {
    setFormData({
      date: "",
      time: "",
      notes: "",
    });
  };
  const { createBooking  } = useRestaurants();

   const handleSubmit = async (e: React.FormEvent) => {
    loading = true;
    e.preventDefault();
    if (!restaurant || !formData.date || !formData.time) {
      toast({
        title: "Informazioni Mancanti",
        description: "Per favore compila tutti i campi obbligatori.",
        variant: "destructive",
      });
      return;
    }

    // Verifica che la data non sia nel passato
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Data Non Valida",
        description: "Non puoi prenotare per una data passata.",
        variant: "destructive",
      });
      return;
    }
   const bookingData: InsertBooking = {
      restaurantId: Number(restaurant.id), // Assicurati che sia un numero
      date: new Date(formData.date + "T00:00:00.000Z"), // Formato ISO completo
      time: formData.time.trim(), // Rimuovi spazi extra
      notes: formData.notes?.trim() || undefined, // Gestisci stringhe vuote
    };
    try
    {
      var booking = await createBooking(bookingData);
      if(booking)
      {
        toast({
        title: "Prenotazione Aggiunta",
        description: "La prenotazione è stata aggiunta",
      });
       handleClose();
      }
    }catch(ex)
    {

    }
    finally
    {
      loading = false;
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!restaurant) return null;

  // Suggerimenti orari comuni per ristoranti
  const timeSlots = [
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-[hsl(var(--dark-slate))] flex items-center">
            <Calendar className="w-5 h-5 text-[hsl(var(--terracotta))] mr-2" />
            Marca prenotazione per {restaurant.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informazioni Ristorante */}
          <div className="bg-[hsl(var(--warm-beige))] p-3 rounded-lg">
            <h4 className="font-semibold text-[hsl(var(--dark-slate))]">{restaurant.name}</h4>
            <p className="text-sm text-[hsl(var(--dark-slate))]/70">{restaurant.location}</p>
           <p className="text-sm text-[hsl(var(--terracotta))]">
            {restaurant.priceRange} • {restaurant.cuisines.join(', ')}
          </p>
          </div>
          

          {/* Data */}
          <div>
            <Label htmlFor="booking-date" className="text-[hsl(var(--dark-slate))] font-medium">
              Data della Prenotazione *
            </Label>
            <Input
              id="booking-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
              className="mt-1"
            />
          </div>

          {/* Orario */}
          <div>
            <Label htmlFor="booking-time" className="text-[hsl(var(--dark-slate))] font-medium">
              Orario *
            </Label>
            <div className="mt-1 space-y-2">
              <Input
                id="booking-time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
              />
              
              {/* Orari Suggeriti */}
              <div>
                <p className="text-xs text-[hsl(var(--dark-slate))]/60 mb-1">Orari suggeriti:</p>
                <div className="flex flex-wrap gap-1">
                  {timeSlots.map(time => (
                    <Button
                      key={time}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, time }))}
                      className="text-xs h-7 px-2 text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <Label htmlFor="booking-notes" className="text-[hsl(var(--dark-slate))] font-medium">
              Note Aggiuntive
            </Label>
            <Textarea
              id="booking-notes"
              placeholder="Numero di persone, richieste speciali, allergie, etc..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Info Aggiuntive */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start">
              <Clock className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Nota Importante</p>
                <p>Questa è una prenotazione indicativa. Ti consigliamo di contattare il ristorante per confermare la disponibilità.</p>
                {restaurant.phone && (
                  <p className="mt-1">Tel: <span className="font-medium">{restaurant.phone}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Pulsanti */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Prenotando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Marca come Prenotata
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;