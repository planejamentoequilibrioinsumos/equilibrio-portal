/* Service Worker do Portal Equilíbrio — push somente para comunicados da gestão. */
importScripts('./push-config.js?v=2');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

function pushConfigReady_() {
  const cfg=self.EQUILIBRIO_PUSH_CONFIG||{};
  const f=cfg.firebase||{};
  return Boolean(f.apiKey&&f.projectId&&f.messagingSenderId&&f.appId&&cfg.vapidKey&&
    !Object.values(f).some(v=>String(v||'').includes('PREENCHER'))&&String(cfg.vapidKey).indexOf('PREENCHER')<0);
}

if (pushConfigReady_()) {
  firebase.initializeApp(self.EQUILIBRIO_PUSH_CONFIG.firebase);
  const messaging=firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    const data=payload&&payload.data?payload.data:{};
    if (data.tipo!=='COMUNICADO') return;
    const title=data.title||'Comunicado da gestão';
    const options={
      body:data.body||'Há um novo comunicado no Portal Comercial.',
      icon:'./icon-192.png',
      badge:'./icon-192.png',
      tag:'equilibrio-comunicado-'+(data.notificationId||Date.now()),
      renotify:true,
      requireInteraction:data.prioridade==='IMPORTANTE',
      data:{url:data.url||'./',notificationId:data.notificationId||''}
    };
    self.registration.showNotification(title,options);
    if ('setAppBadge' in self.registration) {
      self.registration.setAppBadge().catch(function(){});
    }
  });
}

self.addEventListener('notificationclick',function(event){
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for (const client of list) {
      if ('focus' in client && client.url.indexOf('/equilibrio-portal')>=0) {
        if ('navigate' in client) client.navigate(target).catch(function(){});
        return client.focus();
      }
    }
    return clients.openWindow?clients.openWindow(target):null;
  }));
});
