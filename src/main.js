import { mount } from 'svelte'
import './styles/global.css'
import App from './App.svelte'
import { applyTheme } from './lib/utils/theme.js'

applyTheme();

const app = mount(App, {
  target: document.getElementById('app'),
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW registration failed:', err));
  });
}

export default app
