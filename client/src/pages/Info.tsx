import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Star, 
  Filter, 
  Heart, 
  Smartphone, 
  Download, 
  Search, 
  Database, 
  Globe, 
  Zap,
  Chrome,
  AlertTriangle,
  ExternalLink,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  Trash2,
  BarChart3,
  Shield,
  Wifi
} from 'lucide-react';

// Import del servizio notifiche AGGIORNATO
import { EnhancedNotificationService } from "../../services/notification-service";

const Info = () => {
  // ========================================
  // 🔄 STATO NOTIFICHE - COMPLETAMENTE RISTRUTTURATO
  // ========================================
  
  const [notificationService] = useState(new EnhancedNotificationService());
  const [systemStatus, setSystemStatus] = useState(notificationService.getSystemStatus());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // ========================================
  // 🔄 EFFETTI E AGGIORNAMENTI
  // ========================================
  
  useEffect(() => {
    // Intervallo per aggiornare lo stato ogni 3 secondi
    const statusInterval = setInterval(() => {
      const newStatus = notificationService.getSystemStatus();
      setSystemStatus(newStatus);
      setLastUpdate(new Date());
    }, 3000);

    // Cleanup
    return () => {
      clearInterval(statusInterval);
    };
  }, [notificationService]);

  // Aggiornamento manuale dello stato
  const refreshStatus = () => {
    const newStatus = notificationService.getSystemStatus();
    setSystemStatus(newStatus);
    setLastUpdate(new Date());
  };

  // ========================================
  // 🎯 HANDLERS NOTIFICHE - AGGIORNATI
  // ========================================

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const permission = await notificationService.requestPermission();
      refreshStatus();
      
      if (permission === 'granted') {
        console.log('✅ Permessi notifiche concessi');
      } else if (permission === 'denied') {
        console.log('❌ Permessi notifiche negati');
      }
    } catch (error) {
      console.error('❌ Errore richiesta permessi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartListening = () => {
    setIsLoading(true);
    try {
      const unsubscribe = notificationService.startNotificationListener();
      
      // Salva cleanup globalmente per sicurezza
      (window as any).triptasteNotificationCleanup = unsubscribe;
      
      refreshStatus();
      console.log('🎧 Listener notifiche avviato');
    } catch (error) {
      console.error('❌ Errore avvio listener:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopListening = () => {
    setIsLoading(true);
    try {
      notificationService.stopNotificationListener();
      
      // Pulisci cleanup globale
      if ((window as any).triptasteNotificationCleanup) {
        (window as any).triptasteNotificationCleanup = undefined;
      }
      
      refreshStatus();
      console.log('🛑 Listener notifiche fermato');
    } catch (error) {
      console.error('❌ Errore stop listener:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (systemStatus.permission !== 'granted') {
      console.warn('⚠️ Test saltato: permessi mancanti');
      return;
    }

    setIsLoading(true);
    try {
      const success = await notificationService.testNotification();
      
      if (success) {
        console.log('✅ Test notifica riuscito');
      } else {
        console.error('❌ Test notifica fallito');
      }
    } catch (error) {
      console.error('❌ Errore test notifica:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetState = () => {
    setIsLoading(true);
    try {
      notificationService.resetState();
      refreshStatus();
      console.log('🔄 Stato notifiche resettato');
    } catch (error) {
      console.error('❌ Errore reset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // 🎨 UTILITY UI
  // ========================================

  const getStatusColor = () => {
    switch (systemStatus.permission) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = () => {
    switch (systemStatus.permission) {
      case 'granted': return '✅ Concessi';
      case 'denied': return '❌ Negati';
      default: return '⏳ Non richiesti';
    }
  };

  const getInitializationColor = () => {
    return systemStatus.isInitialized ? 'text-green-600' : 'text-orange-600';
  };

  // ========================================
  // 📊 DATI STATICI
  // ========================================

  const features = [
    {
      icon: <Search className="w-6 h-6 text-[hsl(var(--terracotta))]" />,
      title: "Scraping Intelligente",
      description: "Sistema di estrazione dati da TripAdvisor con algoritmi avanzati, retry automatico e load balancing su múltipli endpoint per garantire affidabilità."
    },
    {
      icon: <MapPin className="w-6 h-6 text-[hsl(var(--terracotta))]" />,
      title: "Mappe Interactive",
      description: "Visualizza tutti i ristoranti su mappe interattive con marker personalizzati, popup informativi e geolocalizzazione precisa."
    },
    {
      icon: <Star className="w-6 h-6 text-[hsl(var(--terracotta))]" />,
      title: "Valutazioni Personalizzate",
      description: "Aggiungi le tue valutazioni per posizione, rapporto qualità/prezzo e prezzo medio per aiutare altri utenti."
    },
    {
      icon: <Filter className="w-6 h-6 text-[hsl(var(--terracotta))]" />,
      title: "Filtri Avanzati",
      description: "Filtra per tipo di cucina, fascia di prezzo, rating minimo e distanza con ricerca intelligente."
    },
    {
      icon: <Heart className="w-6 h-6 text-[hsl(var(--terracotta))]" />,
      title: "Sistema Preferiti",
      description: "Salva i tuoi ristoranti preferiti con sincronizzazione cloud e accesso multi-dispositivo."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[hsl(var(--terracotta))]" />,
      title: "Design Responsivo",
      description: "Interfaccia ottimizzata per desktop, tablet e smartphone con design moderno."
    }
  ];

  const techStack = [
    { name: "React + TypeScript", category: "Frontend" },
    { name: "Tailwind CSS + Shadcn/ui", category: "Styling" },
    { name: "Serverless API (Vercel)", category: "Backend" },
    { name: "Node.js + Cheerio + Axios", category: "Scraping" },
    { name: "Firestore", category: "Database" },
    { name: "Leaflet.js", category: "Mappe" }
  ];

  const processSteps = [
    {
      title: "URL Validation",
      description: "Verifica che l'URL sia valido e appartenga a TripAdvisor"
    },
    {
      title: "Load Balancing",
      description: "Selezione intelligente dell'endpoint disponibile tra múltipli server"
    },
    {
      title: "Request Masking",
      description: "Utilizzo di user agents realistici e headers per simulare navigazione umana"
    },
    {
      title: "Data Extraction",
      description: "Parsing HTML con Cheerio per estrarre nome, rating, prezzo, posizione e cucine"
    },
    {
      title: "Validation & Storage",
      description: "Validazione dati estratti e salvataggio nel database con timestamp"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-[hsl(var(--dark-slate))] font-display">
          Come Funziona TripTaste
        </h1>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                {feature.icon}
                <CardTitle className="text-lg font-semibold text-[hsl(var(--dark-slate))]">
                  {feature.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(var(--dark-slate))]/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ========================================
          🔔 SEZIONE NOTIFICHE COMPLETAMENTE RINNOVATA
          ======================================== */}
      
      <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-[hsl(var(--dark-slate))] flex items-center">
              <Bell className="w-6 h-6 mr-3 text-blue-600" />
              Sistema Notifiche Avanzato
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                onClick={refreshStatus}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <span className="text-xs text-gray-500">
                Aggiornato: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-[hsl(var(--dark-slate))]/70">
            Sistema di notifiche real-time completamente rinnovato con persistenza multi-dispositivo, 
            recupero automatico e gestione robusta degli errori.
          </p>

          {/* ========================================
              📊 STATO SISTEMA - DASHBOARD COMPLETA
              ======================================== */}
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Supporto Browser */}
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-500" />
                  Browser
                </span>
                <span className={systemStatus.supported ? 'text-green-600' : 'text-red-600'}>
                  {systemStatus.supported ? '✅' : '❌'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {systemStatus.supported ? 'Compatibile' : 'Non supportato'}
              </p>
            </div>

            {/* Permessi */}
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-orange-500" />
                  Permessi
                </span>
                <span className={getStatusColor()}>
                  {getStatusText()}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Autorizzazioni browser
              </p>
            </div>

            {/* Stato Inizializzazione */}
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-purple-500" />
                  Sistema
                </span>
                <span className={getInitializationColor()}>
                  {systemStatus.isInitialized ? '🟢 Pronto' : '🟡 Caricamento'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Stato inizializzazione
              </p>
            </div>

            {/* Listener */}
            <div className="p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  {systemStatus.isListening ? 
                    <Volume2 className="w-4 h-4 mr-2 text-green-500" /> :
                    <VolumeX className="w-4 h-4 mr-2 text-gray-500" />
                  }
                  Listener
                </span>
                <span className={systemStatus.isListening ? 'text-green-600' : 'text-gray-500'}>
                  {systemStatus.isListening ? '🎧 Attivo' : '⏸️ Inattivo'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Ascolto real-time
              </p>
            </div>
          </div>

          {/* ========================================
              📈 STATISTICHE AVANZATE
              ======================================== */}
          
          {systemStatus.stats.totalShown > 0 && (
            <div className="p-5 bg-white rounded-lg border shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Statistiche Sistema
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Notifiche mostrate:</span>
                  <p className="font-semibold text-blue-600 text-lg">{systemStatus.stats.totalShown}</p>
                </div>
                <div>
                  <span className="text-gray-600">Ultimo ID processato:</span>
                  <p className="font-mono text-xs text-gray-800">
                    {systemStatus.stats.lastProcessedId || 'Nessuno'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Ultimo aggiornamento:</span>
                  <p className="font-semibold text-green-600">
                    {new Date(systemStatus.stats.lastProcessedTimestamp).toLocaleString('it-IT')}
                  </p>
                </div>
              </div>
              
              {/* Device ID per debugging */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Device ID: </span>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {systemStatus.deviceId}
                </code>
              </div>
            </div>
          )}

          {/* ========================================
              🎮 AZIONI PRINCIPALI
              ======================================== */}
          
          <div className="space-y-3">
            {!systemStatus.supported ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Il tuo browser non supporta le notifiche. Prova Chrome, Firefox o Safari aggiornato.
                </AlertDescription>
              </Alert>
            ) : !systemStatus.isInitialized ? (
              <Alert className="border-orange-200 bg-orange-50">
                <Wifi className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Sistema in inizializzazione... Attendi qualche secondo.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Richiesta permessi */}
                {systemStatus.canRequest && (
                  <Button
                    onClick={handleRequestPermission}
                    disabled={isLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    size="lg"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    {isLoading ? 'Richiedendo...' : 'Richiedi Permessi Notifiche'}
                  </Button>
                )}

                {/* Avvio/Stop Listener */}
                {systemStatus.permission === 'granted' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {!systemStatus.isListening ? (
                      <Button
                        onClick={handleStartListening}
                        disabled={isLoading}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        size="lg"
                      >
                        <Volume2 className="w-5 h-5 mr-2" />
                        {isLoading ? 'Avviando...' : 'Attiva Notifiche'}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopListening}
                        disabled={isLoading}
                        variant="destructive"
                        size="lg"
                      >
                        <BellOff className="w-5 h-5 mr-2" />
                        {isLoading ? 'Fermando...' : 'Ferma Notifiche'}
                      </Button>
                    )}

                    {/* Test */}
                    <Button
                      onClick={handleTestNotification}
                      disabled={isLoading || systemStatus.permission !== 'granted'}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      size="lg"
                    >
                      🧪 {isLoading ? 'Testando...' : 'Test Notifica'}
                    </Button>
                  </div>
                )}

                {/* Reset System */}
                {systemStatus.stats.totalShown > 0 && (
                  <Button
                    onClick={handleResetState}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isLoading ? 'Resettando...' : 'Reset Stato Sistema'}
                  </Button>
                )}

                {/* Guida per permessi negati */}
                {systemStatus.permission === 'denied' && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Permessi negati.</strong> Per abilitare le notifiche:
                      <ol className="list-decimal list-inside mt-2 text-sm space-y-1">
                        <li>Clicca sull'icona del lucchetto nella barra degli indirizzi</li>
                        <li>Seleziona "Consenti" per le notifiche</li>
                        <li>Ricarica la pagina</li>
                        <li>Clicca "Richiedi Permessi Notifiche"</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          {/* ========================================
              📱 INFO COMPATIBILITÀ
              ======================================== */}
          
          <Alert className="border-blue-200 bg-blue-50">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>📱 Compatibilità Enhanced:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>Desktop:</strong> Chrome, Firefox, Edge, Safari - Supporto completo</li>
                <li><strong>Android:</strong> Chrome, Firefox - Notifiche persistenti + vibrazione</li>
                <li><strong>iOS:</strong> Safari con PWA - Supporto limitato (richiede aggiunta a Home Screen)</li>
                <li><strong>Sincronizzazione:</strong> Stato condiviso tra tutti i dispositivi</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[hsl(var(--dark-slate))] flex items-center">
            <Zap className="w-6 h-6 mr-3 text-[hsl(var(--terracotta))]" />
            Stack Tecnologico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map((tech, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Badge variant="outline" className="text-[hsl(var(--terracotta))]">
                  {tech.category}
                </Badge>
                <span className="font-medium text-[hsl(var(--dark-slate))]">
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[hsl(var(--dark-slate))] flex items-center">
            <Database className="w-6 h-6 mr-3 text-[hsl(var(--terracotta))]" />
            Processo di Estrazione Dati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border-l-4 border-[hsl(var(--terracotta))] bg-gray-50 rounded-r-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-[hsl(var(--terracotta))] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-[hsl(var(--dark-slate))] mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[hsl(var(--dark-slate))]/70 text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chrome Extension Download */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[hsl(var(--dark-slate))] flex items-center">
            <Chrome className="w-6 h-6 mr-3 text-blue-600" />
            Estensione Chrome TripTaste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[hsl(var(--dark-slate))]/70">
            Scarica la nostra estensione Chrome per aggiungere ristoranti direttamente dal browser mentre navighi su TripAdvisor.
          </p>
          
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Attenzione:</strong> Questa estensione effettua web scraping di TripAdvisor. 
              Utilizza solo per uso personale e rispetta i termini di servizio di TripAdvisor.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              onClick={() => window.open('https://github.com/FabiodAgostino/TripTasteExtension/archive/refs/heads/main.zip', '_blank')}
            >
              <Download className="w-5 h-5 mr-2" />
              Scarica Estensione Chrome
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => window.open('https://github.com/FabiodAgostino/TripTasteExtension', '_blank')}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Codice Sorgente
            </Button>
          </div>

          <div className="text-sm text-[hsl(var(--dark-slate))]/60 space-y-2">
            <p><strong>Installazione:</strong></p>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Scarica il file ZIP e estrailo</li>
              <li>Vai su chrome://extensions/ nel tuo browser</li>
              <li>Attiva "Modalità sviluppatore"</li>
              <li>Clicca "Carica estensione non pacchettizzata"</li>
              <li>Seleziona la cartella estratta</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Info;