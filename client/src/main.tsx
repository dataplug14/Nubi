import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import { Toaster } from "./components/ui/toaster";
import { Auth0Provider } from "@auth0/auth0-react";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Auth0 configuration
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Validate environment variables
if (!domain || !clientId || !audience) {
  console.error(
    "Missing Auth0 configuration. Please check your environment variables:",
    {
      domain: domain ? "✓" : "✗",
      clientId: clientId ? "✓" : "✗",
      audience: audience ? "✓" : "✗",
    }
  );
}

const redirect_uri = window.location.origin;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri,
          audience,
        }}
        onRedirectCallback={(appState) => {
          window.history.replaceState(
            {},
            document.title,
            appState?.returnTo || window.location.pathname
          );
        }}
      >
        <SWRConfig value={{ fetcher }}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/admin" component={Admin} />
            <Route>404 Page Not Found</Route>
          </Switch>
          <Toaster />
        </SWRConfig>
      </Auth0Provider>
    </ErrorBoundary>
  </StrictMode>
);
