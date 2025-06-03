import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import RestaurantCard from "@/components/RestaurantCard";
import RestaurantModal from "@/components/RestaurantModal";
import { useFavorites } from "@/hooks/use-favorites";
import { useRestaurants } from "@/hooks/use-firebase";
import type { Restaurant } from "@/lib/types";

const Favorites = () => {
  const { favorites } = useFavorites();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook Firebase per ottenere tutti i ristoranti
  const { 
    restaurants, 
    loading: restaurantsLoading, 
    error: restaurantsError 
  } = useRestaurants();

  // Filtra i ristoranti preferiti
  const favoriteRestaurants = restaurants.filter(restaurant => 
    favorites.includes(restaurant.id)
  );

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  };

  // Stato di caricamento
  if (restaurantsLoading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
              I tuoi ristoranti preferiti
            </h2>
            <p className="text-lg text-[hsl(var(--dark-slate))]/70">
              La tua lista curata di luoghi imperdibili
            </p>
          </div>
          
          {/* Loading State */}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--terracotta))] mx-auto mb-4"></div>
              <p className="text-[hsl(var(--dark-slate))]/70">
                Caricamento dei tuoi ristoranti preferiti...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Gestione errori
  if (restaurantsError) {
    return (
      <main className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
              I tuoi ristoranti preferiti
            </h2>
          </div>
          
          {/* Error State */}
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-red-500 mb-4">
                <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                Errore nel caricamento
              </h3>
              <p className="text-[hsl(var(--dark-slate))]/70 mb-6">
                {restaurantsError}
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
            I tuoi ristoranti preferiti
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            La tua lista curata di luoghi imperdibili
          </p>
        </div>

        {favoriteRestaurants.length === 0 ? (
          /* Stato vuoto */
          <div className="text-center py-12">
            <Card>
              <CardContent className="p-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))] mb-2">
                  Nessun preferito ancora
                </h3>
                <p className="text-[hsl(var(--dark-slate))]/70 mb-6">
                  Inizia a esplorare i ristoranti e aggiungili ai tuoi preferiti!
                </p>
                <Link href="/">
                  <Button className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]">
                    Esplora ristoranti
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Lista preferiti */
          <div>
            {/* Contatore preferiti */}
            <div className="mb-6">
              <p className="text-[hsl(var(--dark-slate))]/70">
                {favoriteRestaurants.length} ristorante{favoriteRestaurants.length !== 1 ? ' preferito' : ' preferiti'}
              </p>
            </div>

            {/* Griglia ristoranti */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteRestaurants.map(restaurant => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>

            {/* Suggerimenti e consigli */}
            <Card className="mt-8 bg-[hsl(var(--terracotta))]/5 border-[hsl(var(--terracotta))]/20">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <Heart className="w-6 h-6 text-[hsl(var(--terracotta))] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--dark-slate))] mb-2">
                      Consigli per i tuoi preferiti
                    </h3>
                    <ul className="text-[hsl(var(--dark-slate))]/70 space-y-1 text-sm">
                      <li>• Clicca sull'icona del cuore su qualsiasi scheda ristorante per aggiungerlo ai preferiti</li>
                      <li>• I tuoi preferiti vengono salvati localmente e rimarranno tra le visite</li>
                      <li>• Usa il calendario per pianificare visite ai tuoi ristoranti preferiti</li>
                      <li>• Condividi i tuoi ristoranti preferiti con amici e famiglia</li>
                      <li>• Controlla regolarmente i consigli personalizzati basati sui tuoi preferiti</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiche sui preferiti */}
            {favoriteRestaurants.length > 0 && (
              <Card className="mt-6 bg-[hsl(var(--forest-green))]/5 border-[hsl(var(--forest-green))]/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-[hsl(var(--dark-slate))] mb-4">
                    Le tue preferenze culinarie
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cucine preferite */}
                    <div>
                      <h4 className="font-medium text-[hsl(var(--dark-slate))] mb-2">
                        Cucine preferite
                      </h4>
                      <div className="space-y-1">
                       {(() => {
                          const allCuisines = favoriteRestaurants.flatMap(restaurant => 
                            restaurant.cuisines || []
                          );
                          
                          // Conta le occorrenze di ogni cucina
                          const cuisineCount = allCuisines.reduce((acc, cuisine) => {
                            acc[cuisine] = (acc[cuisine] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          // Ordina per count decrescente e prende le prime 3
                          return Object.entries(cuisineCount)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([cuisine, count]) => (
                              <div key={cuisine} className="flex justify-between text-sm">
                                <span className="capitalize">{cuisine}</span>
                                <span className="text-[hsl(var(--forest-green))] font-medium">
                                  {count}
                                </span>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>

                    {/* Fasce di prezzo */}
                    <div>
                      <h4 className="font-medium text-[hsl(var(--dark-slate))] mb-2">
                        Fasce di prezzo
                      </h4>
                      <div className="space-y-1">
                        {Array.from(new Set(favoriteRestaurants.map(r => r.priceRange)))
                          .slice(0, 3)
                          .map(priceRange => {
                            const count = favoriteRestaurants.filter(r => r.priceRange === priceRange).length;
                            return (
                              <div key={priceRange} className="flex justify-between text-sm">
                                <span>{priceRange}</span>
                                <span className="text-[hsl(var(--forest-green))] font-medium">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Rating medio */}
                    <div>
                      <h4 className="font-medium text-[hsl(var(--dark-slate))] mb-2">
                        Rating medio
                      </h4>
                      <div className="text-2xl font-bold text-[hsl(var(--forest-green))]">
                        {(favoriteRestaurants.reduce((sum, r) => sum + parseFloat(r.rating), 0) / favoriteRestaurants.length).toFixed(1)}
                        <span className="text-sm font-normal text-[hsl(var(--dark-slate))]/70 ml-1">
                          / 5.0
                        </span>
                      </div>
                      <p className="text-xs text-[hsl(var(--dark-slate))]/60 mt-1">
                        Hai ottimi gusti!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Azioni rapide */}
            {favoriteRestaurants.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Link href="/recommended" className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10"
                  >
                    Scopri ristoranti simili
                  </Button>
                </Link>
                
                <Link href="/calendar" className="flex-1">
                  <Button 
                    className="w-full bg-[hsl(var(--forest-green))] text-white hover:bg-[hsl(var(--forest-green))]/90"
                  >
                    Pianifica una visita
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal del ristorante */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};

export default Favorites;