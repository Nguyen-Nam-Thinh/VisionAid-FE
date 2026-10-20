import { ErrorBoundary } from './ErrorBoundary';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/theme/index.css';
import '../styles/workspace.css';
import { App } from './App';
import { getLocale, loadLocale } from '../i18n';
// A saved English choice loads its dictionary before the first paint (no Vietnamese flash);
// if the chunk fails, the app still renders in Vietnamese.
await loadLocale(getLocale()).catch(() => {});
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
