import React from 'react';

import ReactDOM from 'react-dom/client';

import { BrowserRouter } from 'react-router-dom';

import { ClerkProvider } from '@clerk/clerk-react';

import App from './App.jsx';

import { FragranceProvider } from './context/FragranceContext';

import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>

    <ClerkProvider
      publishableKey={clerkPubKey}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >

      <BrowserRouter>

        <FragranceProvider>

          <App />

        </FragranceProvider>

      </BrowserRouter>

    </ClerkProvider>

  </React.StrictMode>

);

