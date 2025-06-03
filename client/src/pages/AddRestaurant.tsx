import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Eye, Check, Clock, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CuisineTagSelector from "@/components/CuisineTagSelector";
import type { Restaurant } from "@/lib/types";

const AddRestaurant = () => {
  const [urls, setUrls] = useState([""]);
  const [manualData, setManualData] = useState({
    name: "",
    cuisines: [] as string[], // Array di cucine
    priceRange: "",
    location: "",
    description: "",
    phone: "",
    address: "",
    rating: "",
  });
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentRestaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    select: (data) => data.slice(-5).reverse(), // Get last 5 restaurants added
  });

  const extractMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/restaurants/extract", { url });
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data.extracted);
      setIsProcessing(false);
      toast({
        title: "Estrazione Completata",
        description: "I dati del ristorante sono stati estratti con successo.",
      });
    },
    onError: (error) => {
      console.error("Extraction failed:", error);
      setIsProcessing(false);
      toast({
        title: "Estrazione Fallita",
        description: "Impossibile estrarre i dati del ristorante. Verifica l'URL di TripAdvisor.",
        variant: "destructive",
      });
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurantData: any) => {
      const response = await apiRequest("POST", "/api/restaurants", restaurantData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setShowSuccess(true);
      resetForm();
      setTimeout(() => setShowSuccess(false), 5000);
      toast({
        title: "Ristorante Aggiunto",
        description: "Il ristorante è stato aggiunto con successo ed è in attesa di approvazione.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il ristorante. Riprova.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setUrls([""]);
    setManualData({
      name: "",
      cuisines: [],
      priceRange: "",
      location: "",
      description: "",
      phone: "",
      address: "",
      rating: "",
    });
    setExtractedData(null);
  };

  const addUrlField = () => {
    setUrls([...urls, ""]);
  };

  const removeUrlField = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handlePreview = () => {
    const firstUrl = urls[0];
    if (!firstUrl || !firstUrl.toLowerCase().includes('tripadvisor')) {
      toast({
        title: "URL Non Valido",
        description: "Inserisci un URL valido di TripAdvisor.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setExtractedData(null);
    extractMutation.mutate(firstUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const firstUrl = urls[0];
    if (!firstUrl) {
      toast({
        title: "URL Mancante",
        description: "Inserisci almeno un URL di TripAdvisor.",
        variant: "destructive",
      });
      return;
    }

    // Determina quali dati usare (estratti o manuali)
    const finalData = extractedData || manualData;

    // Validazione cuisines
    if (!finalData.cuisines || finalData.cuisines.length === 0) {
      toast({
        title: "Tipi di Cucina Mancanti",
        description: "Seleziona almeno un tipo di cucina.",
        variant: "destructive",
      });
      return;
    }

    // Validazione campi obbligatori
    if (!finalData.name || !finalData.priceRange) {
      toast({
        title: "Campi Obbligatori",
        description: "Compila tutti i campi obbligatori (Nome, Tipi di Cucina, Fascia di Prezzo).",
        variant: "destructive",
      });
      return;
    }

    // Prepara i dati del ristorante
    const restaurantData = {
      tripadvisorUrl: firstUrl,
      name: finalData.name,
      cuisines: finalData.cuisines, // Array di cucine
      priceRange: finalData.priceRange,
      rating: finalData.rating || "4.0",
      location: finalData.location || "Salento",
      description: finalData.description || "Delizioso ristorante con cucina locale",
      phone: finalData.phone || undefined,
      address: finalData.address || undefined,
      latitude: finalData.latitude || "40.3515",
      longitude: finalData.longitude || "18.1750",
      imageUrl:finalData.imageUrl,
    };

    createRestaurantMutation.mutate(restaurantData);
  };

  const priceOptions = [
    { value: "€", label: "€ - Budget" },
    { value: "€€", label: "€€ - Moderato" },
    { value: "€€€", label: "€€€ - Costoso" },
    { value: "€€€€", label: "€€€€ - Fine Dining" },
  ];

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Aggiungi Nuovo Ristorante
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Aiuta ad espandere il nostro database con le tue scoperte preferite
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Alert className="mb-6 bg-[hsl(var(--forest-green))]/10 border-[hsl(var(--forest-green))]/20">
            <Check className="w-4 h-4 text-[hsl(var(--forest-green))]" />
            <AlertDescription className="text-[hsl(var(--forest-green))]">
              Ristorante aggiunto con successo! Apparirà nei risultati di ricerca dopo l'approvazione.
            </AlertDescription>
          </Alert>
        )}

        {/* Add Restaurant Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Informazioni Ristorante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TripAdvisor URLs */}
              <div>
                <Label className="text-base font-medium text-[hsl(var(--dark-slate))] mb-3 block">
                  <ExternalLink className="w-4 h-4 inline mr-2 text-[hsl(var(--terracotta))]" />
                  URL TripAdvisor *
                </Label>
                
                {urls.map((url, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <Input
                      type="url"
                      placeholder="https://www.tripadvisor.com/Restaurant_Review-..."
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      className="flex-1"
                      required={index === 0}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeUrlField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addUrlField}
                  className="text-[hsl(var(--terracotta))] hover:text-[hsl(var(--saddle))]"
                  disabled={urls.length >= 3}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Altro URL
                </Button>
                
                <p className="text-sm text-[hsl(var(--dark-slate))]/60 mt-2">
                  Copia e incolla l'URL di TripAdvisor del ristorante che vuoi aggiungere
                </p>
              </div>

              {/* Preview/Extract Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={handlePreview}
                  disabled={isProcessing || !urls[0]}
                  className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isProcessing ? "Estraendo..." : "Estrai Dati"}
                </Button>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(var(--terracotta))] mr-3"></div>
                  <span className="text-[hsl(var(--dark-slate))]">
                    Estrazione dati in corso da TripAdvisor...
                  </span>
                </div>
              )}

              {/* Extracted Data Preview */}
              {extractedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">Informazioni Estratte:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Nome:</strong> {extractedData.name}
                    </div>
                    <div>
                      <strong>Cucine:</strong> {extractedData.cuisines?.join(", ")}
                    </div>
                    <div>
                      <strong>Prezzo:</strong> {extractedData.priceRange}
                    </div>
                    <div>
                      <strong>Rating:</strong> {extractedData.rating}
                    </div>
                    <div>
                      <strong>Località:</strong> {extractedData.location}
                    </div>
                    <div>
                      <strong>Telefono:</strong> {extractedData.phone || "Non disponibile"}
                    </div>
                  </div>
                  {extractedData.description && (
                    <div className="mt-3">
                      <strong>Descrizione:</strong> {extractedData.description}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Data Form */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-display font-semibold text-[hsl(var(--dark-slate))] mb-4">
                  Dettagli Ristorante
                  {extractedData && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      (Modifica i dati estratti se necessario)
                    </span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome Ristorante */}
                  <div>
                    <Label htmlFor="restaurant-name">Nome Ristorante *</Label>
                    <Input
                      id="restaurant-name"
                      placeholder="Nome del ristorante"
                      value={extractedData ? extractedData.name : manualData.name}
                      onChange={(e) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, name: e.target.value});
                        } else {
                          setManualData(prev => ({ ...prev, name: e.target.value }));
                        }
                      }}
                      required
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <Label htmlFor="rating">Rating *</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      placeholder="4.5"
                      value={extractedData ? extractedData.rating : manualData.rating}
                      onChange={(e) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, rating: e.target.value});
                        } else {
                          setManualData(prev => ({ ...prev, rating: e.target.value }));
                        }
                      }}
                      required
                    />
                  </div>

                  {/* Tipi di Cucina */}
                  <div className="md:col-span-2">
                    <Label htmlFor="cuisine-types">Tipi di Cucina *</Label>
                    <CuisineTagSelector
                      selectedCuisines={extractedData ? (extractedData.cuisines || []) : manualData.cuisines}
                      onCuisinesChange={(cuisines) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, cuisines});
                        } else {
                          setManualData(prev => ({ ...prev, cuisines }));
                        }
                      }}
                      placeholder="Aggiungi tipo di cucina..."
                      className="mt-2"
                    />
                  </div>

                  {/* Fascia di Prezzo */}
                  <div>
                    <Label htmlFor="price-range">Fascia di Prezzo *</Label>
                    <Select 
                      value={extractedData ? extractedData.priceRange : manualData.priceRange} 
                      onValueChange={(value) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, priceRange: value});
                        } else {
                          setManualData(prev => ({ ...prev, priceRange: value }));
                        }
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona fascia di prezzo" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Località */}
                  <div>
                    <Label htmlFor="location">Località *</Label>
                    <Input
                      id="location"
                      placeholder="es. Lecce Centro, Gallipoli"
                      value={extractedData ? extractedData.location : manualData.location}
                      onChange={(e) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, location: e.target.value});
                        } else {
                          setManualData(prev => ({ ...prev, location: e.target.value }));
                        }
                      }}
                      required
                    />
                  </div>

                  {/* Telefono */}
                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      placeholder="+39 0832 123456"
                      value={extractedData ? (extractedData.phone || "") : manualData.phone}
                      onChange={(e) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, phone: e.target.value});
                        } else {
                          setManualData(prev => ({ ...prev, phone: e.target.value }));
                        }
                      }}
                    />
                  </div>

                  {/* Indirizzo */}
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input
                      id="address"
                      placeholder="Via Roma 123, Lecce"
                      value={extractedData ? (extractedData.address || "") : manualData.address}
                      onChange={(e) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, address: e.target.value});
                        } else {
                          setManualData(prev => ({ ...prev, address: e.target.value }));
                        }
                      }}
                    />
                  </div>

                  {/* Descrizione */}
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea
                      id="description"
                      placeholder="Breve descrizione del ristorante"
                      value={extractedData ? (extractedData.description || "") : manualData.description}
                      onChange={(e) => {
                        if (extractedData) {
                          setExtractedData({...extractedData, description: e.target.value});
                        } else {
                          setManualData(prev => ({ ...prev, description: e.target.value }));
                        }
                      }}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Resetta Form
                </Button>
                
                <Button
                  type="submit"
                  disabled={createRestaurantMutation.isPending || !urls[0]}
                  className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createRestaurantMutation.isPending ? "Aggiungendo..." : "Aggiungi Ristorante"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent Additions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Aggiunte Recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRestaurants.length === 0 ? (
              <p className="text-[hsl(var(--dark-slate))]/70 text-center py-8">
                Nessuna aggiunta recente. Sii il primo ad aggiungere un ristorante!
              </p>
            ) : (
              <div className="space-y-4">
                {recentRestaurants.map(restaurant => {
                  // Gestisce sia array che string per backward compatibility
                  const cuisines = Array.isArray(restaurant.cuisines) 
                    ? restaurant.cuisines 
                    : [restaurant.cuisines];
                  
                  return (
                    <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <div className="bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] rounded-lg p-3 mr-4">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[hsl(var(--dark-slate))]">
                            {restaurant.name}
                          </h4>
                          <p className="text-[hsl(var(--dark-slate))]/70">
                            Aggiunto di recente • {cuisines.join(", ")} • {restaurant.priceRange}
                          </p>
                          <p className="text-[hsl(var(--dark-slate))]/60 text-sm">
                            {restaurant.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium inline-flex items-center ${
                          restaurant.isApproved 
                            ? "text-[hsl(var(--forest-green))]" 
                            : "text-[hsl(var(--goldenrod))]"
                        }`}>
                          {restaurant.isApproved ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Approvato
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 mr-1" />
                              In Revisione
                            </>
                          )}
                        </span>
                        <div className="text-xs text-[hsl(var(--dark-slate))]/50 mt-1">
                          Rating: {restaurant.rating}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 bg-[hsl(var(--terracotta))]/5 border-[hsl(var(--terracotta))]/20">
          <CardContent className="p-6">
            <div className="flex items-start">
              <ExternalLink className="w-6 h-6 text-[hsl(var(--terracotta))] mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[hsl(var(--dark-slate))] mb-2">
                  Come Aggiungere un Ristorante
                </h3>
                <ul className="text-[hsl(var(--dark-slate))]/70 space-y-1 text-sm">
                  <li>• Trova il ristorante su TripAdvisor</li>
                  <li>• Copia l'URL della pagina del ristorante</li>
                  <li>• Incolla l'URL nel campo sopra e clicca "Estrai Dati"</li>
                  <li>• Controlla e modifica le informazioni se necessario</li>
                  <li>• Seleziona i tipi di cucina appropriati</li>
                  <li>• Clicca "Aggiungi Ristorante" per salvare</li>
                </ul>
                <p className="text-[hsl(var(--dark-slate))]/60 text-xs mt-3">
                  Tutti i ristoranti aggiunti vengono revisionati prima di apparire nel database pubblico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AddRestaurant;