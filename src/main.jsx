import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Atualização automática do Service Worker em segundo plano
registerSW({
  immediate: true,
  onRegisteredSW(_swScriptUrl, registration) {
    if (registration) {
      // Checa atualizações periodicamente (a cada 30 min) e quando a aba volta a ficar visível
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {});
        }
      });
    }
  },
})

// Quando o novo Service Worker assume o controle (clientsClaim + skipWaiting),
// recarrega a página para sincronizar os assets e evitar chunks antigos
let refreshing = false;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Tratamento de erro de chunk do Vite (preloadError): se o navegador tentar buscar um chunk removido no novo deploy
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
