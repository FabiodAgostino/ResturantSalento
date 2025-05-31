import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsAddBookingOpen(false);
      resetForm();
      toast({
        title: "Booking Created",
        description: "Your restaurant booking has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("DELETE", `/api/bookings/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Deleted",
        description: "Your booking has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      restaurantId: "",
      date: "",
      time: "",
      notes: "",
    });
    setSelectedBooking(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.restaurantId || !formData.date || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      restaurantId: parseInt(formData.restaurantId),
      date: new Date(formData.date + "T00:00:00"),
      time: formData.time,
      notes: formData.notes,
    };

    createBookingMutation.mutate(bookingData);
  };

  const handleDeleteBooking = (bookingId: number) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      deleteBookingMutation.mutate(bookingId);
    }
  };

  // Convert bookings to calendar events
  const calendarEvents = bookings.map(booking => {
    const restaurant = restaurants.find(r => r.id === booking.restaurantId);
    return {
      id: booking.id.toString(),
      title: `${restaurant?.name || 'Restaurant'} ${booking.time}`,
      date: new Date(booking.date),
      color: 'bg-[hsl(var(--terracotta))] text-white',
    };
  });

  const upcomingBookings = bookings
    .filter(booking => new Date(booking.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Restaurant Calendar
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Plan your culinary adventures
          </p>
        </div>

        {/* Calendar Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <CalendarIcon className="w-6 h-6 text-[hsl(var(--terracotta))]" />
                <h3 className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
                  Your Bookings
                </h3>
              </div>
              
              <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Booking</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="restaurant">Restaurant *</Label>
                      <Select 
                        value={formData.restaurantId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, restaurantId: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a restaurant" />
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
                      <Label htmlFor="date">Date *</Label>
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
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Special requests, number of guests, etc."
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
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                        disabled={createBookingMutation.isPending}
                      >
                        {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <div className="mb-8">
          <CalendarView events={calendarEvents} />
        </div>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Upcoming Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[hsl(var(--dark-slate))] mb-2">
                  No upcoming bookings
                </h3>
                <p className="text-[hsl(var(--dark-slate))]/70 mb-4">
                  Start planning your next culinary adventure!
                </p>
                <Button
                  onClick={() => setIsAddBookingOpen(true)}
                  className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                >
                  Add Your First Booking
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
                            {restaurant?.name || 'Unknown Restaurant'}
                          </h4>
                          <p className="text-[hsl(var(--dark-slate))]/70">
                            {bookingDate.toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at {booking.time}
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
