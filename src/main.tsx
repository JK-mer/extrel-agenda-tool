import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/app.css";

// Apply the saved theme before first paint to avoid a flash.
try {
  if (localStorage.getItem("extrel-agenda/theme") === "dark") {
    document.documentElement.dataset.theme = "dark";
  }
} catch {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
