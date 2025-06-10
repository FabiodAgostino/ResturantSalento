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
  private isListening = false; // ✅ FIX: Traccia stato interno
  
  constructor() {
    this.db = getFirestore();

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
    // ✅ FIX: Controlli più dettagliati per Android
    console.log('🔔 Tentativo notifica:', {
      supported: 'Notification' in window,
      permission: Notification.permission,
      userAgent: navigator.userAgent,
      isAndroid: /Android/i.test(navigator.userAgent)
    });

    // Controlla supporto
    if (!('Notification' in window)) {
      console.error('❌ Notification API non supportata');
      return false;
    }

    // Controlla permesso
    if (Notification.permission !== 'granted') {
      console.error('❌ Permessi non concessi:', Notification.permission);
      return false;
    }

    // ✅ FIX: Android workaround - verifica se la pagina è visibile
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid && document.visibilityState !== 'visible') {
      console.warn('⚠️ Android: pagina non visibile, notifica potrebbe non apparire');
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/badge-72.png',
        tag: options.tag || 'triptaste-notification',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });

      console.log('✅ Notifica creata:', notification);

      // Click handler
      notification.onclick = () => {
        console.log('👆 Notifica cliccata');
        window.focus();
        notification.close();
        
        // Naviga al ristorante se specificato
        if (options.data?.restaurantId) {
          window.location.href = `/restaurant/${options.data.restaurantId}`;
        }
      };

      // Error handler
      notification.onerror = (error) => {
        console.error('❌ Errore notifica:', error);
      };

      // Auto-close dopo 8 secondi (più tempo per Android)
      if (!options.requireInteraction) {
        setTimeout(() => {
          try {
            notification.close();
          } catch (e) {
            // Ignore se già chiusa
          }
        }, 8000);
      }

      return true;
    } catch (error) {
      console.error('❌ Errore creazione notifica:', error);
      
      // ✅ FIX: Per Android, prova metodo alternativo
      if (isAndroid) {
        try {
          // Fallback per Android: crea notifica più semplice
          const simpleNotification = new Notification(options.title, {
            body: options.body,
            icon: '/icon-192.png'
          });
          
          setTimeout(() => simpleNotification.close(), 5000);
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
        
        // ✅ CORREZIONE: createdAt è già Date, non serve conversione!
        const createdAt = restaurant.createdAt || new Date();
        
        console.log('📅 Timestamp comparison:', {
          restaurantCreated: createdAt.toISOString(),
          lastSeen: this.lastSeenTimestamp.toISOString(),
          isNewer: createdAt > this.lastSeenTimestamp,
          restaurantName: restaurant.name
        });
        
        // ✅ CORREZIONE: Logica più semplice e corretta
        // Considera "nuovo" se aggiunto negli ultimi 2 minuti O se dopo lastSeen
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const isVeryRecent = createdAt > twoMinutesAgo;
        const isAfterLastSeen = createdAt > this.lastSeenTimestamp;
        
        if (isVeryRecent || isAfterLastSeen) {
          console.log('🔔 Triggering notification for:', restaurant.name);
          await this.notifyNewRestaurant(restaurant);
        } else {
          console.log('⏭️ Skipping old restaurant:', restaurant.name, {
            isVeryRecent,
            isAfterLastSeen,
            minutesAgo: Math.round((Date.now() - createdAt.getTime()) / (1000 * 60))
          });
        }
      }
    });
  }, (error) => {
    console.error('❌ Errore listener Firestore:', error);
  });

  // Aggiorna stato
  this.isListening = true;
  localStorage.setItem('notificationListenerActive', 'true');
  
  return () => this.stopNotificationListener();
}

  /**
   * 🍽️ NOTIFICA NUOVO RISTORANTE
   */
  private async notifyNewRestaurant(restaurant: Restaurant): Promise<void> {
    console.log('🍽️ Creando notifica per ristorante:', restaurant.name);
    
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