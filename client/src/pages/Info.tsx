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
  Settings
} from 'lucide-react';

// Import del tuo servizio notifiche
import { SimpleBrowserNotificationService} from "../../services/notification-service";

const Info = () => {
  // Stato per le notifiche
  const [notificationService] = useState(new SimpleBrowserNotificationService());
  const [permissionStatus, setPermissionStatus] = useState(notificationService.getPermissionStatus());
  const [isListening, setIsListening] = useState(false);
  const [stats, setStats] = useState({ totalShown: 0, lastShown: null });

  useEffect(() => {
    // Carica statistiche notifiche
    const savedStats = JSON.parse(localStorage.getItem('notificationStats') || '{}');
    setStats({
      totalShown: savedStats.totalShown || 0,
      lastShown: savedStats.lastShown || null
    });

    // Cleanup on unmount
    return () => {
      notificationService.destroy();
    };
  }, [notificationService]);

  // Handlers per le notifiche
  const handleRequestPermission = async () => {
    const permission = await notificationService.requestPermission();
    setPermissionStatus(notificationService.getPermissionStatus());
    
    if (permission === 'granted') {
      alert('✅ Permessi concessi! Ora riceverai notifiche per i nuovi ristoranti.');
    } else {
      alert('❌ Permessi negati. Non riceverai notifiche browser.');
    }
  };

  const handleStartListening = () => {
    const unsubscribe = notificationService.startNotificationListener();
    setIsListening(true);
    
    // Salva il cleanup
    (window as any).notificationCleanup = unsubscribe;
    
    alert('🎧 Notifiche attivate! Riceverai un avviso quando vengono aggiunti nuovi ristoranti.');
  };

  const handleStopListening = () => {
    notificationService.stopNotificationListener();
    setIsListening(false);
    
    if ((window as any).notificationCleanup) {
      (window as any).notificationCleanup = undefined;
    }
    
    alert('🛑 Notifiche disattivate.');
  };

  const handleTestNotification = async () => {
    if (permissionStatus.permission !== 'granted') {
      alert('⚠️ Prima devi concedere i permessi per le notifiche!');
      return;
    }

    const success = await notificationService.testNotification();
    
    if (success) {
      alert('✅ Test completato! Dovresti aver visto una notifica.');
    } else {
      alert('❌ Test fallito. Controlla i permessi del browser.');
    }
  };

  const handleMarkAsSeen = () => {
    notificationService.markAsSeen();
    alert('✅ Tutte le notifiche marcate come viste.');
  };

  const getStatusColor = () => {
    switch (permissionStatus.permission) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = () => {
    switch (permissionStatus.permission) {
      case 'granted': return '✅ Concessi';
      case 'denied': return '❌ Negati';
      default: return '⏳ Non richiesti';
    }
  };

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

      {/* SEZIONE NOTIFICHE BROWSER - NUOVA */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[hsl(var(--dark-slate))] flex items-center">
            <Bell className="w-6 h-6 mr-3 text-blue-600" />
            Notifiche Browser Real-time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-[hsl(var(--dark-slate))]/70">
            Ricevi notifiche browser istantanee quando vengono aggiunti nuovi ristoranti. 
            Funziona anche quando hai altre schede aperte!
          </p>

          {/* Status Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-500" />
                  Supporto Browser
                </span>
                <span className={permissionStatus.supported ? 'text-green-600' : 'text-red-600'}>
                  {permissionStatus.supported ? '✅' : '❌'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {permissionStatus.supported ? 'Browser compatibile' : 'Non supportato'}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border">
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
                Stato autorizzazioni browser
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center">
                  {isListening ? 
                    <Volume2 className="w-4 h-4 mr-2 text-green-500" /> :
                    <VolumeX className="w-4 h-4 mr-2 text-gray-500" />
                  }
                  Listener
                </span>
                <span className={isListening ? 'text-green-600' : 'text-gray-500'}>
                  {isListening ? '🎧 Attivo' : '⏸️ Fermo'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Ascolto aggiornamenti real-time
              </p>
            </div>
          </div>

          {/* Statistiche */}
          {stats.totalShown > 0 && (
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                📊 Statistiche Personali
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Notifiche ricevute:</span>
                  <p className="font-semibold text-blue-600">{stats.totalShown}</p>
                </div>
                {stats.lastShown && (
                  <div>
                    <span className="text-gray-600">Ultima notifica:</span>
                    <p className="font-semibold text-blue-600">
                      {new Date(stats.lastShown).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Azioni */}
          <div className="space-y-3">
            {!permissionStatus.supported ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Il tuo browser non supporta le notifiche. Prova Chrome, Firefox o Safari moderno.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {permissionStatus.canRequest && (
                  <Button
                    onClick={handleRequestPermission}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    size="lg"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Richiedi Permessi Notifiche
                  </Button>
                )}

                {permissionStatus.permission === 'granted' && !isListening && (
                  <Button
                    onClick={handleStartListening}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    size="lg"
                  >
                    <Volume2 className="w-5 h-5 mr-2" />
                    Attiva Notifiche Real-time
                  </Button>
                )}

                {isListening && (
                  <Button
                    onClick={handleStopListening}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    <BellOff className="w-5 h-5 mr-2" />
                    Disattiva Notifiche
                  </Button>
                )}

                {permissionStatus.permission === 'granted' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleTestNotification}
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      🧪 Test Notifica
                    </Button>
                    <Button
                      onClick={handleMarkAsSeen}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      ✅ Marca Viste
                    </Button>
                  </div>
                )}

                {permissionStatus.permission === 'denied' && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Permessi negati.</strong> Per abilitare le notifiche:
                      <ol className="list-decimal list-inside mt-2 text-sm">
                        <li>Clicca sull'icona del lucchetto nella barra degli indirizzi</li>
                        <li>Seleziona "Consenti" per le notifiche</li>
                        <li>Ricarica la pagina</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          {/* Note dispositivi */}
          <Alert className="border-orange-200 bg-orange-50">
            <Smartphone className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              <strong>📱 Compatibilità:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li><strong>Desktop:</strong> Chrome, Firefox, Edge, Safari - Funziona perfettamente</li>
                <li><strong>Android:</strong> Chrome, Firefox - Funziona bene</li>
                <li><strong>iOS Safari:</strong> Solo con app aggiunta alla Home Screen + flag sperimentale</li>
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