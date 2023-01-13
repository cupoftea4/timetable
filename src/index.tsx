import React from "react";
import ReactDOM from 'react-dom/client';
import App from "./App";
import "./styles/main.scss";
import 'react-toastify/dist/ReactToastify.css';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);

window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(process.env.PUBLIC_URL + "/service-worker.js");
  }
});