import { onSnapshot, query, orderBy, limit, Timestamp, getFirestore, Firestore } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import type { Restaurant, InsertRestaurant } from "../src/lib/types";
import { initializeApp, getApps } from 'firebase/app';

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


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


export class SimpleBrowserNotificationService {
  private lastSeenTimestamp: Date;
  private isFirstLoad = true;
  private unsubscribeFirestore?: () => void;
  private db: Firestore;
  private isListening = false; // ✅ FIX: Traccia stato interno
  
  constructor() {
    try
    {
      this.db = getFirestore();
    }catch(ex)
    {
      initializeApp(firebaseConfig);
      this.db = getFirestore();
    }
    // Recupera timestamp dell'ultima notifica vista
    const stored = localStorage.getItem('lastNotificationSeen');
    this.lastSeenTimestamp = stored ? new Date(stored) : new Date();
    
    // ✅ FIX: Ripristina stato listener dal localStorage
    const savedListening = localStorage.getItem('notificationListenerActive');
    if (savedListening === 'true') {
      // Riavvia automaticamente il listener se era attivo
      setTimeout(() => this.startNotificationListener(), 1000);
    }
  }

  /**
   * 🔐 RICHIEDI PERMESSO (solo quando necessario)
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Browser notifications non supportate');
      return 'denied';
    }

    // Se già concesso, restituisci subito
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    // Se già negato, non chiedere più
    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Richiedi permesso solo se default
    try {
      const permission = await Notification.requestPermission();
      console.log('Permesso notifiche:', permission);
      return permission;
    } catch (error) {
      console.error('Errore richiesta permesso:', error);
      return 'denied';
    }
  }

  /**
   * 🔔 MOSTRA NOTIFICA BROWSER (VERSIONE MIGLIORATA)
   */
  private async showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  console.log('🔔 Tentativo notifica:', {
    supported: 'Notification' in window,
    permission: Notification.permission,
    userAgent: navigator.userAgent,
    isAndroid,
    tag: options.tag,
    title: options.title
  });

  if (!('Notification' in window)) {
    console.error('❌ Notification API non supportata');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.error('❌ Permessi non concessi:', Notification.permission);
    return false;
  }

  // ✅ Android workaround
  if (isAndroid && document.visibilityState !== 'visible') {
    console.warn('⚠️ Android: pagina non visibile, notifica potrebbe non apparire');
  }

  try {
    // ✅ FIX: Chiudi eventuali notifiche precedenti con tag simili
    if (options.tag && options.tag.includes('new-restaurant')) {
      console.log('🧹 Preparando spazio per nuova notifica...');
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      badge: options.badge || '/badge-72.png',
      tag: options.tag || 'triptaste-notification',
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false
    });

    console.log('✅ Notifica creata:', {
      title: notification.title,
      body: notification.body,
      tag: notification.tag,
      timestamp: new Date().toISOString()
    });

    // Event handlers più dettagliati
    notification.onclick = () => {
      console.log('👆 Notifica cliccata:', notification.title);
      window.focus();
      notification.close();
      
      if (options.data?.restaurantId) {
        window.location.href = `/restaurant/${options.data.restaurantId}`;
      }
    };

    notification.onshow = () => {
      console.log('👁️ Notifica mostrata:', notification.title);
    };

    notification.onerror = (error) => {
      console.error('❌ Errore notifica:', error);
    };

    notification.onclose = () => {
      console.log('❌ Notifica chiusa:', notification.title);
    };

    // ✅ FIX: Timeout più lungo per dare tempo di vedere la notifica
    if (!options.requireInteraction) {
      setTimeout(() => {
        try {
          console.log('⏰ Auto-close notifica:', notification.title);
          notification.close();
        } catch (e) {
          // Ignore se già chiusa
        }
      }, 10000); // ✅ Aumentato a 10 secondi
    }

    return true;
  } catch (error) {
    console.error('❌ Errore creazione notifica:', error);
    
    // Android fallback
    if (isAndroid) {
      try {
        const simpleNotification = new Notification(options.title, {
          body: options.body,
          icon: '/icon-192.png',
          tag: 'android-fallback-' + Date.now()
        });
        
        setTimeout(() => simpleNotification.close(), 8000);
        console.log('✅ Android fallback notifica creata');
        return true;
      } catch (fallbackError) {
        console.error('❌ Android fallback fallito:', fallbackError);
      }
    }
    
    return false;
  }
}

  /**
   * 🎧 AVVIA LISTENER REAL-TIME CON NOTIFICHE (VERSIONE MIGLIORATA)
   */
