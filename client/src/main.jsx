import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "./context/AuthContext";
import { TemplatesProvider } from "./context/TemplatesContext";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";
import "./sesion.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ChakraProvider>
        <AuthProvider>
          <TemplatesProvider>
            <App />
          </TemplatesProvider>
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
    <Toaster richColors position="top-center" />
  </StrictMode>
);