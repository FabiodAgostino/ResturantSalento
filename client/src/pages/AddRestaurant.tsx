import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Eye, Check, Clock, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Restaurant, ExtractedRestaurantData } from "@/lib/types";
import { RestaurantService, RestaurantServiceError, RestaurantValidator } from "@/lib/restaurant-service";

const AddRestaurant = () => {
  const [urls, setUrls] = useState([""]);
  const [manualData, setManualData] = useState({
    name: "",
    cuisine: "",
    priceRange: "",
    location: "",
    description: "",
    phone: "",
    address: "",
  });
  const [extractedData, setExtractedData] = useState<ExtractedRestaurantData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentRestaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    queryFn: RestaurantService.getAllRestaurants,
    select: (data) => data.slice(-5).reverse(), // Ultimi 5 ristoranti aggiunti
  });

  const extractMutation = useMutation({
    mutationFn: RestaurantService.extractRestaurantData,
    onSuccess: (data) => {
      setExtractedData(data.extracted);
      setIsProcessing(false);
      setValidationErrors([]);
      toast({
        title: "Estrazione Completata",
        description: "I dati del ristorante sono stati estratti con successo.",
      });
    },
    onError: (error: RestaurantServiceError) => {
      setIsProcessing(false);
      toast({
        title: "Errore nell'Estrazione",
        description: error.message || "Impossibile estrarre i dati. Verifica l'URL.",
        variant: "destructive",
      });
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: RestaurantService.createRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setShowSuccess(true);
      resetForm();
      setTimeout(() => setShowSuccess(false), 5000);
      toast({
        title: "Ristorante Aggiunto",
        description: "Il ristorante è stato aggiunto con successo.",
      });
    },
    onError: (error: RestaurantServiceError) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il ristorante.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setUrls([""]);
    setManualData({
      name: "",
      cuisine: "",
      priceRange: "",
      location: "",
      description: "",
      phone: "",
      address: "",
    });
    setExtractedData(null);
    setValidationErrors([]);
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
    
    if (!RestaurantValidator.validateTripAdvisorUrl(firstUrl)) {
      toast({
        title: "URL Non Valido",
        description: "Inserisci un URL TripAdvisor valido.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    extractMutation.mutate(firstUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const firstUrl = urls[0];
    
    // Preparazione dei dati del ristorante
    const restaurantData = extractedData ? {
      tripadvisorUrl: firstUrl,
      name: extractedData.name,
      cuisine: extractedData.cuisine,
      priceRange: extractedData.priceRange,
      rating: extractedData.rating,
      location: extractedData.location,
      description: extractedData.description,
      phone: extractedData.phone,
      address: extractedData.address,
      latitude: extractedData.latitude,
      longitude: extractedData.longitude,
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    } : {
      tripadvisorUrl: firstUrl,
      name: manualData.name || "Nuovo Ristorante",
      cuisine: manualData.cuisine || "italiana",
      priceRange: manualData.priceRange || "€€",
      rating: "4.0",
      location: manualData.location || "Salento",
      description: manualData.description || "Cucina locale deliziosa",
      phone: manualData.phone,
      address: manualData.address,
      latitude: "40.3515",
      longitude: "18.1750",
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    };

    // Validazione
    const errors = RestaurantValidator.validateRestaurantData(restaurantData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Dati Non Validi",
        description: "Correggi gli errori evidenziati.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors([]);
    createRestaurantMutation.mutate(restaurantData);
  };

  const cuisineOptions = [
    { value: "italiana", label: "Italiana" },
    { value: "mediterranea", label: "Mediterranea" },
    { value: "pesce", label: "Pesce" },
    { value: "barbecue", label: "Barbecue" },
    { value: "steakhouse", label: "Steakhouse" },
    { value: "pugliese", label: "Pugliese" },
  ];

  const priceOptions = [
    { value: "€", label: "€ - Economico" },
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
            Aiuta ad espandere il nostro database con le tue scoperte
          </p>
        </div>

        {/* Messaggio di Successo */}
        {showSuccess && (
          <Alert className="mb-6 bg-[hsl(var(--forest-green))]/10 border-[hsl(var(--forest-green))]/20">
            <Check className="w-4 h-4 text-[hsl(var(--forest-green))]" />
            <AlertDescription className="text-[hsl(var(--forest-green))]">
              Ristorante aggiunto con successo! Apparirà nei risultati di ricerca dopo l'approvazione.
            </AlertDescription>
          </Alert>
        )}

        {/* Errori di Validazione */}
        {validationErrors.length > 0 && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Aggiunta Ristorante */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Informazioni Ristorante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* URL TripAdvisor */}
              <div>
                <Label className="text-base font-medium text-[hsl(var(--dark-slate))] mb-3 block">
                  <ExternalLink className="w-4 h-4 inline mr-2 text-[hsl(var(--terracotta))]" />
                  URL TripAdvisor *
                </Label>
                
                {urls.map((url, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <Input
                      type="url"
                      placeholder="https://www.tripadvisor.it/Restaurant_Review-..."
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
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Altro URL
                </Button>
                
                <p className="text-sm text-[hsl(var(--dark-slate))]/60 mt-2">
                  Copia e incolla l'URL TripAdvisor del ristorante che vuoi aggiungere
                </p>
              </div>

              {/* Anteprima Dati Estratti */}
              {extractedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Informazioni Estratte:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Nome:</strong> {extractedData.name}</p>
                    <p><strong>Cucina:</strong> {extractedData.cuisine}</p>
                    <p><strong>Prezzo:</strong> {extractedData.priceRange}</p>
                    <p><strong>Rating:</strong> {extractedData.rating}</p>
                    <p><strong>Posizione:</strong> {extractedData.location}</p>
                  </div>
                </div>
              )}

              {/* Form Dettagli Ristorante */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-display font-semibold text-[hsl(var(--dark-slate))] mb-4">
                  Dettagli Ristorante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="restaurant-name">Nome Ristorante *</Label>
                    <Input
                      id="restaurant-name"
                      placeholder="Nome del ristorante"
                      value={extractedData?.name || manualData.name}
                      onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cuisine-type">Tipo di Cucina *</Label>
                    <Select 
                      value={extractedData?.cuisine || manualData.cuisine} 
                      onValueChange={(value) => setManualData(prev => ({ ...prev, cuisine: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona tipo di cucina" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuisineOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price-range">Fascia di Prezzo *</Label>
                    <Select 
                      value={extractedData?.priceRange || manualData.priceRange} 
                      onValueChange={(value) => setManualData(prev => ({ ...prev, priceRange: value }))}
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

                  <div>
                    <Label htmlFor="location">Posizione *</Label>
                    <Input
                      id="location"
                      placeholder="es. Lecce Centro, Gallipoli"
                      value={extractedData?.location || manualData.location}
                      onChange={(e) => setManualData(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      placeholder="+39 0832 123456"
                      value={extractedData?.phone || manualData.phone}
                      onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input
                      id="address"
                      placeholder="Via Roma 123, Lecce"
                      value={extractedData?.address || manualData.address}
                      onChange={(e) => setManualData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea
                      id="description"
                      placeholder="Breve descrizione del ristorante"
                      value={extractedData?.description || manualData.description}
                      onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Pulsanti Azione */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isProcessing || !urls[0] || extractMutation.isPending}
                  className="border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isProcessing ? "Estraendo..." : "Anteprima Estrazione"}
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

        {/* Stato Elaborazione */}
        {isProcessing && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--terracotta))] mr-4"></div>
                <span className="text-[hsl(var(--dark-slate))]">Elaborazione dati ristorante...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aggiunte Recenti */}
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
                {recentRestaurants.map(restaurant => (
                  <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-[hsl(var(--terracotta))]/10 text-[hsl(var(--terracotta))] rounded-lg p-3 mr-4">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[hsl(var(--dark-slate))]">
                          {restaurant.name}
                        </h4>
                        <p className="text-[hsl(var(--dark-slate))]/70">
                          Aggiunto di recente • Cucina {restaurant.cuisine.charAt(0).toUpperCase() + restaurant.cuisine.slice(1)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      restaurant.isApproved 
                        ? "text-[hsl(var(--forest-green))]" 
                        : "text-[hsl(var(--goldenrod))]"
                    }`}>
                      {restaurant.isApproved ? (
                        <>
                          <Check className="w-4 h-4 inline mr-1" />
                          Approvato
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 inline mr-1" />
                          In Elaborazione
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AddRestaurant;