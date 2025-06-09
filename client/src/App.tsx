import { Switch, Route, useLocation, useRouter } from "wouter";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Home from "./pages/Home";
import Recommended from "./pages/Recommended";
import Calendar from "./pages/Calendar";
import Favorites from "./pages/Favorites";
import AddRestaurant from "./pages/AddRestaurant";
import NotFound from "./pages/not-found";

// Funzione per gestire il base path in produzione
function useBasePath() {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // In produzione, dobbiamo gestire il prefisso /TripTaste/
    if (import.meta.env.PROD && location.startsWith('/TripTaste')) {
      const newPath = location.replace('/TripTaste', '');
      setLocation(newPath || '/');
    }
  }, [location, setLocation]);
  
  return null;
}

function Router() {
  // Aggiungi questo componente per gestire il basePath
  useBasePath();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/recommended" component={Recommended} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/add-restaurant" component={AddRestaurant} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Definisci la funzione App e esportala come default
function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[hsl(var(--warm-beige))]">
        <Navigation />
        <Router />
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;