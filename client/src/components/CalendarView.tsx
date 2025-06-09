import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarEvent } from "@/lib/types";

interface CalendarViewProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void; // Prop per click su giorno
}

const CalendarView = ({ 
  events = [], 
  onDateClick, 
  onEventClick, 
  onDayClick // ✅ Aggiungi nel destructuring
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getDayEvents = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => 
      event.date.toDateString() === dayDate.toDateString()
    );
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // ✅ Chiama entrambi i callback se presenti
    onDateClick?.(clickedDate);
    onDayClick?.(clickedDate);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Previous month's trailing days
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), -(firstDayOfWeek - 1 - i));
      days.push(
        <div 
          key={`prev-${i}`} 
          className="h-24 p-2 text-gray-400 cursor-pointer hover:bg-gray-50"
          onClick={() => {
            // ✅ Anche i giorni del mese precedente possono essere clickabili
            onDayClick?.(prevMonthDay);
          }}
        >
          <span>{prevMonthDay.getDate()}</span>
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getDayEvents(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div
          key={day}
          className={`h-24 p-2 hover:bg-gray-50 cursor-pointer relative border-r border-b border-gray-200 transition-colors ${
            isToday ? 'bg-[hsl(var(--terracotta))]/10 font-semibold' : ''
          }`}
          onClick={() => handleDateClick(day)}
        >
          <span className={`text-[hsl(var(--dark-slate))] ${isToday ? 'text-[hsl(var(--terracotta))]' : ''}`}>
            {day}
          </span>
          
          {dayEvents.length > 0 && (
            <div className="mt-1 space-y-1">
              {dayEvents.slice(0, 2).map((event, index) => (
                <div
                  key={event.id}
                  className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${event.color} hover:opacity-80`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(event);
                  }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500 cursor-pointer hover:text-[hsl(var(--terracotta))]">
                  +{dayEvents.length - 2} more
                </div>
              )}
            </div>
          )}
          
          {/* Indicatore che il giorno è clickabile */}
          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--terracotta))]/30"></div>
          </div>
        </div>
      );
    }

    // Next month's leading days
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);
    
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push(
        <div 
          key={`next-${i}`} 
          className="h-24 p-2 text-gray-400 cursor-pointer hover:bg-gray-50"
          onClick={() => {
            // ✅ Anche i giorni del mese successivo possono essere clickabili
            onDayClick?.(nextMonthDay);
          }}
        >
          <span>{i}</span>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden group">
      {/* Calendar Header */}
      <div className="bg-[hsl(var(--terracotta))] text-white p-4">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevMonth}
            className="text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <h3 className="text-xl font-display font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 bg-[hsl(var(--terracotta))] text-white">
        {daysOfWeek.map(day => (
          <div key={day} className="p-4 text-center font-medium border-r border-white/20 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>
      
      {/* Footer informativo */}
      <div className="bg-gray-50 px-4 py-2 text-center">
        <p className="text-xs text-gray-600">
          Clicca su un giorno per vedere i dettagli delle prenotazioni
        </p>
      </div>
    </div>
  );
};

export default CalendarView;