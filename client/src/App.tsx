import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Recommended from "@/pages/Recommended";
import Calendar from "@/pages/Calendar";
import Favorites from "@/pages/Favorites";
import AddRestaurant from "@/pages/AddRestaurant";
import NotFound from "@/pages/not-found";

function Router() {
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