
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Minimal mobile-first initialization
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

console.log(`Initializing app on ${isMobileDevice ? 'MOBILE' : 'DESKTOP'} device`);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Simple app render without complex initialization
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
