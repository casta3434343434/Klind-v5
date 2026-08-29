import { mount } from 'svelte'
import './styles/global.css'
import { applyTheme } from './lib/utils/theme.js'
import App from './App.svelte'

applyTheme();

const app = mount(App, {
  target: document.getElementById('app'),
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((err) => {
      console.warn('Registrazione service worker fallita:', err);
    });
  });
}

export default app
