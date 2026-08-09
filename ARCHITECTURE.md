# リアルタイムWebカメラじゃんけんシステム システム詳細設計書 (ARCHITECTURE.md)

## 1. システム全体構成

本システムは、ブラウザ単体で動作するWebカメラリアルタイム解析・対戦型じゃんけんアプリケーションである。
MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) を使用してWebカメラのフレームデータをグラフィックカード（WebGL / WASM）上で解析し、手の21個の3次元ランドマーク座標を検出する。

```mermaid
graph TD
    subgraph Browser Client
        Cam[navigator.mediaDevices.getUserMedia] --> |Video Stream| VideoTag[HTMLVideoElement]
        VideoTag --> |Frame Request (requestAnimationFrame)| MP[MediaPipe Gesture/Hand Landmarker]
        MP --> |Landmarks (21 3D Points)| Logic[HandGestureAnalyzer]
        Logic --> |Gesture: ROCK / SCISSORS / PAPER| Engine[JankenGameEngine State Machine]
        
        Engine --> |Trigger Sound| Audio[Voice & Audio Synthesizer (SpeechSynthesis & AudioContext)]
        Engine --> |Update UI State| ReactUI[React Components Layout]
        
        VideoTag --> |Video Frame| OverlayCanvas[Canvas Overlay Renderer]
        MP --> |Landmarks| OverlayCanvas
        OverlayCanvas --> |Render Skeletal Lines & Status| Screen[Display Monitor]
    end
```

## 2. ディレクトリ構造設計

```
camera_jyanken/
├── docs/                      # ドキュメントディレクトリ
│   └── SPECIFICATION.md       # 詳細システム・アルゴリズム・機能仕様書
├── public/
│   ├── favicon.svg            # ファビコン SVG
│   └── favicon.ico
├── src/
│   ├── components/            # React UI コンポーネント
│   │   ├── Header.tsx         # タイトル・コントロールバー
│   │   ├── WebcamContainer.tsx # カメラ表示およびCanvasオーバーレイ
│   │   ├── GameControl.tsx    # じゃんけんスタートボタン・状態表示
│   │   ├── CpuHandDisplay.tsx # CPU側の手アニメーション・表示
│   │   ├── ResultCard.tsx     # 勝敗判定カード・演出
│   │   └── StatsPanel.tsx     # 勝敗統計・連勝数・履歴
│   ├── services/              # コア解析・ロジックモジュール
│   │   ├── handDetector.ts    # MediaPipe HandLandmarker 管理クラス
│   │   ├── gestureAnalyzer.ts # 21ランドマーク座標からの幾何学的手形状判定純粋関数
│   │   ├── gestureAnalyzer.test.ts # 幾何解析および勝敗アルゴリズム単体テスト
│   │   ├── soundService.ts    # Web Speech API / AudioContext 音声・効果音サービス
│   │   └── gameEngine.ts      # じゃんけんゲームステートマシン定義
│   ├── hooks/                 # カスタムフック
│   │   ├── useWebcam.ts       # カメラパーミッション・ストリーム取得
│   │   └── useJankenGame.ts   # じゃんけん進行・タイマー制御
│   ├── types/                 # 型定義
│   │   └── janken.ts          # じゃんけんの状態・手・座標等の型定義
│   ├── styles/                # CSS スタイル
│   │   └── globals.css        # モダンサイバーグラスモーフィズムデザイン
│   ├── App.tsx                # メインアプリケーションコンポーネント
│   └── main.tsx               # エントリーポイント
├── ARCHITECTURE.md            # 本ドキュメント
├── PLAN.md                    # 開発計画書
├── .gitignore                 # Git管理除外設定
├── package.json
└── vite.config.ts
```

## 3. 手形状判定アルゴリズム仕様 (gestureAnalyzer.ts)

### 3.1 Hand Landmark 指標
- Wrist (手首): Index 0
- Thumb (親指): Tip Index 4, IP Index 3, MCP Index 2, CMC Index 1
- Index Finger (人差し指): Tip Index 8, PIP Index 6, MCP Index 5
- Middle Finger (中指): Tip Index 12, PIP Index 10, MCP Index 9
- Ring Finger (薬指): Tip Index 16, PIP Index 14, MCP Index 13
- Pinky (小指): Tip Index 20, PIP Index 18, MCP Index 17

