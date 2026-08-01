import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Bootstrap } from './core/Bootstrap';
import { ServiceProvider } from './context/ServiceContext';
import { ErrorBoundary } from './components/ErrorBoundary';

Bootstrap.initializeCritical().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ServiceProvider>
          <App />
        </ServiceProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => Bootstrap.initializeIdle());
  } else {
    setTimeout(() => Bootstrap.initializeIdle(), 1000);
  }
}).catch(error => {
  console.error("Application failed to start", error);
  document.getElementById('root')!.innerHTML = `<div style="color:white; padding: 20px;">Critical Error: Failed to bootstrap application.</div>`;
});
