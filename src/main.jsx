import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import './index.css'
import App from './App.jsx'
import { LoginPageProvider } from './contexts/LoginPageContext.jsx';
import { SearchBarProvider } from './contexts/SearchBarContext.jsx';
import { UserProvider } from './contexts/UserContext.jsx';
import { ProductProvider } from './contexts/ProductContext.jsx';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { CONVEX_URL } from './config/env.js';
import { convexClient } from './caller/convexReactClient.js';

// Self-host the dotLottie WebAssembly runtime so no CDN (unpkg/jsdelivr) is
// contacted at runtime. The .wasm is served from /public.
setWasmUrl('/dotlottie-player.wasm');

if (!CONVEX_URL) {
  throw new Error('VITE_CONVEX_URL is required to start the BLive storefront');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConvexAuthProvider client={convexClient}>
      <LoginPageProvider>
        <SearchBarProvider>
          <ProductProvider>
            <UserProvider>
              <App />
            </UserProvider>
          </ProductProvider>
        </SearchBarProvider>
      </LoginPageProvider>
    </ConvexAuthProvider>
  </StrictMode>,
)
