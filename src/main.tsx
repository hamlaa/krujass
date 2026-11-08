import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';

// Local, bundled fonts (Thai + Latin subsets only) — no external requests.
import '@fontsource/prompt/thai-400.css';
import '@fontsource/prompt/latin-400.css';
import '@fontsource/prompt/thai-500.css';
import '@fontsource/prompt/latin-500.css';
import '@fontsource/prompt/thai-600.css';
import '@fontsource/prompt/latin-600.css';
import '@fontsource/prompt/thai-700.css';
import '@fontsource/prompt/latin-700.css';
import '@fontsource/prompt/thai-800.css';
import '@fontsource/prompt/latin-800.css';
import '@fontsource/sarabun/thai-400.css';
import '@fontsource/sarabun/latin-400.css';
import '@fontsource/sarabun/thai-500.css';
import '@fontsource/sarabun/latin-500.css';
import '@fontsource/sarabun/thai-600.css';
import '@fontsource/sarabun/latin-600.css';

import './styles/global.css';
import './styles/ui.css';
import './styles/slides.css';
import './styles/feedback.css';
import './styles/transitions.css';
import './styles/invite.css';
import App from './App';
import { sfx } from './audio/soundEngine';

gsap.config({ force3D: true });
gsap.ticker.lagSmoothing(500, 33);
// start fetching the (local) sound files now; they are decoded on the first tap
sfx.preload();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
