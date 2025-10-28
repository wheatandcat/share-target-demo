import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
const getIsStandaloneMode = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    const hasStandaloneDisplay = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
    const hasNavigatorStandalone = navigator.standalone === true;
    return Boolean(hasStandaloneDisplay || hasNavigatorStandalone);
};
const sanitizePayload = (payload) => {
    if (!payload) {
        return null;
    }
    const title = payload.title?.toString().trim() ?? '';
    const text = payload.text?.toString().trim() ?? '';
    const url = payload.url?.toString().trim() ?? '';
    if (!title && !text && !url) {
        return null;
    }
    return {
        title,
        text,
        url,
        receivedAt: new Date(),
    };
};
const getShareDataFromLocation = () => {
    const params = new URLSearchParams(window.location.search);
    return sanitizePayload({
        title: params.get('title'),
        text: params.get('text'),
        url: params.get('url'),
    });
};
function App() {
    const [shareData, setShareData] = useState(() => getShareDataFromLocation());
    const [installPromptEvent, setInstallPromptEvent] = useState(null);
    const [installStatusMessage, setInstallStatusMessage] = useState(null);
    const [isStandalone, setIsStandalone] = useState(() => getIsStandaloneMode());
    const clearShareData = useCallback(() => {
        setShareData(null);
        window.history.replaceState({}, '', window.location.pathname);
    }, []);
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
            return;
        }
        const handleMessage = (event) => {
            const { type, payload } = event.data || {};
            if (type !== 'share-target') {
                return;
            }
            const data = sanitizePayload(payload);
            if (data) {
                setShareData(data);
                window.history.replaceState({}, '', window.location.pathname);
            }
        };
        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
    }, []);
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            const data = getShareDataFromLocation();
            if (data) {
                setShareData(data);
                window.history.replaceState({}, '', window.location.pathname);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);
    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setInstallPromptEvent(event);
            setInstallStatusMessage(null);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);
    useEffect(() => {
        const handleAppInstalled = () => {
            setIsStandalone(true);
            setInstallPromptEvent(null);
            setInstallStatusMessage('ホーム画面への追加が完了しました。');
        };
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => window.removeEventListener('appinstalled', handleAppInstalled);
    }, []);
    const handleInstallClick = useCallback(async () => {
        if (!installPromptEvent) {
            return;
        }
        try {
            setInstallStatusMessage(null);
            await installPromptEvent.prompt();
            const { outcome } = await installPromptEvent.userChoice;
            if (outcome === 'accepted') {
                setInstallStatusMessage('ホーム画面への追加が完了しました。');
                setInstallPromptEvent(null);
            }
            else {
                setInstallStatusMessage('ホーム画面への追加をキャンセルしました。');
                setInstallPromptEvent(null);
            }
        }
        catch (error) {
            console.error('Install prompt failed:', error);
            setInstallStatusMessage('インストール処理でエラーが発生しました。');
        }
    }, [installPromptEvent]);
    const content = useMemo(() => {
        if (!shareData) {
            return (_jsxs("div", { className: "rounded-lg border border-dashed border-slate-600 bg-slate-800/40 p-6 text-center", children: [_jsx("p", { className: "text-slate-300", children: "\u5171\u6709\u3055\u308C\u305F URL \u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093" }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: "Android \u306E\u5171\u6709\u30B7\u30FC\u30C8\u304B\u3089 URL \u3092\u9001\u308B\u3068\u5185\u5BB9\u304C\u3053\u3053\u306B\u8868\u793A\u3055\u308C\u307E\u3059\u3002" })] }));
        }
        const { title, text, url, receivedAt } = shareData;
        return (_jsxs("div", { className: "space-y-4 rounded-lg border border-slate-600 bg-slate-800/60 p-6 shadow-lg", children: [title && (_jsx("h2", { className: "text-xl font-semibold text-sky-300", "aria-live": "polite", children: title })), text && _jsx("p", { className: "text-slate-200", children: text }), url && (_jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 break-all text-sky-300 underline underline-offset-4 hover:text-sky-200", children: url })), _jsxs("dl", { className: "text-sm text-slate-400", children: [_jsx("dt", { className: "font-medium text-slate-300", children: "\u53D7\u4FE1\u65E5\u6642" }), _jsx("dd", { children: receivedAt.toLocaleString() })] }), _jsx("button", { type: "button", onClick: clearShareData, className: "inline-flex items-center justify-center rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400", children: "\u8868\u793A\u3092\u30AF\u30EA\u30A2" })] }));
    }, [clearShareData, shareData]);
    return (_jsx("div", { className: "min-h-screen bg-slate-900 text-slate-100", children: _jsxs("div", { className: "mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10", children: [_jsxs("header", { children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-wide text-sky-400", children: "PWA Demo" }), _jsx("h1", { className: "mt-2 text-3xl font-bold text-slate-100", children: "Share Target Demo" }), _jsx("p", { className: "mt-3 text-slate-300", children: "Android \u306E\u5171\u6709\u30B7\u30FC\u30C8\u304B\u3089\u53D7\u3051\u53D6\u3063\u305F\u30BF\u30A4\u30C8\u30EB\u30FB\u30C6\u30AD\u30B9\u30C8\u30FBURL \u3092\u5373\u5EA7\u306B\u8868\u793A\u3059\u308B\u30C7\u30E2\u3067\u3059\u3002" }), (installPromptEvent && !isStandalone) || installStatusMessage ? (_jsxs("section", { className: "mt-6 space-y-3 rounded-lg border border-slate-700 bg-slate-800/60 p-4", "aria-label": "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u6848\u5185", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-semibold text-sky-300", children: "\u30DB\u30FC\u30E0\u753B\u9762\u306B\u8FFD\u52A0" }), _jsx("p", { className: "mt-1 text-sm text-slate-300", children: "\u30D6\u30E9\u30A6\u30B6\u304B\u3089\u76F4\u63A5\u8D77\u52D5\u3067\u304D\u308B\u30B7\u30E7\u30FC\u30C8\u30AB\u30C3\u30C8\u3092\u30DB\u30FC\u30E0\u753B\u9762\u306B\u914D\u7F6E\u3067\u304D\u307E\u3059\u3002" })] }), installPromptEvent && !isStandalone ? (_jsx("button", { type: "button", onClick: handleInstallClick, className: "inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200", children: "\u30DB\u30FC\u30E0\u753B\u9762\u306B\u8FFD\u52A0" })) : null] }), installStatusMessage ? (_jsx("p", { className: "text-sm text-slate-400", role: "status", "aria-live": "polite", children: installStatusMessage })) : null] })) : null] }), _jsx("main", { className: "flex-1", children: content }), _jsx("footer", { className: "border-t border-slate-800 pt-4 text-sm text-slate-500", children: _jsx("p", { children: "React + Vite + Tailwind CSS \u3067\u69CB\u7BC9\u3055\u308C\u305F PWA \u30C7\u30E2\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u3067\u3059\u3002" }) })] }) }));
}
export default App;
