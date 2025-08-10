import { StrictMode, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";

import { Toaster } from "./components/ui/sonner";
import "./i18n";
import "./index.css";
import { appStore } from "./app/store.js";
import { SocketProvider } from "./context/SocketContext.jsx";

// Get the root element from the HTML
const rootElement = document.getElementById("root");

// Create the root and render the app
ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <Provider store={appStore}>
      {/* --- Wrap your App in Suspense --- */}
      <Suspense fallback={<div>Loading translations...</div>}>
        <SocketProvider>
          <App />
        </SocketProvider>
        <Toaster />
      </Suspense>
    </Provider>
  </StrictMode>
);
