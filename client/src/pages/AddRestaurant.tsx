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
import type { Restaurant } from "@/lib/types";

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
        title: "Extraction Complete",
        description: "Restaurant data has been extracted successfully.",
      });
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Extraction Failed",
        description: "Failed to extract restaurant data. Please check the URL.",
        variant: "destructive",
      });
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurantData: any) => {
      const response = await apiRequest("POST", "/api/restaurants", restaurantData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setShowSuccess(true);
      resetForm();
      setTimeout(() => setShowSuccess(false), 5000);
      toast({
        title: "Restaurant Added",
        description: "The restaurant has been added successfully and is pending approval.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add restaurant. Please try again.",
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
    if (!firstUrl || !firstUrl.includes('tripadvisor.com')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid TripAdvisor URL.",
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
    if (!firstUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter at least one TripAdvisor URL.",
        variant: "destructive",
      });
      return;
    }

    // Use extracted data if available, otherwise use manual data
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
      name: manualData.name || "New Restaurant",
      cuisine: manualData.cuisine || "italiana",
      priceRange: manualData.priceRange || "€€",
      rating: "4.0",
      location: manualData.location || "Salento",
      description: manualData.description || "Delicious local cuisine",
      phone: manualData.phone,
      address: manualData.address,
      latitude: "40.3515",
      longitude: "18.1750",
      imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    };

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
    { value: "€", label: "€ - Budget" },
    { value: "€€", label: "€€ - Moderate" },
    { value: "€€€", label: "€€€ - Expensive" },
    { value: "€€€€", label: "€€€€ - Fine Dining" },
  ];

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-[hsl(var(--dark-slate))] mb-4">
            Add New Restaurant
          </h2>
          <p className="text-lg text-[hsl(var(--dark-slate))]/70">
            Help expand our database with your favorite finds
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Alert className="mb-6 bg-[hsl(var(--forest-green))]/10 border-[hsl(var(--forest-green))]/20">
            <Check className="w-4 h-4 text-[hsl(var(--forest-green))]" />
            <AlertDescription className="text-[hsl(var(--forest-green))]">
              Restaurant added successfully! It will appear in search results after approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Add Restaurant Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Restaurant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TripAdvisor URLs */}
              <div>
                <Label className="text-base font-medium text-[hsl(var(--dark-slate))] mb-3 block">
                  <ExternalLink className="w-4 h-4 inline mr-2 text-[hsl(var(--terracotta))]" />
                  TripAdvisor URL *
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
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another URL
                </Button>
                
                <p className="text-sm text-[hsl(var(--dark-slate))]/60 mt-2">
                  Copy and paste the TripAdvisor URL of the restaurant you want to add
                </p>
              </div>

              {/* Extracted Data Preview */}
              {extractedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Extracted Information:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Name:</strong> {extractedData.name}</p>
                    <p><strong>Cuisine:</strong> {extractedData.cuisine}</p>
                    <p><strong>Price:</strong> {extractedData.priceRange}</p>
                    <p><strong>Rating:</strong> {extractedData.rating}</p>
                    <p><strong>Location:</strong> {extractedData.location}</p>
                  </div>
                </div>
              )}

              {/* Restaurant Details Form */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-display font-semibold text-[hsl(var(--dark-slate))] mb-4">
                  Restaurant Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="restaurant-name">Restaurant Name *</Label>
                    <Input
                      id="restaurant-name"
                      placeholder="Nome del ristorante"
                      value={manualData.name}
                      onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cuisine-type">Cuisine Type *</Label>
                    <Select 
                      value={manualData.cuisine} 
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
                    <Label htmlFor="price-range">Price Range *</Label>
                    <Select 
                      value={manualData.priceRange} 
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
                    <Label htmlFor="rating">Rating *</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      placeholder="4.5"
                      value={manualData.rating || ""}
                      onChange={(e) => setManualData(prev => ({ ...prev, rating: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="es. Lecce Centro, Gallipoli"
                      value={manualData.location}
                      onChange={(e) => setManualData(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+39 0832 123456"
                      value={manualData.phone}
                      onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Via Roma 123, Lecce"
                      value={manualData.address}
                      onChange={(e) => setManualData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Breve descrizione del ristorante"
                      value={manualData.description}
                      onChange={(e) => setManualData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isProcessing || !urls[0]}
                  className="border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/10"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isProcessing ? "Extracting..." : "Preview Extract"}
                </Button>
                
                <Button
                  type="submit"
                  disabled={createRestaurantMutation.isPending || !urls[0]}
                  className="bg-[hsl(var(--terracotta))] text-white hover:bg-[hsl(var(--saddle))]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createRestaurantMutation.isPending ? "Adding..." : "Add Restaurant"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Processing Status */}
        {isProcessing && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--terracotta))] mr-4"></div>
                <span className="text-[hsl(var(--dark-slate))]">Processing restaurant data...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Additions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display font-semibold text-[hsl(var(--dark-slate))]">
              Recent Additions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRestaurants.length === 0 ? (
              <p className="text-[hsl(var(--dark-slate))]/70 text-center py-8">
                No recent additions yet. Be the first to add a restaurant!
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
                          Added recently • {restaurant.cuisine.charAt(0).toUpperCase() + restaurant.cuisine.slice(1)} cuisine
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
                          Approved
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 inline mr-1" />
                          Processing
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