startNotificationListener(): () => void {
  // Evita listener multipli
  if (this.unsubscribeFirestore) {
    console.log('⚠️ Listener già attivo, fermandolo prima...');
    this.stopNotificationListener();
  }

  console.log('🎧 Avvio listener notifiche...');
  
  const restaurantsQuery = query(
    collection(this.db, 'restaurants'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  this.unsubscribeFirestore = onSnapshot(restaurantsQuery, (snapshot) => {
    console.log('📡 Firestore snapshot ricevuto:', {
      size: snapshot.size,
      empty: snapshot.empty,
      isFirstLoad: this.isFirstLoad,
      changes: snapshot.docChanges().length
    });

    // Salta SOLO il primo caricamento iniziale
    if (this.isFirstLoad) {
      this.isFirstLoad = false;
      console.log('🏁 Primo caricamento completato, listener ora attivo');
      return;
    }

    // Processa TUTTI i cambiamenti
    snapshot.docChanges().forEach(async (change) => {
      console.log('🔄 Change detected:', {
        type: change.type,
        id: change.doc.id,
        data: change.doc.data()
      });

      if (change.type === 'added') {
        const restaurant = change.doc.data() as Restaurant;
        
        // ✅ FIX: Debug completo del tipo di createdAt
        console.log('🔍 Debug createdAt:', {
          raw: restaurant.createdAt,
          type: typeof restaurant.createdAt,
          isDate: restaurant.createdAt instanceof Date,
          isNull: restaurant.createdAt === null,
          isUndefined: restaurant.createdAt === undefined,
          constructor: restaurant.createdAt?.constructor?.name,
          hasToDate: restaurant.createdAt && typeof restaurant.createdAt === 'object' && 'toDate' in restaurant.createdAt
        });
        
        // ✅ FIX: Conversione ultra-sicura
        let createdAt: Date;
        let parseSuccess = false;
        
        try {
          if (restaurant.createdAt instanceof Date && !isNaN(restaurant.createdAt.getTime())) {
            // È già un Date valido
            createdAt = restaurant.createdAt;
            parseSuccess = true;
          } else if (restaurant.createdAt && typeof restaurant.createdAt === 'object' && 'toDate' in restaurant.createdAt) {
            // Firestore Timestamp
            createdAt = (restaurant.createdAt as any).toDate();
            parseSuccess = !isNaN(createdAt.getTime());
          } else if (restaurant.createdAt && typeof restaurant.createdAt === 'string') {
            // String ISO
            createdAt = new Date(restaurant.createdAt);
            parseSuccess = !isNaN(createdAt.getTime());
          } else if (restaurant.createdAt && typeof restaurant.createdAt === 'number') {
            // Timestamp numerico
            createdAt = new Date(restaurant.createdAt);
            parseSuccess = !isNaN(createdAt.getTime());
          } else {
            // Fallback
            createdAt = new Date();
            parseSuccess = false;
            console.warn('⚠️ createdAt fallback per:', restaurant.name);
          }
          
          // ✅ FIX: Verifica finale che sia un Date valido
          if (!parseSuccess || !(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
            console.error('❌ createdAt parsing fallito, usando ora corrente');
            createdAt = new Date();
          }
          
        } catch (error) {
          console.error('❌ Errore parsing createdAt:', error);
          createdAt = new Date();
        }
        
        // ✅ FIX: Ora siamo sicuri che createdAt sia un Date valido
        const now = Date.now();
        const createdTime = createdAt.getTime();
        const minutesAgo = Math.round((now - createdTime) / (1000 * 60));
        
        console.log('📅 Nuovo ristorante trovato:', {
          name: restaurant.name,
          createdAt: createdAt.toISOString(),
          lastSeen: this.lastSeenTimestamp.toISOString(),
          minutesAgo: minutesAgo,
          parseSuccess
        });
        
        // ✅ FIX: Logica più permissiva per test
        const oneMinuteAgo = now - (1 * 60 * 1000);
        const lastSeenTime = this.lastSeenTimestamp.getTime();
        
        const isVeryRecent = createdTime > oneMinuteAgo;
        const isAfterLastSeen = createdTime > lastSeenTime;
        
        if (isVeryRecent || isAfterLastSeen) {
          console.log('🔔 Triggering notification for:', restaurant.name);
          await this.notifyNewRestaurant(restaurant);
        } else {
          console.log('⏭️ Skipping old restaurant:', restaurant.name, {
            isVeryRecent,
            isAfterLastSeen,
            minutesAgo
          });
        }
      }
    });
  }, (error) => {
    console.error('❌ Errore listener Firestore:', error);
  });

  // ✅ FIX: Aggiorna stato correttamente
  this.isListening = true;
  localStorage.setItem('notificationListenerActive', 'true');
  console.log('✅ Listener attivato, stato salvato');
  
  return () => this.stopNotificationListener();
}

  /**
   * 🍽️ NOTIFICA NUOVO RISTORANTE
   */
  private async notifyNewRestaurant(restaurant: Restaurant): Promise<void> {
  console.log('🍽️ Creando notifica per ristorante:', restaurant.name);
  
  // ✅ FIX: Tag unico per evitare conflitti con notifiche precedenti
  const uniqueTag = `new-restaurant-${restaurant.id}-${Date.now()}`;
  
  const success = await this.showBrowserNotification({
    title: '🍽️ Nuovo Ristorante Scoperto!',
    body: `${restaurant.name} è stato aggiunto in ${restaurant.location}`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: uniqueTag, // ✅ FIX: Tag unico invece di fisso
    data: {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      location: restaurant.location
    },
    requireInteraction: false,
    silent: false
  });

  if (success) {
    console.log(`✅ Notifica mostrata per: ${restaurant.name}`);
    this.logNotificationShown(restaurant);
  } else {
    console.error(`❌ Notifica fallita per: ${restaurant.name}`);
  }
}


  /**
   * 📊 LOG STATISTICHE
   */
  private logNotificationShown(restaurant: Restaurant): void {
    try {
      const stats = JSON.parse(localStorage.getItem('notificationStats') || '{}');
      stats.totalShown = (stats.totalShown || 0) + 1;
      stats.lastShown = new Date().toISOString();
      stats.lastRestaurant = restaurant.name;
      localStorage.setItem('notificationStats', JSON.stringify(stats));
      
    } catch (error) {
      console.error('Errore log notifica:', error);
    }
  }

  /**
   * 🛑 FERMA LISTENER
   */
  stopNotificationListener(): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = undefined;
      console.log('🛑 Listener notifiche fermato');
    }
    
    // ✅ FIX: Aggiorna stato
    this.isListening = false;
    localStorage.setItem('notificationListenerActive', 'false');
  }

  /**
   * ✅ MARCA COME VISTO
   */
  markAsSeen(): void {
    this.lastSeenTimestamp = new Date();
    localStorage.setItem('lastNotificationSeen', this.lastSeenTimestamp.toISOString());
    console.log('✅ Notifiche marcate come viste:', this.lastSeenTimestamp.toISOString());
  }

  /**
   * ❓ CONTROLLA STATO PERMESSI E LISTENER
   */
  getPermissionStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    canRequest: boolean;
    isListening: boolean; // ✅ FIX: Aggiungi stato listener
  } {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    const canRequest = supported && permission === 'default';

    return { 
      supported, 
      permission, 
      canRequest,
      isListening: this.isListening 
    };
  }

  /**
   * 🧪 TEST NOTIFICA (VERSIONE MIGLIORATA)
   */
  async testNotification(): Promise<boolean> {
    console.log('🧪 Avvio test notifica...');
    
    // ✅ FIX: Controlli più dettagliati
    const status = this.getPermissionStatus();
    console.log('📊 Status test:', status);
    
    if (!status.supported) {
      console.error('❌ Browser non supportato');
      return false;
    }
    
    if (status.permission !== 'granted') {
      console.error('❌ Permessi non concessi:', status.permission);
      return false;
    }

    // ✅ FIX: Test più robusto per Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    const testOptions: BrowserNotificationOptions = {
      title: '🧪 Test Notifica TripTaste',
      body: isAndroid 
        ? 'Test Android - Se vedi questo, le notifiche funzionano!' 
        : 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
      tag: 'test-notification-' + Date.now(), // ✅ FIX: Tag unico
      requireInteraction: isAndroid, // ✅ FIX: Su Android richiedi interazione
      icon: '/icon-192.png'
    };

    try {
      const result = await this.showBrowserNotification(testOptions);
      console.log('🧪 Risultato test:', result);
      
      if (result) {
        // Aggiorna stats
        const stats = JSON.parse(localStorage.getItem('notificationStats') || '{}');
        stats.lastTest = new Date().toISOString();
        localStorage.setItem('notificationStats', JSON.stringify(stats));
      }
      
      return result;
    } catch (error) {
      console.error('❌ Errore test notifica:', error);
      return false;
    }
  }

  /**
   * 🧹 CLEANUP
   */
  destroy(): void {
    this.stopNotificationListener();
  }
}