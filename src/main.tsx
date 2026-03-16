// Punto de entrada principal de HabitVault
// Inicializa i18n antes de montar React
import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n"; // inicializar internacionalización
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
