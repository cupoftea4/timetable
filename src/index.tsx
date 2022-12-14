import React from "react";
import ReactDOM from 'react-dom/client';
import { ToastContainer as MessageToast } from "react-toastify";
import App from "./App";
import "./styles/main.scss";
import 'react-toastify/dist/ReactToastify.css';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
      <App />
      <MessageToast position="bottom-right" theme="colored" /> 
  </React.StrictMode>
);

console.log("Yay! We are going to use right service worker!");

window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
  }
});