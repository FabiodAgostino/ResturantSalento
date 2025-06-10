import { onSnapshot, query, orderBy, limit, getFirestore, Firestore } from 'firebase/firestore';
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
  private isListening = false;
  private serviceWorkerRegistration?: ServiceWorkerRegistration;
  
  constructor() {
    // Inizializza Firebase
    try {
      this.db = getFirestore();
    } catch (ex) {
      initializeApp(firebaseConfig);
      this.db = getFirestore();
    }

    // Recupera timestamp dell'ultima notifica vista
    const stored = localStorage.getItem('lastNotificationSeen');
    this.lastSeenTimestamp = stored ? new Date(stored) : new Date();
    
    // Inizializza Service Worker per Android
    this.initServiceWorker();
    
    // Ripristina stato listener se era attivo
    const savedListening = localStorage.getItem('notificationListenerActive');
    if (savedListening === 'true') {
      setTimeout(() => this.startNotificationListener(), 1000);
    }
  }

  /**
   * 🔧 INIZIALIZZA SERVICE WORKER per Android
   */
  private async initServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      // ✅ FIX: Rileva automaticamente il base URL
      const baseUrl = import.meta.env.BASE_URL || '/';
      const swPath = `${baseUrl}sw.js`.replace('//', '/'); // Evita doppie slash
      
      console.log('📍 Registrando Service Worker da:', swPath);
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(swPath);
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker pronto');
    } catch (error) {
      console.warn('⚠️ Service Worker non registrato:', error);
    }
  }

  /**
   * 🔐 RICHIEDI PERMESSO
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

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
   * 🔔 MOSTRA NOTIFICA
   */
  private async showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    console.log('🔔 Tentativo notifica:', {
      supported: 'Notification' in window,
      permission: Notification.permission,
      isAndroid,
      title: options.title
    });

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      // Android: usa Service Worker se disponibile
      if (isAndroid && this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192.png',
          badge: options.badge || '/badge-72.png',
          tag: options.tag || 'triptaste-notification',
          data: options.data
          // vibrate supportato solo in ServiceWorker context
        });
        
        console.log('✅ Notifica Android via Service Worker');
        return true;
      }

      // Desktop/iOS: notifica normale
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/badge-72.png',
        tag: options.tag || 'triptaste-notification',
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
      console.log('✅ Notifica desktop mostrata');
      return true;

    } catch (error) {
      console.error('❌ Errore notifica:', error);
      return false;
    }
  }

  /**
   * 🎧 AVVIA LISTENER REAL-TIME
   */
  startNotificationListener(): () => void {
    if (this.unsubscribeFirestore) {
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
        changes: snapshot.docChanges().length,
        isFirstLoad: this.isFirstLoad
      });

      // Salta primo caricamento
      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        console.log('🏁 Primo caricamento completato');
        return;
      }

      // Processa nuovi ristoranti
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const restaurant = change.doc.data() as Restaurant;
          
          // Gestione timestamp sicura
          let createdAt: Date;
          try {
            if (restaurant.createdAt instanceof Date) {
              createdAt = restaurant.createdAt;
            } else if (restaurant.createdAt && typeof restaurant.createdAt === 'object' && 'toDate' in restaurant.createdAt) {
              createdAt = (restaurant.createdAt as any).toDate();
            } else {
              createdAt = new Date();
            }
          } catch (error) {
            createdAt = new Date();
          }
          
          // Verifica se è recente
          const oneMinuteAgo = Date.now() - (1 * 60 * 1000);
          const isRecent = createdAt.getTime() > oneMinuteAgo;
          const isAfterLastSeen = createdAt > this.lastSeenTimestamp;
          
          if (isRecent || isAfterLastSeen) {
            console.log('🔔 Nuovo ristorante:', restaurant.name);
            await this.notifyNewRestaurant(restaurant);
          }
        }
      });
    }, (error) => {
      console.error('❌ Errore listener:', error);
    });

    this.isListening = true;
    localStorage.setItem('notificationListenerActive', 'true');
    
    return () => this.stopNotificationListener();
  }

  /**
   * 🍽️ NOTIFICA NUOVO RISTORANTE
   */
  private async notifyNewRestaurant(restaurant: Restaurant): Promise<void> {
    const uniqueTag = `new-restaurant-${restaurant.id}-${Date.now()}`;
    
    const success = await this.showBrowserNotification({
      title: '🍽️ Nuovo Ristorante Scoperto!',
      body: `${restaurant.name} è stato aggiunto in ${restaurant.location}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: uniqueTag,
      data: {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        location: restaurant.location
      }
    });

    if (success) {
      console.log(`✅ Notifica mostrata per: ${restaurant.name}`);
      this.logNotificationShown(restaurant);
    }
  }

  /**
   * 🧪 TEST NOTIFICA
   */
  async testNotification(): Promise<boolean> {
    if (Notification.permission !== 'granted') {
      return false;
    }

    const isAndroid = /Android/i.test(navigator.userAgent);
    
    return await this.showBrowserNotification({
      title: '🧪 Test Notifica',
      body: isAndroid ? 'Test Android funzionante!' : 'Test desktop funzionante!',
      tag: 'test-notification-' + Date.now(),
      icon: '/icon-192.png'
    });
  }

  /**
   * 🛑 FERMA LISTENER
   */
  stopNotificationListener(): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = undefined;
    }
    
    this.isListening = false;
    localStorage.setItem('notificationListenerActive', 'false');
    console.log('🛑 Listener fermato');
  }

  /**
   * ✅ MARCA COME VISTO
   */
  markAsSeen(): void {
    this.lastSeenTimestamp = new Date();
    localStorage.setItem('lastNotificationSeen', this.lastSeenTimestamp.toISOString());
  }

  /**
   * ❓ STATO PERMESSI
   */
  getPermissionStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    canRequest: boolean;
    isListening: boolean;
  } {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    const canRequest = supported && permission === 'default';

    return { supported, permission, canRequest, isListening: this.isListening };
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
      console.error('Errore log:', error);
    }
  }

  /**
   * 🧹 CLEANUP
   */
  destroy(): void {
    this.stopNotificationListener();
  }
}