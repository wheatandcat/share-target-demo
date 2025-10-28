import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('ルート要素が見つかりません');
}
ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .catch((error) => console.error('Service worker registration failed:', error));
    });
}
