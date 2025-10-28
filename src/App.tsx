import { useCallback, useEffect, useMemo, useState } from "react";

type SharePayload = {
  title?: string | null;
  text?: string | null;
  url?: string | null;
};

type ShareData = {
  title: string;
  text: string;
  url: string;
  receivedAt: Date;
};

const sanitizePayload = (payload: SharePayload): ShareData | null => {
  if (!payload) {
    return null;
  }

  const title = payload.title?.toString().trim() ?? "";
  const text = payload.text?.toString().trim() ?? "";
  const url = payload.url?.toString().trim() ?? "";

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
    title: params.get("title"),
    text: params.get("text"),
    url: params.get("url"),
  });
};

function App(): JSX.Element {
  const [shareData, setShareData] = useState<ShareData | null>(() =>
    getShareDataFromLocation()
  );

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      alert("インストール完了");
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const clearShareData = useCallback(() => {
    setShareData(null);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type !== "share-target") {
        return;
      }

      const data = sanitizePayload(payload);
      if (data) {
        setShareData(data);
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const data = getShareDataFromLocation();
      if (data) {
        setShareData(data);
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const content = useMemo(() => {
    if (!shareData) {
      return (
        <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800/40 p-6 text-center">
          <p className="text-slate-300">共有された URL はまだありません</p>
          <p className="mt-2 text-sm text-slate-500">
            Android の共有シートから URL を送ると内容がここに表示されます。
          </p>
        </div>
      );
    }

    const { title, text, url, receivedAt } = shareData;

    return (
      <div className="space-y-4 rounded-lg border border-slate-600 bg-slate-800/60 p-6 shadow-lg">
        {title && (
          <h2 className="text-xl font-semibold text-sky-300" aria-live="polite">
            {title}
          </h2>
        )}
        {text && <p className="text-slate-200">{text}</p>}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 break-all text-sky-300 underline underline-offset-4 hover:text-sky-200"
          >
            {url}
          </a>
        )}
        <dl className="text-sm text-slate-400">
          <dt className="font-medium text-slate-300">受信日時</dt>
          <dd>{receivedAt.toLocaleString()}</dd>
        </dl>
        <button
          type="button"
          onClick={clearShareData}
          className="inline-flex items-center justify-center rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          表示をクリア
        </button>
      </div>
    );
  }, [clearShareData, shareData]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">
            DEMO
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-100">
            Web Share Target API
          </h1>
          <p className="mt-3 text-slate-300">
            Android の共有シートから受け取ったタイトル・テキスト・URL
            を即座に表示するデモです
          </p>
          <br />
          {showInstallButton && (
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
            >
              ホーム画面に追加
            </button>
          )}
        </header>
        <main className="flex-1">{content}</main>
      </div>
    </div>
  );
}

export default App;
