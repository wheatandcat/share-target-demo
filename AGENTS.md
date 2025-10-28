# Repository Guidelines

## プロジェクト構成とモジュール整理
- `src/` に React + TypeScript の主要ロジックがまとまり、`App.tsx` が共有ターゲットの受信処理、`main.tsx` がエントリーポイントです。
- テスト関連は `src/App.test.tsx` と `setupTests.ts` にあり、UI コンポーネントに隣接する形で `*.test.tsx` を配置します。
- `public/` には `manifest.webmanifest` と `sw.js` があり、PWA の share target 動作とアイコン (`public/icons/`) を管理します。
- 仕様や要件のメモは `docs/specification_1.md` に追記し、仕様変更時はアプリコードと同時に更新してください。
- ルート直下には Vite・Tailwind 設定 (`vite.config.ts`, `tailwind.config.js`, `postcss.config.js`) と `index.html` があり、ビルド時の参照ファイルになります。

## ビルド・テスト・開発コマンド
- `npm install`: 依存関係を初期化します。Node.js 18 以上を推奨します。
- `npm run dev`: Vite 開発サーバーを起動し、Service Worker の更新を即時反映します。
- `npm run build`: `tsc` で型検証後に `vite build` を実行し、本番ビルドを `dist/` に生成します。
- `npm run preview`: 本番ビルドをローカルで提供し、`sw.js` の挙動をデバイスで確認します。
- `npm test`: Vitest を CLI で実行し、`setupTests.ts` の Jest-DOM 拡張を読み込みます。
- `npm run test:ui`: Vitest UI を開き、共有データの状態遷移を目視で確認します。

## コーディングスタイルと命名規約
- TypeScript は `strict` 設定で運用します。共有 payload には `type SharePayload` のように型を定義し、境界値を明示してください。
- コンポーネントとフックは PascalCase、ユーティリティは camelCase、Tailwind のユーティリティクラスは意味単位でまとめます。
- インデントは 2 スペース、シングルクォート、末尾セミコロンなしの Vite 既定スタイルに合わせます。保存時に Prettier 互換フォーマッタを適用してください。
- 副作用は `useEffect` でまとめ、共有メッセージのクリア処理は `useCallback` に集約するなど、状態管理の責務を明確化してください。

## テスト指針
- 単体テストは Vitest + Testing Library を利用し、DOM や ARIA レスポンスを `@testing-library/jest-dom` のマッチャーで検証します。
- シナリオ追加時は `describe` 単位で共有データの受信・クリアを分け、`*.test.tsx` の命名を維持してください。
- モックする `MessageEvent` と `URLSearchParams` は実際のクエリ文字列形式を再現し、空文字列・null を含む境界ケースを必ず網羅します。
- カバレッジ基準は任意ですが、重要ロジック (`sanitizePayload`, `handleMessage`) は 100% 近い網羅率を目指します。

## コミットおよびプルリクエスト指針
- 現在この環境では Git 履歴を確認できません。コミットメッセージは命令形の一文でまとめ、例: `Add share target fallback`。
- 1 コミットにつき 1 つの論点を守り、設定ファイルの変更はアプリコードと分離してください。
- PR 説明には目的・主要変更点・レビュー観点・影響範囲を箇条書きで記載し、UI 変更時は `npm run preview` で確認したスクリーンショットを添付します。
- 関連 Issue は `Closes #123` 形式でリンクし、PWA マニフェスト変更時は Android 端末での実機確認結果を追記してください。

## 共有ターゲット運用上の注意
- `public/sw.js` を更新したら `npm run build && npm run preview` で新しい Service Worker を登録し、ブラウザキャッシュを削除して挙動を確認します。
- Web Share Target は HTTPS でのみ有効です。デプロイ後は `/.well-known/assetlinks.json` が正しく公開されているか必ず検証してください。
- 機密データは共有 payload に含めず、受信後は `clearShareData` を呼び出してブラウザ履歴に残さないようにします。
