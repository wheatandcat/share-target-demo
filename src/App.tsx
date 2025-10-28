import { useCallback, useEffect, useMemo, useState } from 'react';

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

type BeforeInstallPromptEvent = Event & {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
};

const getIsStandaloneMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const hasStandaloneDisplay =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  const hasNavigatorStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(hasStandaloneDisplay || hasNavigatorStandalone);
};

const sanitizePayload = (payload: SharePayload): ShareData | null => {
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

function App(): JSX.Element {
  const [shareData, setShareData] = useState<ShareData | null>(() => getShareDataFromLocation());
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatusMessage, setInstallStatusMessage] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => getIsStandaloneMode());

  const clearShareData = useCallback(() => {
    setShareData(null);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
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
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
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
      } else {
        setInstallStatusMessage('ホーム画面への追加をキャンセルしました。');
        setInstallPromptEvent(null);
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      setInstallStatusMessage('インストール処理でエラーが発生しました。');
    }
  }, [installPromptEvent]);

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
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">PWA Demo</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-100">Share Target Demo</h1>
          <p className="mt-3 text-slate-300">
            Android の共有シートから受け取ったタイトル・テキスト・URL を即座に表示するデモです。
          </p>
          {(installPromptEvent && !isStandalone) || installStatusMessage ? (
            <section
              className="mt-6 space-y-3 rounded-lg border border-slate-700 bg-slate-800/60 p-4"
              aria-label="インストール案内"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-sky-300">ホーム画面に追加</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    ブラウザから直接起動できるショートカットをホーム画面に配置できます。
                  </p>
                </div>
                {installPromptEvent && !isStandalone ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
                  >
                    ホーム画面に追加
                  </button>
                ) : null}
              </div>
              {installStatusMessage ? (
                <p className="text-sm text-slate-400" role="status" aria-live="polite">
                  {installStatusMessage}
                </p>
              ) : null}
            </section>
          ) : null}
        </header>
        <main className="flex-1">{content}</main>
        <footer className="border-t border-slate-800 pt-4 text-sm text-slate-500">
          <p>React + Vite + Tailwind CSS で構築された PWA デモアプリケーションです。</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
