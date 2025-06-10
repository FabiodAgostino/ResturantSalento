self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker attivato');
  self.clients.claim();
});

// Listener per messaggi dal main thread
self.addEventListener('message', (event) => {
  console.log('📨 SW ricevuto messaggio:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    console.log('🔔 SW mostra notifica:', title);
    
    // Mostra notifica tramite Service Worker
    self.registration.showNotification(title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      badge: options.badge || '/badge-72.png',
      tag: options.tag || 'triptaste-notification',
      data: options.data,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200] // Vibrazione per Android
    });
  }
});

// Click handler per notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notifica cliccata:', event.notification);
  
  event.notification.close();
  
  // Apri/focalizza finestra app
  const urlToOpen = event.notification.data?.restaurantId 
    ? `/restaurant/${event.notification.data.restaurantId}`
    : '/';
    
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se c'è già una finestra aperta, focalizzala
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        
        // Altrimenti apri nuova finestra
        return self.clients.openWindow(urlToOpen);
      })
  );
});

