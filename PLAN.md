# リアルタイムWebカメラじゃんけんシステム 開発計画書 (PLAN.md)

## 1. プロジェクト概要
Webカメラから取得したリアルタイム映像からユーザーの手の形状（21個の3次元ハンドランドマーク）を解析し、「じゃん・けん・ぽん！」の音声を交えたカウントダウンアニメーションと同期して自動対戦を行うWebアプリケーションの開発プロジェクトである。

## 2. 厳格な動作定義と判定基準（曖昧表現の完全排除）
当プロジェクトでは「正しく」「適切に」「上手く」等の曖昧な表現を全排除し、以下の客観的数値および状態遷移にて期待値を規定する。

### 2.1 じゃんけんの手識別仕様
- **グー (Rock)**: 5本の指すべて（親指、人差し指、中指、薬指、小指）の第一関節・第二関節の折れ曲がり角度が 90度以下 かつ、指先と掌基部（Wrist: Landmark index 0）の距離が 手のサイズ比率 0.45未満 である状態。
- **チョキ (Scissors)**: 人差し指（Index finger: Landmark 5-8）および 中指（Middle finger: Landmark 9-12）の伸び率が 0.75以上、かつ 薬指（Ring finger: Landmark 13-16）・小指（Pinky: Landmark 17-20）の伸び率が 0.35未満 である状態。
- **パー (Paper)**: 5本すべての指の伸び率が 0.75以上 である状態。
- **未検出 / 不確定 (Unknown)**: 上記いずれの幾何条件にも適合しない状態、または検出信頼度 score < 0.60 の状態。

### 2.2 ゲームステートマシンと時間軸仕様
```
[IDLE] ---> [COUNTDOWN_JAN] ---> [COUNTDOWN_KEN] ---> [COUNTDOWN_PON] ---> [JUDGEMENT] ---> [RESULT]
 (待機)        (0.0s - 0.8s)       (0.8s - 1.6s)       (1.6s - 2.2s)       (2.2s - 2.5s)     (2.5s - 5.5s)
```
- **IDLE**: ゲーム開始ボタン押下前。Webカメラ映像のライブプレビューおよびランドマーク描画のみ動作する状態。
- **COUNTDOWN_JAN (t = 0.0s)**: Web Speech API により テキスト「じゃん」の音声再生要求を発効し、画面表示を「じゃん」に変更する状態。
- **COUNTDOWN_KEN (t = 0.8s)**: 音声再生要求「けん」を発効し、画面表示を「けん」に変更する状態。
- **COUNTDOWN_PON (t = 1.6s)**: 音声再生要求「ぽん！」を発効し、画面表示を「ぽん！」に変更する状態。
- **JUDGEMENT (t = 2.2s)**: t = 2.2s 時点における最新フレームの Hand Landmarker 検出結果から判定された手（グー/チョキ/パー）を取得し、CPUの手（乱数生成結果）と照合して勝敗を決定する状態。
- **RESULT (t = 2.5s - 5.5s)**: 判定結果（勝利 / 敗北 / 引き分け）および CPUの手を画面描画し、3.0秒経過後に自動的に IDLE 状態へ遷移する状態。

## 3. 実装フェーズおよび進行タスク
1. **Phase 1: プロジェクト基本構造の構築**
   - React + TypeScript + Vite プロジェクトの作成および依存ライブラリ (`@mediapipe/tasks-vision`, `lucide-react`, `canvas-confetti`) のセットアップ。
   - ESLint / TypeScript の厳格設定とクリーンビルド確認。

2. **Phase 2: Hand Detector エンジンの実装**
   - MediaPipe Tasks Vision `GestureRecognizer` / `HandLandmarker` モジュールの初期化クラス実装。
   - Webカメラ映像 (1280x720, 30fps) からの `HTMLVideoElement` 解析ループおよび 21ランドマーク座標のベクトル計算クラス実装。
   - ランドマーク座標からのグー・チョキ・パー判定純粋関数の実装と単体テスト。

3. **Phase 3: じゃんけんゲームエンジン & 音声合成**
   - `useJankenEngine` カスタムフックの実装 (State Machine / Timer / 勝敗判定)。
   - Web Speech API および AudioContext (`state === 'running'`) を用いた「じゃん」「けん」「ぽん！」の超高精度音声再生モジュール。

4. **Phase 4: リッチUI / Glassmorphism コンポーネント実装**
   - モダンサイバーグラスモーフィズムデザイン（ダークモード、ネオンパープル/アクアブルーグラデーション）。
   - Webカメラ Canvas オーバーレイ描画（ネオン骨格関節、指先エフェクト、判定ラベル）。
   - CPU手カード表示、勝敗判定オーバーレイ、対戦ログ・スコアボード。

5. **Phase 5: ドキュメント分離および最終検証**
   - `README.md` を簡潔な概要・クイックスタート形式に構成。
   - 詳細な認識数式、時間軸、ステートマシン仕様を [`docs/SPECIFICATION.md`](file:///C:/develop/github/camera_jyanken/docs/SPECIFICATION.md) へドキュメント化。
   - プロジェクト用 `.gitignore`（`node_modules/`, `dist/`, `.env.local` 等の除外定義）の作成。
   - `npm run lint` 実行による完全な型安全性と無警告状態の確保。

## 4. 品質保証仕様およびテスト実績
- `npm run lint` コマンドでエラー 0件、警告 0件 を確認済み。
- `npx tsc --noEmit` コマンドで型エラー 0件 を確認済み。
- `npm run test` コマンドを実行し、全6項目単体テストが 100% PASS することを確認済み。
- `README.md`（概要・クイックスタート）と [`docs/SPECIFICATION.md`](file:///C:/develop/github/camera_jyanken/docs/SPECIFICATION.md)（詳細仕様書）のドキュメント分離完了。


