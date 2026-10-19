import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { runDevInitialDataValidation } from '@/systems/validation/runDevInitialDataValidation';

import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV) {
  runDevInitialDataValidation();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
