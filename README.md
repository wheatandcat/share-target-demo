# DEMO: Web Share Target API

## 概要

Android の共有シートから渡された URL を PWA が受け取り、そのまま画面に表示するデモ用アプリケーションを提供する。

■ URL

https://share-target-demo.vercel.app/

## 技術スタック

- React + Vite + Tailwind CSS
- pwa

## 実行方法

Android 端末で以下の QR コードを読み取ると、デモアプリが起動。

<img src="./docs/img_qr.png" alt="screenshot"  width="150" />

<br/>

画面のホーム画面に追加をタッチ。

<img src="./docs/img_001.png" alt="screenshot"  width="200" />

以下の画面が表示されてホーム画面にアプリが追加。

<img src="./docs/img_002.png" alt="screenshot"  width="200" />

適当にブラウザを開いて共有ボタンをタッチして、「Share Target API」を選択。

<img src="./docs/img_003.png" alt="screenshot"  width="200" />

以下の画面が表示されて、URL を入力して送信をタッチ。

<img src="./docs/img_004.png" alt="screenshot"  width="200" />

共有された URL の情報が画面にパラメータとして渡されていることが確認できる。

<img src="./docs/img_005.png" alt="screenshot"  width="200" />
