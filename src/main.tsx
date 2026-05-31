import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import { App } from '@/app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '12px',
          background: '#fff',
          color: '#1e293b',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
    <App />
  </StrictMode>
);
