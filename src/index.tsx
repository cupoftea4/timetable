import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/main.scss";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${APP_VERSION}`)
      .catch((error) => console.error("Service worker registration failed:", error));
  });
}
