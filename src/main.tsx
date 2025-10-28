import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("ルート要素が見つかりません");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    console.log("Service worker registration started");
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) =>
        console.error("Service worker registration failed:", error)
      );
  });
}
