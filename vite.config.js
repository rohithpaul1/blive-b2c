import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  const isProdBuild = command === 'build' && mode === 'production'

  // ---------------------------------------------------------------------
  // Fail the build rather than ship a misconfigured production bundle.
  // Vite inlines env vars at build time, so a missing VITE_BACKEND_URL would
  // otherwise produce a storefront that silently talks to the wrong backend.
  // On Vercel/Netlify this surfaces as a failed deploy with the message below.
  // ---------------------------------------------------------------------
  // Dummy-frontend builds run with no backend, so the backend/payment env
  // vars aren't required. VITE_USE_MOCKS=true routes all API calls to the
  // in-app mock layer (src/caller/mockData.js).
  const useMocks = String(env.VITE_USE_MOCKS || '').trim() === 'true'

  if (isProdBuild && !useMocks) {
    const missing = ['VITE_BACKEND_URL', 'VITE_RAZORPAY_KEY_ID'].filter(
      (key) => !env[key] || !env[key].trim()
    )
    if (missing.length) {
      throw new Error(
        `\n\n  Production build aborted — missing required environment variable(s):\n` +
          missing.map((k) => `    - ${k}`).join('\n') +
          `\n\n  Set them in your hosting provider's dashboard (Vercel/Netlify:\n` +
          `  Site settings -> Environment variables) and redeploy.\n` +
          `  See .env.example for the expected format.\n`
      )
    }
    if (env.VITE_RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
      console.warn(
        '\n  WARNING: building production with a Razorpay TEST key ' +
          '(rzp_test_*). Real payments will not be collected.\n'
      )
    }
  }

  return {
    plugins: [react(), tailwindcss()],

    esbuild: {
      // Strip developer console noise from production bundles only.
      // console.warn and console.error are deliberately KEPT so real problems
      // are still reportable from a user's browser.
      pure:
        command === 'build'
          ? ['console.log', 'console.debug', 'console.info', 'console.trace']
          : [],
    },

    build: {
      // Source maps are not emitted: this bundle contains booking and payment
      // logic and there is no error-reporting service wired up to consume them.
      // If you add Sentry later, switch this to 'hidden' and upload the maps.
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Split vendor libraries out of the app bundle so shipping an app
          // change doesn't force returning users to re-download React.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react', 'react-icons', 'react-hot-toast'],
            'vendor-utils': ['axios', 'date-fns'],
          },
        },
      },
    },
  }
})
