import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/700.css";
import "@fontsource/ubuntu/700-italic.css";
import "./styles/main.scss";
import "./index.css";
// Listens for the browser's install offer from the start
import "./hooks/usePwaInstall";

const RELOADED_AT_KEY = "reloadedForMissingFileAt";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// A deploy deleted this build's files, and only the new page names the files that exist now.
// Reloads once, so a file that's still missing doesn't loop.
window.addEventListener("vite:preloadError", (event) => {
  if (Date.now() - Number(sessionStorage.getItem(RELOADED_AT_KEY)) < 10_000) return;
  event.preventDefault();
  sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
  location.reload();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${BUILD_ID}`)
      .catch((error) => console.error("Service worker registration failed:", error));
  });
}
