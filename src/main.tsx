import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import express from 'express';
import { botControl } from './bot';

// Start the bot server
const app = express();
app.listen(3001, () => {
  console.log('Bot server running on port 3001');
  // Automatically start the bot
  botControl.start();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);