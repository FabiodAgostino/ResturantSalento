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


function Router() {
  
  // Ottieni l'URL base per le route
  const basePath = import.meta.env.PROD ? '/TripTaste' : '';
  
  return (
    <Switch>
      <Route path={`${basePath}/`} component={Home} />
      <Route path={`${basePath}/recommended`} component={Recommended} />
      <Route path={`${basePath}/calendar`} component={Calendar} />
      <Route path={`${basePath}/favorites`} component={Favorites} />
      <Route path={`${basePath}/add-restaurant`} component={AddRestaurant} />
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