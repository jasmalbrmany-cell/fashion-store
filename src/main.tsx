import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { validateEnv } from './lib/envCheck.ts'
import './index.css'
import App from './App.tsx'

// إجراء فحص أولي للبيئة
validateEnv();

// معالجة مشكلة (Chunk Load Error) تلقائياً عند وجود تحديث جديد للموقع
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (chunk failed to load). Reloading page to fetch newest version...', event);
  // تأخير بسيط للتأكد من أن المتصفح جاهز لإعادة التحميل
  setTimeout(() => window.location.reload(), 100);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
