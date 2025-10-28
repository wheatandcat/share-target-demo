import { jsx as _jsx } from "react/jsx-runtime";
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
const setupServiceWorkerMock = () => {
    const listeners = new Map();
    Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
            addEventListener: (type, listener) => {
                listeners.set(type, listener);
            },
            removeEventListener: (type) => {
                listeners.delete(type);
            },
            controller: {},
            ready: Promise.resolve(),
        },
    });
    const dispatchMessage = (data) => {
        const listener = listeners.get('message');
        if (listener) {
            listener(new MessageEvent('message', { data }));
        }
    };
    return { dispatchMessage };
};
const createBeforeInstallPromptEvent = ({ outcome = 'accepted', } = {}) => {
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
        configurable: true,
        writable: true,
        value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(event, 'userChoice', {
        configurable: true,
        writable: true,
        value: Promise.resolve({ outcome, platform: 'test' }),
    });
    return event;
};
describe('App', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        cleanup();
        window.history.replaceState({}, '', '/');
    });
    it('初期表示では共有待ちメッセージを表示する', () => {
        setupServiceWorkerMock();
        render(_jsx(App, {}));
        expect(screen.getByText('共有された URL はまだありません')).toBeInTheDocument();
    });
    it('URL パラメータが存在する場合は初期表示に反映される', () => {
        setupServiceWorkerMock();
        window.history.replaceState({}, '', '/?url=https%3A%2F%2Fexample.com%2Fshared');
        render(_jsx(App, {}));
        expect(screen.getByRole('link', { name: 'https://example.com/shared' })).toHaveAttribute('href', 'https://example.com/shared');
    });
    it('Service Worker 経由のメッセージで共有内容を更新する', async () => {
        const { dispatchMessage } = setupServiceWorkerMock();
        render(_jsx(App, {}));
        dispatchMessage({
            type: 'share-target',
            payload: {
                title: '共有された記事',
                text: 'チェックしておいて',
                url: 'https://example.com/article',
            },
        });
        expect(await screen.findByRole('heading', { name: '共有された記事' })).toBeInTheDocument();
        expect(screen.getByText('チェックしておいて')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'https://example.com/article' })).toHaveAttribute('href', 'https://example.com/article');
    });
    it('クリアボタンで共有内容をリセットできる', async () => {
        const { dispatchMessage } = setupServiceWorkerMock();
        const user = userEvent.setup();
        render(_jsx(App, {}));
        dispatchMessage({
            type: 'share-target',
            payload: {
                title: '共有された記事',
                text: 'チェックしておいて',
                url: 'https://example.com/article',
            },
        });
        const clearButton = await screen.findByRole('button', { name: '表示をクリア' });
        await user.click(clearButton);
        expect(screen.getByText('共有された URL はまだありません')).toBeInTheDocument();
    });
    it('ホーム画面への追加ボタンを表示してインストール動作を処理する', async () => {
        setupServiceWorkerMock();
        const user = userEvent.setup();
        render(_jsx(App, {}));
        expect(screen.queryByRole('button', { name: 'ホーム画面に追加' })).not.toBeInTheDocument();
        const beforeInstallPromptEvent = createBeforeInstallPromptEvent();
        window.dispatchEvent(beforeInstallPromptEvent);
        const installButton = await screen.findByRole('button', { name: 'ホーム画面に追加' });
        await user.click(installButton);
        expect(beforeInstallPromptEvent.prompt).toHaveBeenCalledTimes(1);
        expect(await screen.findByText('ホーム画面への追加が完了しました。')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'ホーム画面に追加' })).not.toBeInTheDocument();
    });
});
