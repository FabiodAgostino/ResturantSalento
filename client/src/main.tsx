import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";
import { useState, useEffect } from "react";

// Configurazione del router per GitHub Pages
const useHashLocation = (): [string, (to: string) => void] => {
  // Funzione per ottenere il percorso corrente dal hash
  const getHash = () => window.location.hash.substring(1) || "/";
  
  const [loc, setLoc] = useState(getHash());
  
  useEffect(() => {
    // Funzione per aggiornare la location quando cambia il hash
    const handleHashChange = () => {
      const newLoc = getHash();
      setLoc(newLoc);
    };
    
    // Inizializza il hash se non esiste
    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    
    // Aggiungi listener per hashchange
    window.addEventListener("hashchange", handleHashChange);
    
    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);
  
  // Funzione per navigare cambiando il hash
  const navigate = (to: string) => {
    window.location.hash = "#" + to;
  };
  
  return [loc, navigate];
};

// Esporta l'hook per usarlo in altri componenti
export { useHashLocation };

// Renderizza l'applicazione con il router configurato
createRoot(document.getElementById("root")!).render(
  <Router hook={useHashLocation}>
    <App />
  </Router>
);