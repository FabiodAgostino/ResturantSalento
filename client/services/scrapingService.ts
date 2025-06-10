import { ExtractedRestaurantData } from "@/lib/types";

// client/src/services/scrapingService.ts
export interface ScrapingApiConfig {
  baseUrls: string[];
  timeout: number;
  apiKey: string;
}

export interface ScrapingRequest {
  url: string;
  options?: {
    timeout?: number;
    retries?: number;
    userAgent?: string;
  };
}

export interface ScrapingApiResponse {
  success: boolean;
  data?: ExtractedRestaurantData;
  error?: string;
  timestamp: string;
  version: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  responseTime?: string;
  services: {
    scraping: 'operational' | 'degraded' | 'down';
    external_apis: 'operational' | 'degraded' | 'down';
  };
}

interface UrlStats {
  failures: number;
  lastFailure: number;
  successCount: number;
  totalRequests: number;
}

export class ScrapingService {
  private config: ScrapingApiConfig;
  private currentIndex: number = 0;
  private urlStats: Map<string, UrlStats> = new Map();
  private readonly FAILURE_THRESHOLD = 3;
  private readonly RESET_TIMEOUT = 300000; // 5 minuti

  constructor() {
    this.config = {
      baseUrls: this.getApiBaseUrls(),
      timeout: 30000,
      apiKey: this.getApiKey()
    };
    
    // Inizializza stats per ogni URL
    this.initializeUrlStats();
    
    // Verifica configurazione
    this.validateConfig();
  }

