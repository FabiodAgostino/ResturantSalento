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
  processedIds: Set<number>; // 🔧 FIX: Set per tracciare ID processati
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
  private serviceWorkerRegistration?: ServiceWorkerRegistration;
  private isAndroid: boolean;
  private isMobile: boolean;
  
  constructor() {
    // 🔧 FIX: Rileva dispositivo all'inizio
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('📱 Dispositivo rilevato:', {
      isAndroid: this.isAndroid,
      isMobile: this.isMobile,
      userAgent: navigator.userAgent.substring(0, 50)
    });
    
    this.deviceId = this.getOrCreateDeviceId();
    
    try {
      this.db = getFirestore();
    } catch (ex) {
      initializeApp(firebaseConfig);
      this.db = getFirestore();
    }

    this.state = this.loadState();
    
    // 🔧 FIX: Inizializza SW PRIMA di tutto il resto
    this.initializeAsync();
  }

  /**
   * 🚀 INIZIALIZZAZIONE ASINCRONA RISTRUTTURATA
   */
  private async initializeAsync(): Promise<void> {
    try {
      // 1. Prima registra Service Worker (CRITICO per mobile)
      if (this.isMobile) {
        console.log('📱 Inizializzazione Service Worker per mobile...');
        var result = await this.initServiceWorker();
        if(result)
          this.serviceWorkerRegistration =result;

        if (!this.serviceWorkerRegistration) {
          console.warn('⚠️ Service Worker registration fallita su mobile');
        } else {
          console.log('✅ Service Worker registrato su mobile');
        }
      }
      
      // 2. Poi sincronizza stato
      await this.syncStateWithFirestore();
      
      // 3. Marca come inizializzato
      this.isInitialized = true;
      
      // 4. Riavvia listener se era attivo
      if (this.state.isActive) {
        console.log('🔄 Ripristino listener notifiche...');
        setTimeout(() => this.startNotificationListener(), 1000); // Delay per stabilità
      }
      
      console.log('✅ Servizio notifiche inizializzato');
      
    } catch (error) {
      console.error('❌ Inizializzazione fallita:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000;
        console.log(`🔄 Retry inizializzazione tra ${delay}ms...`);
        setTimeout(() => this.initializeAsync(), delay);
      } else {
        console.error('💀 Inizializzazione fallita definitivamente');
      }
    }
  }

  /**
   * 🔑 GENERA ID DISPOSITIVO UNICO
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
   * 💾 CARICA STATO CON FIX PER SET
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
          isActive: parsed.isActive || false,
          // 🔧 FIX: Ricostruisci Set da array
          processedIds: new Set(parsed.processedIds || [])
        };
      }
    } catch (error) {
      console.warn('⚠️ Errore caricamento stato:', error);
    }

    return {
      lastProcessedId: null,
      lastProcessedTimestamp: Date.now(),
      totalNotificationsShown: 0,
      isActive: false,
      processedIds: new Set<number>()
    };
  }

  /**
   * 💾 SALVA STATO CON FIX PER SET
   */
  private saveState(): void {
    try {
      const stateToSave = {
        ...this.state,
        // 🔧 FIX: Converti Set in array per serializzazione
        processedIds: Array.from(this.state.processedIds)
      };
      localStorage.setItem(this.stateKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('❌ Errore salvataggio stato:', error);
    }
  }

  /**
   * 🔄 SINCRONIZZA CON FIRESTORE
   */
  private async syncStateWithFirestore(): Promise<void> {
    try {
      const stateDoc = doc(this.db, 'notificationStates', this.deviceId);
      const firestoreState = await getDoc(stateDoc);
      
      if (firestoreState.exists()) {
        const remoteState = firestoreState.data();
        
        if (remoteState.lastProcessedTimestamp > this.state.lastProcessedTimestamp) {
          // 🔧 FIX: Merge processedIds invece di sovrascrivere
          const remoteProcessedIds = new Set(remoteState.processedIds || []);
          const mergedIds = new Set([...this.state.processedIds, ...remoteProcessedIds]);
          
          this.state = {
            ...remoteState,
            processedIds: mergedIds
          };
          this.saveState();
          console.log('📥 Stato sincronizzato da Firestore con merge');
        }
      }
      
      // Salva stato corrente su Firestore
      const stateToSave = {
        ...this.state,
        processedIds: Array.from(this.state.processedIds)
      };
      await setDoc(stateDoc, stateToSave);
      
    } catch (error) {
      console.warn('⚠️ Sincronizzazione stato fallita:', error);
    }
  }

  /**
   * 🔧 SERVICE WORKER CON GESTIONE ROBUSTA ERRORI
   */
  private async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker non supportato');
      return null;
    }

    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const swPath = `${baseUrl}sw.js`.replace('//', '/');
      
      console.log('🔧 Registrando Service Worker:', swPath);
      
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: baseUrl
      });
      
      // 🔧 FIX: Attendi che SW sia davvero pronto
      await navigator.serviceWorker.ready;
      
      // 🔧 FIX: Verifica che la registration sia attiva
      if (!registration.active) {
        console.log('⏳ Attendo attivazione Service Worker...');
        await new Promise((resolve) => {
          const checkActive = () => {
            if (registration.active) {
              resolve(true);
            } else {
              setTimeout(checkActive, 100);
            }
          };
          checkActive();
        });
      }
      
      console.log('✅ Service Worker attivo e pronto');
      return registration;
      
    } catch (error) {
      console.error('❌ Service Worker registration fallita:', error);
      return null;
    }
  }

  /**
   * 🔐 RICHIEDI PERMESSO
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
   * 🔔 MOSTRA NOTIFICA CON FIX MOBILE
   */
  private async showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('⚠️ Impossibile mostrare notifica: permessi mancanti');
      return false;
    }

    try {
      let notificationShown = false;
      
      // 🔧 FIX: PRIMA prova Service Worker (se disponibile)
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
        try {
          console.log('📱 Tentativo notifica via Service Worker...');
          
          await this.serviceWorkerRegistration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || '/icon-192.png',
            badge: options.badge || '/badge-72.png',
            tag: options.tag || `triptaste-${Date.now()}`,
            data: options.data,
            requireInteraction: false,
            silent: false
          });
          
          console.log('✅ Notifica Service Worker mostrata');
          notificationShown = true;
          
        } catch (swError) {
          console.warn('⚠️ Notifica Service Worker fallita:', swError);
          // Continua con fallback
        }
      }
      
      // 🔧 FIX: FALLBACK SEMPRE - notifica normale se SW fallisce
      if (!notificationShown) {
        console.log('🖥️ Tentativo notifica standard...');
        
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

        setTimeout(() => notification.close(), 8000);
        
        console.log('✅ Notifica standard mostrata');
        notificationShown = true;
      }

      return notificationShown;

    } catch (error) {
      console.error('❌ Errore notifica completo:', error);
      return false;
    }
  }

  /**
   * 🎧 AVVIA LISTENER CON FIX DEDUPLICAZIONE
   */
  startNotificationListener(): () => void {
    if (!this.isInitialized) {
      console.warn('⚠️ Servizio non ancora inizializzato');
      return () => {};
    }

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    console.log('🎧 Avvio listener notifiche...');
    
    const restaurantsQuery = query(
      collection(this.db, 'restaurants'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    this.unsubscribeFirestore = onSnapshot(
      restaurantsQuery, 
      (snapshot) => this.handleSnapshotUpdate(snapshot),
      (error) => this.handleSnapshotError(error)
    );

    this.state.isActive = true;
    this.saveState();
    this.syncStateWithFirestore();

    return () => this.stopNotificationListener();
  }

  /**
   * 📡 GESTISCI SNAPSHOT CON FIX DUPLICATI
   */
  private async handleSnapshotUpdate(snapshot: any): Promise<void> {
    console.log('📡 Snapshot ricevuto:', {
      size: snapshot.size,
      changes: snapshot.docChanges().length,
      processedIds: this.state.processedIds.size
    });

    const newRestaurants: Restaurant[] = [];
    
    snapshot.docChanges().forEach((change: any) => {
      if (change.type === 'added') {
        const restaurant = { 
          id: change.doc.id, 
          ...change.doc.data() 
        } as Restaurant;
        
        
        if (!this.state.processedIds.has(restaurant.id)) {
          console.log('🆕 Nuovo ristorante rilevato:', restaurant.name);
          newRestaurants.push(restaurant);
        } else {
          console.log('⏭️ Ristorante già processato:', restaurant.name);
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
    
    setTimeout(() => {
      if (this.state.isActive) {
        console.log('🔄 Riavvio listener dopo errore...');
        this.startNotificationListener();
      }
    }, 5000);
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
   * 🍽️ PROCESSA NUOVO RISTORANTE CON FIX
   */
  private async processNewRestaurant(restaurant: Restaurant): Promise<void> {
    const timestamp = this.getTimestamp(restaurant);
    const restaurantKey = restaurant.id;
    
    console.log('🍽️ Processando ristorante:', {
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
      // 🔧 FIX: Aggiorna stato in modo più robusto
      this.state.processedIds.add(restaurantKey);
      this.state.lastProcessedId = restaurant.id;
      this.state.lastProcessedTimestamp = Math.max(this.state.lastProcessedTimestamp, timestamp);
      this.state.totalNotificationsShown++;
      
      this.saveState();
      this.syncStateWithFirestore();
      
      console.log('✅ Notifica mostrata e stato aggiornato:', {
        totalShown: this.state.totalNotificationsShown,
        processedCount: this.state.processedIds.size
      });
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

    console.log('🧪 Test notifica per dispositivo:', {
      isAndroid: this.isAndroid,
      isMobile: this.isMobile,
      hasServiceWorker: !!this.serviceWorkerRegistration
    });
    
    const success = await this.showBrowserNotification({
      title: '🧪 Test TripTaste',
      body: this.isAndroid ? 
        'Test Android funzionante! 📱' : 
        this.isMobile ? 
          'Test mobile funzionante! 📱' : 
          'Test desktop funzionante! 🖥️',
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
   * ❓ STATO SISTEMA AGGIORNATO
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
      processedCount: number;
    };
    deviceInfo: {
      isAndroid: boolean;
      isMobile: boolean;
      hasServiceWorker: boolean;
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
        lastProcessedTimestamp: new Date(this.state.lastProcessedTimestamp).toISOString(),
        processedCount: this.state.processedIds.size
      },
      deviceInfo: {
        isAndroid: this.isAndroid,
        isMobile: this.isMobile,
        hasServiceWorker: !!this.serviceWorkerRegistration
      }
    };
  }

  /**
   * 🔄 RESET STATO
   */
  resetState(): void {
    this.state = {
      lastProcessedId: null,
      lastProcessedTimestamp: Date.now(),
      totalNotificationsShown: 0,
      isActive: false,
      processedIds: new Set<number>()
    };
    
    this.saveState();
    this.syncStateWithFirestore();
    
    console.log('🔄 Stato notifiche resettato completamente');
  }

  /**
   * 🧹 CLEANUP
   */
  destroy(): void {
    this.stopNotificationListener();
    console.log('🧹 Servizio notifiche distrutto');
  }
}