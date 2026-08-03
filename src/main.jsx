import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import './index.css'
import App from './App.jsx'
import { LoginPageProvider } from './contexts/LoginPageContext.jsx';
import { SearchBarProvider } from './contexts/SearchBarContext.jsx';
import { UserProvider } from './contexts/UserContext.jsx';
import { ProductProvider } from './contexts/ProductContext.jsx';

// Self-host the dotLottie WebAssembly runtime so no CDN (unpkg/jsdelivr) is
// contacted at runtime. The .wasm is served from /public.
setWasmUrl('/dotlottie-player.wasm');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoginPageProvider>
      <SearchBarProvider>
        <ProductProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </ProductProvider>
      </SearchBarProvider>
    </LoginPageProvider>
  </StrictMode>,
)
