// client/src/lib/imageUtils.ts
// Utility functions per la gestione delle immagini dei ristoranti

import React from "react";

/**
 * Estrae l'URL migliore da un srcset di TripAdvisor
 */
export function getBestImageFromSrcset(srcset: string): string {
  if (!srcset) return "";
  
  const urls = srcset.split(',').map(item => {
    const parts = item.trim().split(' ');
    return {
      url: parts[0],
      density: parts[1] ? parseFloat(parts[1].replace('x', '')) : 1
    };
  });
  
  // Ordina per densità decrescente e prende la migliore
  urls.sort((a, b) => b.density - a.density);
  return urls[0]?.url || "";
}

/**
 * Valida se un URL di immagine è valido
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const validDomains = ['tripadvisor.com', 'unsplash.com', 'images.unsplash.com'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const domainValid = validDomains.some(domain => urlObj.hostname.includes(domain));
    const extensionValid = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    );
    
    return domainValid && (extensionValid || urlObj.hostname.includes('tripadvisor.com'));
  } catch {
    return false;
  }
}

/**
 * Genera un URL di placeholder per i ristoranti
 */
export function getRestaurantPlaceholder(cuisine?: string): string {
  const placeholders = {
    pugliese: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    italiana: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    pesce: "https://images.unsplash.com/photo-1544943151-6e4ed999de46?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    mediterranea: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    barbecue: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    steakhouse: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
  };
  
  return placeholders[cuisine as keyof typeof placeholders] || placeholders.italiana;
}

/**
 * Ottimizza l'URL dell'immagine di TripAdvisor per una dimensione specifica
 */
export function optimizeTripAdvisorImage(url: string, width: number = 600): string {
  if (!url || !url.includes('tripadvisor.com')) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Modifica i parametri per ottimizzare l'immagine
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('h', '-1'); // Mantiene le proporzioni
    urlObj.searchParams.set('s', '1');
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Converte un'immagine responsive in diverse dimensioni
 */
export function generateResponsiveImageUrls(baseUrl: string): {
  thumbnail: string;
  card: string;
  detail: string;
  hero: string;
} {
  return {
    thumbnail: optimizeTripAdvisorImage(baseUrl, 150),
    card: optimizeTripAdvisorImage(baseUrl, 400),
    detail: optimizeTripAdvisorImage(baseUrl, 800),
    hero: optimizeTripAdvisorImage(baseUrl, 1200)
  };
}

/**
 * Hook personalizzato per la gestione degli errori di caricamento immagini
 */
export function useImageFallback(primaryUrl: string, fallbackCuisine?: string) {
  const [imageUrl, setImageUrl] = React.useState(primaryUrl);
  const [isError, setIsError] = React.useState(false);
  
  React.useEffect(() => {
    setImageUrl(primaryUrl);
    setIsError(false);
  }, [primaryUrl]);
  
  const handleError = React.useCallback(() => {
    if (!isError) {
      setIsError(true);
      setImageUrl(getRestaurantPlaceholder(fallbackCuisine));
    }
  }, [isError, fallbackCuisine]);
  
  return { imageUrl, handleError, isError };
}