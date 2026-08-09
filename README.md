# ✊ AI Real-Time Janken Battle ✌️ 🖐️

Webカメラのリアルタイム映像からAI（MediaPipe HandLandmarker）がプレイヤーの手の形状（21個の3次元骨格座標）を自動認識し、「じゃん・けん・ぽん！」の掛け声と同期して対戦するWebアプリケーションです。

---

## 🌟 主な特徴

- 🎥 **Webカメラリアルタイム手認識**: MediaPipe Tasks Vision により、ブラウザ上で遅延なく手の形状（グー・チョキ・パー）を検出。
- 🗣️ **「じゃん・けん・ぽん！」掛け声同期**: Web Speech API と Web Audio API により、音声カウントダウンとタイミング精度10ms以内で手を判定。
- 🎨 **ネオンサイバー Glassmorphism UI**: ダークモード、リアルタイム骨格描画、アニメーション、結果エフェクト（勝利時紙吹雪）。
- 📊 **対戦スコア & 履歴記録**: 累計成績、勝率、連勝数、過去20戦のログを保持。

---

## 🚀 クイックスタート

### 依存パッケージのインストール
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスします。

### 単体テストの実行
```bash
npm run test
```

### プロダクションビルド
```bash
npm run build
```

---

## 📚 仕様書・各種ドキュメント

詳細な仕様および設計ドキュメントは以下を参照してください。

- 📖 [詳細仕様書 (SPECIFICATION.md)](file:///C:/develop/github/camera_jyanken/docs/SPECIFICATION.md) - カメラ仕様、認識数式・閾値、タイムテーブル、カラー定義
- 📐 [システム詳細設計書 (ARCHITECTURE.md)](file:///C:/develop/github/camera_jyanken/ARCHITECTURE.md) - モジュール構成図、クラス構造、状態定義
- 📝 [開発計画書 (PLAN.md)](file:///C:/develop/github/camera_jyanken/PLAN.md) - ロードマップ、幾何条件、テスト品質仕様

---

## 🛠️ 使用技術スタック

- **Core**: React 18 / TypeScript / Vite
- **AI/Vision**: MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)
- **Audio/Speech**: Web Speech API / Web Audio API
- **Icons/Effects**: Lucide React / Canvas-Confetti
- **Styling**: Vanilla CSS (Glassmorphism & Cyberpunk Neon)
