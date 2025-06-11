import { onSnapshot, query, orderBy, limit, getFirestore, Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import type { Restaurant } from "../src/lib/types";
import { initializeApp } from 'firebase/app';

interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

interface NotificationState {
  lastProcessedId: number | null;
  lastProcessedTimestamp: number;
  totalNotificationsShown: number;
  isActive: boolean;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export class EnhancedNotificationService {
  private db: Firestore;
  private unsubscribeFirestore?: () => void;
  private state: NotificationState;
  private readonly stateKey = 'notificationState';
  private readonly deviceId: string;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;
  
  constructor() {
    // Genera ID dispositivo unico e persistente
    this.deviceId = this.getOrCreateDeviceId();
    
    // Inizializza Firebase
    try {
      this.db = getFirestore();
    } catch (ex) {
      initializeApp(firebaseConfig);
      this.db = getFirestore();
    }

    // Carica stato persistente
    this.state = this.loadState();
    
    // Inizializza in modo asincrono per evitare blocchi
    this.initialize();
  }

  /**
   * 🔑 GENERA ID DISPOSITIVO UNICO E PERSISTENTE
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('triptaste_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('triptaste_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * 💾 CARICA STATO DA STORAGE PERSISTENTE
   */
  private loadState(): NotificationState {
    try {
      const stored = localStorage.getItem(this.stateKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          lastProcessedId: parsed.lastProcessedId || null,
          lastProcessedTimestamp: parsed.lastProcessedTimestamp || Date.now(),
          totalNotificationsShown: parsed.totalNotificationsShown || 0,
          isActive: parsed.isActive || false
        };
      }
    } catch (error) {
      console.warn('⚠️ Errore caricamento stato:', error);
    }

    return {
      lastProcessedId: null,
      lastProcessedTimestamp: Date.now(),
      totalNotificationsShown: 0,
      isActive: false
    };
  }

  /**
   * 💾 SALVA STATO IN STORAGE PERSISTENTE
   */
  private saveState(): void {
    try {
      localStorage.setItem(this.stateKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('❌ Errore salvataggio stato:', error);
    }
  }

  /**
   * 🔄 SINCRONIZZA STATO CON FIRESTORE (per dispositivi multipli)
   */
  private async syncStateWithFirestore(): Promise<void> {
    try {
      const stateDoc = doc(this.db, 'notificationStates', this.deviceId);
      const firestoreState = await getDoc(stateDoc);
      
      if (firestoreState.exists()) {
        const remoteState = firestoreState.data() as NotificationState;
        
        // Usa il timestamp più recente tra locale e remoto
        if (remoteState.lastProcessedTimestamp > this.state.lastProcessedTimestamp) {
          this.state = { ...remoteState };
          this.saveState();
          console.log('📥 Stato sincronizzato da Firestore');
        }
      }
      
      // Aggiorna sempre lo stato remoto con quello corrente
      await setDoc(stateDoc, this.state);
      
    } catch (error) {
      console.warn('⚠️ Sincronizzazione stato fallita:', error);
    }
  }

  /**
   * 🚀 INIZIALIZZAZIONE ASINCRONA
   */
  private async initialize(): Promise<void> {
    try {
      await this.syncStateWithFirestore();
      this.isInitialized = true;
      
      // Riavvia listener se era attivo
      if (this.state.isActive) {
        console.log('🔄 Ripristino listener notifiche...');
        this.startNotificationListener();
      }
      
    } catch (error) {
      console.error('❌ Inizializzazione fallita:', error);
      
      // Retry con backoff esponenziale
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000;
        setTimeout(() => this.initialize(), delay);
      }
    }
  }

  /**
   * 🔧 INIZIALIZZA SERVICE WORKER con gestione errori avanzata
   */
  private async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker non supportato');
      return null;
    }

    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const swPath = `${baseUrl}sw.js`.replace('//', '/');
      
      const registration = await navigator.serviceWorker.register(swPath);
      await navigator.serviceWorker.ready;
      
      // Gestisci aggiornamenti del SW
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker aggiornato');
      });
      
      return registration;
      
    } catch (error) {
      console.error('❌ Service Worker registration fallita:', error);
      return null;
    }
  }

  /**
   * 🔐 RICHIEDI PERMESSO con retry intelligente
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notification API non supportata');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.warn('⚠️ Permessi notifiche negati dall\'utente');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log(`🔐 Permesso notifiche: ${permission}`);
      return permission;
    } catch (error) {
      console.error('❌ Errore richiesta permesso:', error);
      return 'denied';
    }
  }

  /**
   * 🔔 MOSTRA NOTIFICA con fallback robusto
   */
  private async showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('⚠️ Impossibile mostrare notifica: permessi mancanti');
      return false;
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    
    try {
      // Prova prima con Service Worker (Android)
      if (isAndroid) {
        const swRegistration = await this.initServiceWorker();
        if (swRegistration) {
          await swRegistration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || '/icon-192.png',
            badge: options.badge || '/badge-72.png',
            tag: options.tag || `triptaste-${Date.now()}`,
            data: options.data,
            requireInteraction: false
          });
          
          console.log('📱 Notifica Android mostrata via SW');
          return true;
        }
      }

      // Fallback: notifica normale
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/badge-72.png',
        tag: options.tag || `triptaste-${Date.now()}`,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (options.data?.restaurantId) {
          window.location.href = `/restaurant/${options.data.restaurantId}`;
        }
      };

      // Auto-close dopo 8 secondi
      setTimeout(() => notification.close(), 8000);
      
      console.log('🖥️ Notifica desktop mostrata');
      return true;

    } catch (error) {
      console.error('❌ Errore notifica:', error);
      return false;
    }
  }

  /**
   * 🎧 AVVIA LISTENER con gestione robusta del riavvio
   */
  startNotificationListener(): () => void {
    if (!this.isInitialized) {
      console.warn('⚠️ Servizio non ancora inizializzato');
      return () => {};
    }

    // Ferma listener esistente
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    console.log('🎧 Avvio listener notifiche...');
    
    const restaurantsQuery = query(
      collection(this.db, 'restaurants'),
      orderBy('createdAt', 'desc'),
      limit(50) // Aumentato per sicurezza
    );

    this.unsubscribeFirestore = onSnapshot(
      restaurantsQuery, 
      (snapshot) => this.handleSnapshotUpdate(snapshot),
      (error) => this.handleSnapshotError(error)
    );

    // Aggiorna stato
    this.state.isActive = true;
    this.saveState();
    this.syncStateWithFirestore();

    return () => this.stopNotificationListener();
  }

  /**
   * 📡 GESTISCI AGGIORNAMENTI SNAPSHOT
   */
  private async handleSnapshotUpdate(snapshot: any): Promise<void> {
    console.log('📡 Snapshot ricevuto:', {
      size: snapshot.size,
      changes: snapshot.docChanges().length,
      lastProcessedId: this.state.lastProcessedId
    });

    const newRestaurants: Restaurant[] = [];
    
    // Processa solo nuove aggiunte
    snapshot.docChanges().forEach((change: any) => {
      if (change.type === 'added') {
        const restaurant = { 
          id: change.doc.id, 
          ...change.doc.data() 
        } as Restaurant;
        
        // Filtra solo ristoranti davvero nuovi
        if (this.isNewRestaurant(restaurant)) {
          newRestaurants.push(restaurant);
        }
      }
    });

    // Ordina per timestamp e processa
    const sortedNew = newRestaurants
      .sort((a, b) => this.getTimestamp(a) - this.getTimestamp(b));

    for (const restaurant of sortedNew) {
      await this.processNewRestaurant(restaurant);
    }
  }

  /**
   * ❌ GESTISCI ERRORI SNAPSHOT
   */
  private handleSnapshotError(error: any): void {
    console.error('❌ Errore listener:', error);
    
    // Riprova dopo un delay
    setTimeout(() => {
      if (this.state.isActive) {
        console.log('🔄 Riavvio listener dopo errore...');
        this.startNotificationListener();
      }
    }, 5000);
  }

  /**
   * 🆕 VERIFICA SE RISTORANTE È NUOVO
   */
  private isNewRestaurant(restaurant: Restaurant): boolean {
    const timestamp = this.getTimestamp(restaurant);
    
    // Verifica timestamp
    if (timestamp <= this.state.lastProcessedTimestamp) {
      return false;
    }
    
    // Verifica ID
    if (this.state.lastProcessedId && restaurant.id <= this.state.lastProcessedId) {
      return false;
    }
    
    return true;
  }

  /**
   * ⏰ OTTIENI TIMESTAMP SICURO
   */
  private getTimestamp(restaurant: Restaurant): number {
    try {
      if (restaurant.createdAt instanceof Date) {
        return restaurant.createdAt.getTime();
      }
      if (restaurant.createdAt && typeof restaurant.createdAt === 'object' && 'toDate' in restaurant.createdAt) {
        return (restaurant.createdAt as any).toDate().getTime();
      }
    } catch (error) {
      console.warn('⚠️ Errore parsing timestamp:', error);
    }
    
    return Date.now();
  }

  /**
   * 🍽️ PROCESSA NUOVO RISTORANTE
   */
  private async processNewRestaurant(restaurant: Restaurant): Promise<void> {
    const timestamp = this.getTimestamp(restaurant);
    
    console.log('🍽️ Processando nuovo ristorante:', {
      name: restaurant.name,
      id: restaurant.id,
      timestamp: new Date(timestamp).toISOString()
    });

    const success = await this.showBrowserNotification({
      title: '🍽️ Nuovo Ristorante Scoperto!',
      body: `${restaurant.name} è stato aggiunto a TripTaste`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: `new-restaurant-${restaurant.id}-${timestamp}`,
      data: {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        location: restaurant.location
      }
    });

    if (success) {
      // Aggiorna stato processamento
      this.state.lastProcessedId = restaurant.id;
      this.state.lastProcessedTimestamp = timestamp;
      this.state.totalNotificationsShown++;
      
      this.saveState();
      this.syncStateWithFirestore();
      
      console.log('✅ Notifica mostrata e stato aggiornato');
    }
  }

  /**
   * 🧪 TEST NOTIFICA
   */
  async testNotification(): Promise<boolean> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Test fallito: permessi mancanti');
      return false;
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    
    const success = await this.showBrowserNotification({
      title: '🧪 Test Notifica TripTaste',
      body: isAndroid ? 'Test Android funzionante! 📱' : 'Test desktop funzionante! 🖥️',
      tag: `test-notification-${Date.now()}`,
      icon: '/icon-192.png'
    });

    console.log(`🧪 Test notifica: ${success ? 'SUCCESS' : 'FAILED'}`);
    return success;
  }

  /**
   * 🛑 FERMA LISTENER
   */
  stopNotificationListener(): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = undefined;
    }
    
    this.state.isActive = false;
    this.saveState();
    this.syncStateWithFirestore();
    
    console.log('🛑 Listener notifiche fermato');
  }

  /**
   * ❓ STATO SISTEMA
   */
  getSystemStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    canRequest: boolean;
    isListening: boolean;
    isInitialized: boolean;
    deviceId: string;
    stats: {
      totalShown: number;
      lastProcessedId: number | null;
      lastProcessedTimestamp: string;
    };
  } {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    const canRequest = supported && permission === 'default';

    return {
      supported,
      permission,
      canRequest,
      isListening: this.state.isActive,
      isInitialized: this.isInitialized,
      deviceId: this.deviceId,
      stats: {
        totalShown: this.state.totalNotificationsShown,
        lastProcessedId: this.state.lastProcessedId,
        lastProcessedTimestamp: new Date(this.state.lastProcessedTimestamp).toISOString()
      }
    };
  }

  /**
   * 🔄 RESET COMPLETO
   */
  resetState(): void {
    this.state = {
      lastProcessedId: null,
      lastProcessedTimestamp: Date.now(),
      totalNotificationsShown: 0,
      isActive: false
    };
    
    this.saveState();
    this.syncStateWithFirestore();
    
    console.log('🔄 Stato notifiche resettato');
  }

  /**
   * 🧹 CLEANUP FINALE
   */
  destroy(): void {
    this.stopNotificationListener();
    console.log('🧹 Servizio notifiche distrutto');
  }
}