import { Link } from "wouter";
import { 
  Utensils, 
  Home, 
  TrendingUp, 
  Calendar, 
  Heart, 
  PlusCircle,
  Menu,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";

// Definizione delle tipizzazioni
interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavLinkProps {
  path: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean;
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Funzione per verificare se un link è attivo
  const isActive = (path: string): boolean => {
    // In modalità hash, confronta con il hash senza #
    return window.location.hash === `#${path}`;
  };
  
  // Array di elementi di navigazione
  const navItems: NavItem[] = [
    { path: "/", label: "Home", icon: Home },
    { path: "/recommended", label: "Consigliati", icon: TrendingUp },
    { path: "/calendar", label: "Calendario", icon: Calendar },
    { path: "/favorites", label: "Preferiti", icon: Heart },
    { path: "/add-restaurant", label: "Aggiungi", icon: PlusCircle }
  ];
  
  // Componente per i link di navigazione
  const NavLink = ({ path, label, icon: Icon, mobile = false }: NavLinkProps) => {
    const active = isActive(path);
    
    return (
      <Link href={path}>
        <Button
          variant={active ? "default" : "ghost"}
          className={`${mobile ? "w-full justify-start" : ""} ${
            active 
              ? "bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]" 
              : "text-[hsl(var(--dark-slate))] hover:text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10"
          }`}
          onClick={() => mobile && setIsOpen(false)}
        >
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </Link>
    );
  };
  
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <Utensils className="w-6 h-6 text-[hsl(var(--terracotta))] mr-2" />
              <h1 className="text-2xl font-display font-bold text-[hsl(var(--terracotta))]">
                TripTaste
              </h1>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-[hsl(var(--dark-slate))]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center mb-6">
                    <Utensils className="w-6 h-6 text-[hsl(var(--terracotta))] mr-2" />
                    <h2 className="text-xl font-display font-bold text-[hsl(var(--terracotta))]">
                      TripTaste
                    </h2>
                  </div>
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      path={item.path}
                      label={item.label}
                      icon={item.icon}
                      mobile={true}
                    />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;