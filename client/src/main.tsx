import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";
import { useState, useEffect } from "react";

// Configurazione del router per GitHub Pages
const useHashLocation = (): [string, (to: string) => void] => {
  const getHash = () => window.location.hash.replace("#", "") || "/";
  
  const [loc, setLoc] = useState(getHash());
  
  useEffect(() => {
    const handler = () => setLoc(getHash());
    
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  
  const navigate = (to: string) => {
    window.location.hash = to;
  };
  
  return [loc, navigate];
};

// Renderizza l'applicazione con il router configurato
createRoot(document.getElementById("root")!).render(
  <Router hook={useHashLocation}>
    <App />
  </Router>
);