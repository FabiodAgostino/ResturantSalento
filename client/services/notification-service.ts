
import { onSnapshot, query, orderBy, limit, Timestamp, getFirestore, Firestore } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import type { Restaurant, InsertRestaurant } from "../src/lib/types";

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

export class SimpleBrowserNotificationService {
  private lastSeenTimestamp: Date;
  private isFirstLoad = true;
  private unsubscribeFirestore?: () => void;
  private db: Firestore;
  
  constructor() {
    this.db = getFirestore();

    // Recupera timestamp dell'ultima notifica vista
    const stored = localStorage.getItem('lastNotificationSeen');
    this.lastSeenTimestamp = stored ? new Date(stored) : new Date();
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
   * 🔔 MOSTRA NOTIFICA BROWSER
   */
  private async showBrowserNotification(options: BrowserNotificationOptions): Promise<boolean> {
    // Controlla supporto
    if (!('Notification' in window)) {
      return false;
    }

    // Controlla permesso
    if (Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/badge-72.png',
        tag: options.tag || 'triptaste-notification',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      // Click handler
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Naviga al ristorante se specificato
        if (options.data?.restaurantId) {
          window.location.href = `/restaurant/${options.data.restaurantId}`;
        }
      };

      // Auto-close dopo 6 secondi (se non requireInteraction)
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 6000);
      }

      return true;
    } catch (error) {
      console.error('Errore browser notification:', error);
      return false;
    }
  }

  /**
   * 🎧 AVVIA LISTENER REAL-TIME CON NOTIFICHE
   */
  startNotificationListener(): () => void {
    const restaurantsQuery = query(
      collection(this.db, 'restaurants'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    this.unsubscribeFirestore = onSnapshot(restaurantsQuery, (snapshot) => {
      // Salta il primo caricamento per evitare spam
      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        console.log('Listener notifiche attivato');
        return;
      }

      // Processa solo documenti aggiunti
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const restaurant = change.doc.data() as Restaurant;
          const createdAt = restaurant.createdAt || new Date();
          
          // Solo ristoranti aggiunti dopo l'ultima visita
          if (createdAt > this.lastSeenTimestamp) {
            await this.notifyNewRestaurant(restaurant);
          }
        }
      });
    });

    return () => this.stopNotificationListener();
  }

  /**
   * 🍽️ NOTIFICA NUOVO RISTORANTE
   */
  private async notifyNewRestaurant(restaurant: Restaurant): Promise<void> {
    const success = await this.showBrowserNotification({
      title: '🍽️ Nuovo Ristorante Scoperto!',
      body: `${restaurant.name} è stato aggiunto in ${restaurant.location}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'new-restaurant',
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
    }
  }

  /**
   * 📊 LOG STATISTICHE (opzionale)
   */
  private async logNotificationShown(restaurant: Restaurant): Promise<void> {
    try {
      // Puoi salvare su Firestore per analytics
      // await addDoc(collection(db, 'notification_logs'), {
      //   type: 'browser_notification',
      //   restaurantId: restaurant.id,
      //   restaurantName: restaurant.name,
      //   timestamp: Timestamp.now(),
      //   userAgent: navigator.userAgent
      // });
      
      // O semplicemente in localStorage per stats locali
      const stats = JSON.parse(localStorage.getItem('notificationStats') || '{}');
      stats.totalShown = (stats.totalShown || 0) + 1;
      stats.lastShown = new Date().toISOString();
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
      console.log('Listener notifiche fermato');
    }
  }

  /**
   * ✅ MARCA COME VISTO
   */
  markAsSeen(): void {
    this.lastSeenTimestamp = new Date();
    localStorage.setItem('lastNotificationSeen', this.lastSeenTimestamp.toISOString());
    console.log('Notifiche marcate come viste');
  }

  /**
   * ❓ CONTROLLA STATO PERMESSI
   */
  getPermissionStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    canRequest: boolean;
  } {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'denied';
    const canRequest = supported && permission === 'default';

    return { supported, permission, canRequest };
  }

  /**
   * 🧪 TEST NOTIFICA
   */
  async testNotification(): Promise<boolean> {
    return await this.showBrowserNotification({
      title: '🧪 Test Notifica',
      body: 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
      tag: 'test-notification',
      requireInteraction: false
    });
  }

  /**
   * 🧹 CLEANUP
   */
  destroy(): void {
    this.stopNotificationListener();
  }
}

