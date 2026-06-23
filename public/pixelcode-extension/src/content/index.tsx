import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import tailwindCss from '../index.css?inline';

// Create a container for the extension
const container = document.createElement('div');
container.id = 'pixelcode-ai-copilot-root';
document.body.appendChild(container);

// Attach a shadow DOM to encapsulate styles
const shadowRoot = container.attachShadow({ mode: 'open' });

// Inject Tailwind CSS into the shadow DOM
const style = document.createElement('style');
style.textContent = tailwindCss;
shadowRoot.appendChild(style);

// Create a mount point inside the shadow DOM
const appRoot = document.createElement('div');
appRoot.id = 'app-root';
shadowRoot.appendChild(appRoot);

// Render the React application
const root = createRoot(appRoot);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
