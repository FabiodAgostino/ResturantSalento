import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Eye, Check, Clock, Trash2, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRestaurants } from "@/hooks/use-firebase";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase-config';
import type { Restaurant, ExtractedRestaurantData } from "@/lib/types";

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
    rating: ""
  });
  const [extractedData, setExtractedData] = useState<ExtractedRestaurantData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const { toast } = useToast();

  // Hook Firebase per i ristoranti
  const { 
    restaurants, 
    loading: restaurantsLoading, 
    error: restaurantsError,
    createRestaurant 
  } = useRestaurants();

  // Ottieni gli ultimi 5 ristoranti aggiunti
  const recentRestaurants = restaurants
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  // Cloud Function per l'estrazione dati
  const extractRestaurantData = httpsCallable(functions, 'extractRestaurantData');

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
      rating: ""
    });
    setExtractedData(null);
    setExtractionError(null);
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

  const handlePreview = async () => {
    const firstUrl = urls[0];
    alert("ciao")
    alert(!firstUrl || (!firstUrl.includes('tripadvisor.com') && !firstUrl.includes('tripadvisor.it')));
    if (!firstUrl || (!firstUrl.includes('tripadvisor.com') && !firstUrl.includes('tripadvisor.it'))) {
      toast({
        title: "URL non valido",
        description: "Inserisci un URL TripAdvisor valido.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setExtractionError(null);
    
    try {
      const result = await extractRestaurantData({ url: firstUrl });
      const data = result.data as { extracted: ExtractedRestaurantData };
      
      setExtractedData(data.extracted);
      toast({
        title: "Estrazione completata",
        description: "Dati del ristorante estratti con successo.",
      });
    } catch (error: any) {
      console.error("Errore nell'estrazione:", error);
      const errorMessage = error.message || "Errore nell'estrazione dei dati. Controlla l'URL.";
      setExtractionError(errorMessage);
      toast({
        title: "Estrazione fallita",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const firstUrl = urls[0];
    if (!firstUrl) {
      toast({
        title: "URL mancante",
        description: "Inserisci almeno un URL TripAdvisor.",
        variant: "destructive",
      });
      return;
    }

    // Determina se usare dati estratti o manuali
    const useExtracted = extractedData && !extractionError;
    
    if (!useExtracted && !manualData.name) {
      toast({
        title: "Dati incompleti",
        description: "Inserisci almeno il nome del ristorante.",
        variant: "destructive",
      });
      return;
    }

    const restaurantData = useExtracted ? {
      tripadvisorUrl: firstUrl,
      name: extractedData!.name,
      cuisine: extractedData!.cuisine,
      priceRange: extractedData!.priceRange,
      rating: extractedData!.rating,
      location: extractedData!.location,
      description: extractedData!.description,
      phone: extractedData!.phone,
      address: extractedData!.address,
      latitude: extractedData!.latitude,
      longitude: extractedData!.longitude,
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    } : {
      tripadvisorUrl: firstUrl,
      name: manualData.name || "Nuovo Ristorante",
      cuisine: manualData.cuisine || "italiana",
      priceRange: manualData.priceRange || "€€",
      rating: manualData.rating || "4.0",
      location: manualData.location || "Salento",
      description: manualData.description || "Deliziosa cucina locale",
      phone: manualData.phone,
      address: manualData.address,
      latitude: "40.3515",
      longitude: "18.1750",
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    };

    try {
      await createRestaurant(restaurantData);
      setShowSuccess(true);
      resetForm();
      setTimeout(() => setShowSuccess(false), 5000);
      toast({
        title: "Ristorante aggiunto",
        description: "Il ristorante è stato aggiunto con successo e è in attesa di approvazione.",
      });
    } catch (error: any) {
      console.error("Errore nella creazione del ristorante:", error);
      toast({
        title: "Errore",
        description: error.message || "Errore nell'aggiunta del ristorante. Riprova.",
        variant: "destructive",
      });
    }
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
            Aggiungi nuovo ristorante
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Aiuta ad espandere il nostro database con le tue scoperte preferite
          </p>
        </div>

        {/* Messaggio di successo */}
        {showSuccess && (
          <Alert className="mb-6 bg-[hsl(var(--forest-green))]/10 border-[hsl(var(--forest-green))]/20">
            <Check className="w-4 h-4 text-[hsl(var(--forest-green))]" />
            <AlertDescription className="text-[hsl(var(--forest-green))]">
              Ristorante aggiunto con successo! Apparirà nei risultati di ricerca dopo l'approvazione.
            </AlertDescription>
          </Alert>
        )}

        {/* Errore di estrazione */}
        {extractionError && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Errore nell'estrazione automatica:</strong> {extractionError}
              <br />
              <span className="text-sm">Puoi comunque compilare manualmente i campi sottostanti.</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Form aggiunta ristorante */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Informazioni ristorante
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
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addUrlField}
                    className="text-[hsl(var(--terracotta))] hover:text-[hsl(var(--saddle))]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi altro URL
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={isProcessing || !urls[0]}
                    className="border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isProcessing ? "Estrazione..." : "Estrai dati"}
                  </Button>
                </div>
                
                <p className="text-sm text-[hsl(var(--dark-slate))]/60 mt-2">
                  Copia e incolla l'URL TripAdvisor del ristorante che vuoi aggiungere
                </p>
              </div>

              {/* Dati estratti preview */}
              {extractedData && !extractionError && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Informazioni estratte:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Nome:</strong> {extractedData.name}</p>
                    <p><strong>Cucina:</strong> {extractedData.cuisine}</p>
                    <p><strong>Prezzo:</strong> {extractedData.priceRange}</p>
                    <p><strong>Rating:</strong> {extractedData.rating}</p>
                    <p><strong>Località:</strong> {extractedData.location}</p>
                    {extractedData.phone && <p><strong>Telefono:</strong> {extractedData.phone}</p>}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    I dati estratti verranno utilizzati automaticamente. Puoi modificarli nei campi sotto se necessario.
                  </p>
                </div>
              )}

              {/* Form dettagli ristorante */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-display font-semibold text-[hsl(var(--dark-slate))] mb-4">
                  Dettagli ristorante
                  {extractedData && !extractionError && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      (Compila solo se vuoi modificare i dati estratti)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="restaurant-name">Nome ristorante *</Label>
                    <Input
                      id="restaurant-name"
                      placeholder={extractedData?.name || "Nome del ristorante"}
                      value={manualData.name}
                      onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                      required={!extractedData}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cuisine-type">Tipo di cucina *</Label>
                    <Select 
                      value={manualData.cuisine} 
                      onValueChange={(value) => setManualData(prev => ({ ...prev, cuisine: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={extractedData?.cuisine || "Seleziona tipo di cucina"} />
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
                    <Label htmlFor="price-range">Fascia di prezzo *</Label>
                    <Select 
                      value={manualData.priceRange} 
                      onValueChange={(value) => setManualData(prev => ({ ...prev, priceRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={extractedData?.priceRange || "Seleziona fascia di prezzo"} />
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
                    <Label htmlFor="rating">Rating *</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      placeholder={extractedData?.rating || "4.5"}
                      value={manualData.rating}
                      onChange={(e) => setManualData(prev => ({ ...prev, rating: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Località *</Label>
                    <Input
                      id="location"
                      placeholder={extractedData?.location || "es. Lecce Centro, Gallipoli"}
                      value={manualData.location}
                      onChange={(e) => setManualData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      placeholder={extractedData?.phone || "+39 0832 123456"}
                      value={manualData.phone}
                      onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input
                      id="address"
                      placeholder={extractedData?.address || "Via Roma 123, Lecce"}
                      value={manualData.address}
                      onChange={(e) => setManualData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea
                      id="description"
                      placeholder={extractedData?.description || "Breve descrizione del ristorante"}
                      value={manualData.description}
                      onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Pulsanti azione */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Resetta form
                </Button>
                
                <Button
                  type="submit"
                  disabled={!urls[0]}
                  className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi ristorante
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Stato di elaborazione */}
        {isProcessing && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--terracotta))] mr-4"></div>
                <span className="text-[hsl(var(--dark-slate))]">Elaborazione dati del ristorante...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aggiunte recenti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Aggiunte recenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {restaurantsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--terracotta))] mx-auto mb-4"></div>
                <p className="text-[hsl(var(--dark-slate))]/70">Caricamento...</p>
              </div>
            ) : restaurantsError ? (
              <div className="text-center py-8">
                <p className="text-red-600">{restaurantsError}</p>
              </div>
            ) : recentRestaurants.length === 0 ? (
              <p className="text-[hsl(var(--dark-slate))]/70 text-center py-8">
                Nessuna aggiunta recente ancora. Sii il primo ad aggiungere un ristorante!
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
                          Aggiunto di recente • Cucina {restaurant.cuisine}
                        </p>
                        <p className="text-[hsl(var(--dark-slate))]/60 text-sm">
                          {restaurant.location} • {restaurant.priceRange}
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
                          In elaborazione
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