# ✊ AI Real-Time Janken Battle ✌️ 🖐️

Webカメラのリアルタイム映像からAI（MediaPipe HandLandmarker）がプレイヤーの手の形状（21個の3次元骨格座標）を自動認識し、Three.js WebGL による初音ミク風3Dアバター対戦相手、そして「じゃん・けん・ぽん！」「あいこで…しょ！」の掛け声と同期して対戦するWebアプリケーションです。

---

## 🌟 主な特徴

- 🩵 **Three.js 初音ミク風3Dアバター (Miku AI)**: エメラルドグリーンのツインテールを持つ3Dアバターが対戦相手としてインタラクティブにアニメーション動作。手ポーズ（グー・チョキ・パー）および勝敗に応じた表情（大喜び・悔しいショック・驚き）を表現。
- ⌨️ **スペースキー（`Space`）即時スタート & リトライ**: ボタン操作だけでなく、`Space` キーで即座に勝負を開始・何度でもやり直し可能。
- 🔄 **「あいこで…しょ！」連続対戦フロー**: 引き分け（あいこ）発生時は 1.2秒後に自動で「あいこで…しょ！」のカウントダウンへ突入し、テンポ良く対戦を継続。
- 🎥 **Webカメラリアルタイム手認識**: MediaPipe Tasks Vision により、ブラウザ上で遅延なく手の形状（グー・チョキ・パー）を検出。
- 🗣️ **「じゃん・けん・ぽん！」掛け声同期**: Web Speech API と Web Audio API により、音声カウントダウンとタイミング精度10ms以内で手を判定。
- 🎨 **ネオンサイバー Glassmorphism UI**: ダークモード、リアルタイム骨格描画、アニメーション、結果エフェクト（勝利時紙吹雪）。
- 📊 **対戦スコア & 履歴記録**: 累計成績、勝率、連勝数、過去20戦のログを保持。

---

## 🚀 クイックスタート

### 依存パッケージのインストール
```bash
pnpm install
```

### 開発サーバーの起動
```bash
pnpm dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスします。

### 単体テストの実行
```bash
pnpm test
```

### リンター品質検証
```bash
pnpm lint
```

### プロダクションビルド
```bash
pnpm build
```

## GitHub Pages

`develop` ブランチへのpush、またはActions画面からの手動実行でビルドと公開を行います。
リポジトリの Settings > Pages > Build and deployment > Source は `GitHub Actions` を選択してください。

---

## 📚 仕様書・各種ドキュメント

詳細な仕様および設計ドキュメントは以下を参照してください。

- 📖 [詳細仕様書 (SPECIFICATION.md)](file:///C:/develop/github/camera_jyanken/docs/SPECIFICATION.md) - カメラ仕様、認識数式・閾値、3Dアバター描画仕様、あいこ遷移テーブル
- 📐 [システム詳細設計書 (ARCHITECTURE.md)](file:///C:/develop/github/camera_jyanken/ARCHITECTURE.md) - モジュール構成図、クラス構造、状態定義
- 📝 [開発計画書 (PLAN.md)](file:///C:/develop/github/camera_jyanken/PLAN.md) - ロードマップ、幾何条件、テスト品質仕様

---

## 🛠️ 使用技術スタック

- **Core**: React 18 / TypeScript / Vite
- **3D Engine**: Three.js WebGL Renderer
- **AI/Vision**: MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- **Audio/Speech**: Web Speech API / Web Audio API
- **Icons/Effects**: Lucide React / Canvas-Confetti
- **Styling**: Vanilla CSS (Glassmorphism & Cyberpunk Neon)