### 3.2 伸長判定数式 (Extension Ratio)
各指 $f \in \{\text{Index}, \text{Middle}, \text{Ring}, \text{Pinky}\}$ における伸長度 $R_f$ を次式により定義する。
$$R_f = \frac{\|\text{Tip}_f - \text{Wrist}\|}{\|\text{MCP}_f - \text{Wrist}\|}$$
- **伸長基準 (Extended)**: $R_f \ge 1.35$ 
- **屈曲基準 (Folded)**: $R_f < 1.10$

親指 $f = \text{Thumb}$ の伸長度 $R_{\text{Thumb}}$ は、親指先端 (Index 4) と小指基部 (MCP: Index 17) の距離割合により算出する。
$$R_{\text{Thumb}} = \frac{\|\text{Thumb\_Tip} - \text{Pinky\_MCP}\|}{\|\text{Index\_MCP} - \text{Pinky\_MCP}\|}$$
- **親指伸長基準**: $R_{\text{Thumb}} \ge 1.10$
- **親指屈曲基準**: $R_{\text{Thumb}} < 0.90$

### 3.3 最終手判定マッピング (Classify Gesture)
1. **ROCK (グー)**: 人差し指、中指、薬指、小指の全4指が Folded ($R_f < 1.10$) であること。
2. **SCISSORS (チョキ)**: 人差し指および中指が Extended ($R_f \ge 1.35$) であり、薬指および小指が Folded ($R_f < 1.10$) であること。
3. **PAPER (パー)**: 4指（人差し指、中指、薬指、小指）すべてが Extended ($R_f \ge 1.35$) であること。
4. **UNKNOWN (判別不可)**: 上記の条件式を満たさない中間状態。

## 4. ゲームステートマシン仕様 (gameEngine.ts)

### 状態遷移定義
| 現在の状態 | 遷移トリガー | 遷移後の状態 | 副作用 (Side Effects) |
|---|---|---|---|
| `IDLE` | `START_GAME` イベント | `COUNTDOWN_JAN` | カウントタイマー開始 ($t=0\text{ms}$), 音声再生「じゃん」 |
| `COUNTDOWN_JAN` | $t \ge 800\text{ms}$ | `COUNTDOWN_KEN` | 音声再生「けん」 |
| `COUNTDOWN_KEN` | $t \ge 1600\text{ms}$ | `COUNTDOWN_PON` | 音声再生「ぽん！」 |
| `COUNTDOWN_PON` | $t \ge 2200\text{ms}$ | `JUDGEMENT` | 最新解析フレームの Gesture 取得, CPUの手（0=ROCK, 1=SCISSORS, 2=PAPER）を固定 |
| `JUDGEMENT` | 勝敗フラグ算出完了 | `RESULT` | スコア更新（勝/負/引き分け、連勝数更新）、紙吹雪エフェクト発動（勝利時） |
| `RESULT` | $t \ge 5500\text{ms}$ | `IDLE` | 表示リセット, 再戦可能状態化 |

## 5. 音声・Web Audio 制御仕様 (soundService.ts)

- **AudioContext 状態要件**: `AudioContext.state === 'running'` (ユーザーインタラクション時に `resume()` を実行する)
- **音声読み上げ仕様**:
  - 言語: `ja-JP`
  - ピッチ: 1.1 (`Utterance.pitch = 1.1`)
  - 速度: 1.2 (`Utterance.rate = 1.2`)
  - ボリューム: 1.0 (`Utterance.volume = 1.0`)
- **Web Audio SE**: Synth Oscillator によるカウントダウンビープ音 ($440\text{Hz}$ / $880\text{Hz}$ / $1760\text{Hz}$ sine wave)

## 6. 品質およびテスト基準
- **すべてのクラス・関数**: JSDoc コメントが付与され、引数・戻り値・事前条件・事後条件が記載されていること。
- **型定義の完全性**: `any` 型の使用は禁止。
- **リンター検証**: `npm run lint` コマンドでエラー 0件、警告 0件 を満たすこと。