  private getApiBaseUrls(): string[] {
    // Se è configurato manualmente con multiple URLs
    if (import.meta.env.VITE_SCRAPING_API_URLS) {
      const urls = import.meta.env.VITE_SCRAPING_API_URLS.split(',').map((url: string) => url.trim());
      return urls;
    }

    // Se è configurata una singola URL
    if (import.meta.env.VITE_SCRAPING_API_URL) {
      
      return [import.meta.env.VITE_SCRAPING_API_URL];
    }

    // URLs di default basate sui tuoi deployments
    const isDevelopment = import.meta.env.DEV || 
                         import.meta.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      return ['http://localhost:3000'];
    }
     return  [
      "https://trip-advisor-scraping-api.vercel.app",
      "https://trip-advisor-craping-api-2-git-main-fabiodagostinos-projects.vercel.app",
      "https://trip-advisor-craping-api-3.vercel.app",
      "https://trip-advisor-craping-api-4.vercel.app",
      "https://trip-advisor-craping-api-5.vercel.app",
      "https://trip-advisor-craping-api-6.vercel.app",
      "https://trip-advisor-craping-api-7.vercel.app",
      "https://trip-advisor-craping-api-8.vercel.app",
      "https://trip-advisor-craping-api-9.vercel.app"
    ];
  }

  private initializeUrlStats(): void {
    this.config.baseUrls.forEach(url => {
      this.urlStats.set(url, {
        failures: 0,
        lastFailure: 0,
        successCount: 0,
        totalRequests: 0
      });
    });
  }

  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_SCRAPING_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ VITE_SCRAPING_API_KEY non configurata');
    }
    return apiKey || '';
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      console.error('❌ API Key mancante. Configura VITE_SCRAPING_API_KEY nel tuo .env');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    return headers;
  }

  /**
   * Ottiene il prossimo URL disponibile con load balancing intelligente
   */
  private getNextAvailableUrl(): string | null {
    const now = Date.now();
    let attempts = 0;
    
    // Resetta failures vecchie (più di 5 minuti)
    this.urlStats.forEach((stats, url) => {
      if (stats.failures > 0 && now - stats.lastFailure > this.RESET_TIMEOUT) {
        stats.failures = 0;
      }
    });

    // Cerca un URL disponibile
    while (attempts < this.config.baseUrls.length) {
      const url = this.config.baseUrls[this.currentIndex % this.config.baseUrls.length];
      this.currentIndex++;
      
      const stats = this.urlStats.get(url);
      if (!stats || stats.failures < this.FAILURE_THRESHOLD) {
        return url;
      }
      
      attempts++;
    }

    // Se tutti sono bloccati, resetta e usa il primo
    this.urlStats.forEach(stats => { stats.failures = 0; });
    return this.config.baseUrls[0];
  }

  /**
   * Marca un URL come fallito
   */
  private markUrlFailed(url: string, error: string): void {
    const stats = this.urlStats.get(url);
    if (stats) {
      stats.failures++;
      stats.lastFailure = Date.now();
      stats.totalRequests++;
    }
  }

  /**
   * Marca un URL come successful
   */
  private markUrlSuccess(url: string): void {
    const stats = this.urlStats.get(url);
    if (stats) {
      stats.failures = 0; // Reset failures on success
      stats.successCount++;
      stats.totalRequests++;
    }
  }

  /**
   * Effettua il health check su tutti gli endpoint
   */
  async healthCheck(): Promise<HealthCheckResponse[]> {
    const results: HealthCheckResponse[] = [];
    
    for (const baseUrl of this.config.baseUrls) {
      try {
        const response = await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        const healthData = await response.json();
        results.push(healthData);
      } catch (error) {
        console.error(`❌ ${baseUrl}: ${error}`);
        results.push({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: 0,
          version: 'unknown',
          services: {
            scraping: 'down',
            external_apis: 'down'
          }
        });
      }
    }

    return results;
  }

  /**
   * Effettua lo scraping con fallback automatico tra endpoints
   */
  async scrapeRestaurant(request: ScrapingRequest): Promise<ExtractedRestaurantData> {
    // Validazione URL
    if (!request.url || !request.url.includes('tripadvisor')) {
      throw new Error('URL TripAdvisor richiesto');
    }

    // Verifica API key
    if (!this.config.apiKey) {
      throw new Error('API Key mancante. Configurare VITE_SCRAPING_API_KEY');
    }

    let lastError: Error | null = null;
    let attemptsCount = 0;
    const maxAttempts = this.config.baseUrls.length;

    // Prova tutti gli endpoints disponibili
    while (attemptsCount < maxAttempts) {
      const currentUrl = this.getNextAvailableUrl();
      
      if (!currentUrl) {
        throw new Error('Nessun endpoint disponibile');
      }

      try {
        attemptsCount++;

        const response = await fetch(`${currentUrl}/api/scrape`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('❌ Failed to parse error response:', parseError);
          }
          throw new Error(errorMessage);
        }

        const apiResponse: ScrapingApiResponse = await response.json();

        if (!apiResponse.success || !apiResponse.data) {
          throw new Error(apiResponse.error || 'Errore durante lo scraping');
        }

        // Successo!
        this.markUrlSuccess(currentUrl);
        return apiResponse.data;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        console.error(`❌ Errore con ${currentUrl}:`, errorMessage);
        
        this.markUrlFailed(currentUrl, errorMessage);
        lastError = error instanceof Error ? error : new Error(errorMessage);

        // Se non è l'ultimo tentativo, aspetta un po' prima del prossimo
        if (attemptsCount < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Tutti gli endpoints hanno fallito
    console.error('❌ Tutti gli endpoints hanno fallito');
    this.logStats();
    
    if (lastError) {
      if (lastError.name === 'TimeoutError' || lastError.message.includes('timeout')) {
        throw new Error('Lo scraping ha impiegato troppo tempo. Riprova o inserisci i dati manualmente.');
      }
      if (lastError.message.includes('401') || lastError.message.includes('Unauthorized')) {
        throw new Error('Errore di autenticazione. Verifica la configurazione dell\'API key.');
      }
      if (lastError.message.includes('403') || lastError.message.includes('Forbidden')) {
        throw new Error('Accesso negato. Verifica le autorizzazioni dell\'API.');
      }
      throw lastError;
    }
    
    throw new Error('Tutti gli endpoints di scraping non sono disponibili. Riprova più tardi.');
  }

  /**
   * Test dell'API su tutti gli endpoints
   */
  async testApi(): Promise<{ working: number; total: number; details: Array<{url: string; status: string}> }> {
    const healthResults = await this.healthCheck();
    const details = this.config.baseUrls.map((url, index) => ({
      url,
      status: healthResults[index]?.status || 'unknown'
    }));
    
    const working = details.filter(d => d.status === 'healthy').length;
    
    
    return {
      working,
      total: this.config.baseUrls.length,
      details
    };
  }

  /**
   * Ottiene statistiche dettagliate sugli endpoint
   */
  getStats(): Array<{url: string; stats: UrlStats}> {
    return Array.from(this.urlStats.entries()).map(([url, stats]) => ({
      url,
      stats: { ...stats }
    }));
  }

  /**
   * Log delle statistiche
   */
  private logStats(): void {
    this.urlStats.forEach((stats, url) => {
      const successRate = stats.totalRequests > 0 ? (stats.successCount / stats.totalRequests * 100).toFixed(1) : '0';
    });
  }

  /**
   * Test completo dell'API includendo autenticazione
   */
  async testAuthentication(): Promise<{ success: boolean; message: string; details: any }> {
    try {
      if (!this.config.apiKey) {
        return { 
          success: false, 
          message: 'API Key mancante. Configura VITE_SCRAPING_API_KEY nel file .env',
          details: null
        };
      }

      const testResult = await this.testApi();
      
      if (testResult.working > 0) {
        return { 
          success: true, 
          message: `${testResult.working}/${testResult.total} endpoints funzionanti`,
          details: testResult.details
        };
      } else {
        return { 
          success: false, 
          message: 'Nessun endpoint disponibile',
          details: testResult.details
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Errore di connessione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        details: null
      };
    }
  }

  /**
   * Ottiene informazioni sullo stato dell'API
   */
  getApiInfo(): { 
    baseUrls: string[];
    totalEndpoints: number;
    timeout: number; 
    environment: string; 
    hasApiKey: boolean;
    configSource: string;
    stats: Array<{url: string; stats: UrlStats}>;
  } {
    return {
      baseUrls: this.config.baseUrls,
      totalEndpoints: this.config.baseUrls.length,
      timeout: this.config.timeout,
      environment: import.meta.env.MODE || 'unknown',
      hasApiKey: !!this.config.apiKey,
      configSource: import.meta.env.VITE_SCRAPING_API_URLS ? 'multiple-urls' : 
                   import.meta.env.VITE_SCRAPING_API_URL ? 'single-url' : 'default',
      stats: this.getStats()
    };
  }

  /**
   * Reset manuale delle statistiche
   */
  resetStats(): void {
    this.urlStats.forEach(stats => {
      stats.failures = 0;
      stats.lastFailure = 0;
      stats.successCount = 0;
      stats.totalRequests = 0;
    });
  }

  /**
   * Aggiorna la configurazione runtime
   */
  updateConfig(newConfig: Partial<ScrapingApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.baseUrls) {
      this.initializeUrlStats();
    }
  }
}

// Singleton instance
export const scrapingService = new ScrapingService();