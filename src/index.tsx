import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/700.css";
import "@fontsource/ubuntu/700-italic.css";
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
