# AI Real-Time Janken Battle 詳細仕様書 (SPECIFICATION.md)

## 1. システム動作環境および入力インターフェース仕様

### 1.1 Webカメラ要件
- **推奨解像度**: 1280 × 720 ピクセル (アスペクト比 16:9)
- **フレームレート**: 30 fps (推奨動作下限: 15 fps)
- **アタッチ方式**: `navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false })`
- **画面表示**: 自撮り操作性の向上のため `transform: scaleX(-1)` による水平反転（鏡像表示）を適用する。

### 1.2 画像解析エンジン要件
- **使用モジュール**: `@mediapipe/tasks-vision` (`HandLandmarker`)
- **推論モード**: `runningMode: 'VIDEO'`
- **ランドマーク数**: 手1点につき21箇所の 3次元正規化座標 $(x, y, z)$
- **検出信頼度閾値**: `minHandDetectionConfidence: 0.50`, `minHandPresenceConfidence: 0.50`, `minTrackingConfidence: 0.50`

---

## 2. 手形状識別幾何アルゴリズム仕様

### 2.1 3次元ユークリッド距離算公式
2つの正規化座標 $P_1(x_1, y_1, z_1)$ と $P_2(x_2, y_2, z_2)$ 間の直線距離 $d(P_1, P_2)$ は以下の算公式により求める。
$$d(P_1, P_2) = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2 + (z_1 - z_2)^2}$$

### 2.2 各指の伸長比率 (Extension Ratio: $R_f$) 定義
手首座標 (Landmark 0) を $W$、各指のMCP関節（基底関節）座標を $M_f$、指先 (Tip) 座標を $T_f$ とするとき、指 $f \in \{\text{index}, \text{middle}, \text{ring}, \text{pinky}\}$ の伸長度比率 $R_f$ を次式で算出する。
$$R_f = \frac{d(T_f, W)}{d(M_f, W)}$$

親指 ($f = \text{thumb}$) については、親指指先 (Landmark 4) と小指MCP (Landmark 17) の距離比率 $R_{\text{thumb}}$ を用いて算出する。
$$R_{\text{thumb}} = \frac{d(T_{\text{thumb}}, M_{\text{pinky}})}{d(M_{\text{index}}, M_{\text{pinky}})}$$

### 2.3 指の伸長・屈曲状態閾値
- **伸長判定 ($I_f = \text{true}$)**: $R_f \ge 1.35$ (親指は $R_{\text{thumb}} \ge 1.10$)
- **屈曲判定 ($F_f = \text{true}$)**: $R_f < 1.15$

### 2.4 手のジェスチャー分類マッピングルール
| ジェスチャー | 必須幾何条件 |
|---|---|
| **パー (PAPER)** | 人差し指、中指、薬指、小指の4指全てにおいて $R_f \ge 1.35$ ($I_f = \text{true}$) |
| **チョキ (SCISSORS)** | 人差し指および中指において $R_f \ge 1.35$ かつ 薬指および小指において $R_f < 1.15$ ($F_f = \text{true}$) |
| **グー (ROCK)** | 人差し指、中指、薬指、小指の4指全てにおいて $R_f < 1.15$ ($F_f = \text{true}$) |
| **未検出 (UNKNOWN)** | 上記の分類条件を満たさない場合、または検出信頼度 Score $< 0.50$ の場合 |

---

## 3. ゲームステートマシンおよびタイムテーブル仕様

ゲームの進行状態は 6 段階の有限ステートマシンにより厳格に遷移する。

```
[IDLE] ---> [COUNTDOWN_JAN] ---> [COUNTDOWN_KEN] ---> [COUNTDOWN_PON] ---> [JUDGEMENT] ---> [RESULT]
 (待機)        (0ms - 800ms)      (800ms - 1600ms)    (1600ms - 2200ms)   (2200ms - 2500ms)  (2500ms - 5500ms)
```

### 3.1 タイムテーブル詳細
1. **$t = 0\text{ms}$ (`COUNTDOWN_JAN` 開始)**:
   - 音声出力: 「じゃん」 (Pitch: 1.0, Rate: 1.3, Beep: 440Hz Sine Wave)
   - 画面表示: 巨大テキスト「じゃん」
2. **$t = 800\text{ms}$ (`COUNTDOWN_KEN` 遷移)**:
   - 音声出力: 「けん」 (Pitch: 1.1, Rate: 1.3, Beep: 587.33Hz Sine Wave)
   - 画面表示: 巨大テキスト「けん」
3. **$t = 1600\text{ms}$ (`COUNTDOWN_PON` 遷移)**:
   - 音声出力: 「ぽん！」 (Pitch: 1.2, Rate: 1.4, Beep: 880Hz Triangle Wave)
   - 画面表示: 巨大テキスト「ぽん！」
4. **$t = 2200\text{ms}$ (`JUDGEMENT` 判定確定)**:
   - 確定処理: $t = 2200\text{ms}$ 時点における `latestGestureRef.current` からプレイヤーの手を取得。
   - CPU手選択: 乱数生成器 `Math.floor(Math.random() * 3)` により 0=ROCK, 1=SCISSORS, 2=PAPER を決定。
   - 勝敗算出: `evaluateJankenWinner` 純粋関数により `WIN`, `LOSE`, `DRAW` を決定。
   - 統計更新: `totalGames` +1, 勝利時 `wins` +1 & `currentStreak` +1, 敗北時 `losses` +1 & `currentStreak` = 0。
5. **$t = 2500\text{ms}$ (`RESULT` 結果表示)**:
   - 結果ポップオーバーカード表示。
   - 勝利時: アルペジオ効果音 (523.25Hz, 659.25Hz, 783.99Hz, 1046.50Hz) + confetti 紙吹雪100粒子発射。
   - 敗北時: 下降トーン効果音 (392.00Hz, 349.23Hz, 329.63Hz, 293.66Hz)。
   - 引き分け時: ダブルビープ音 (440Hz 2回)。
6. **$t = 5500\text{ms}$ (`IDLE` 自動リセット)**:
   - 画面表示を `IDLE` 待機状態へリセットし、再戦可能状態とする。

---

## 4. UI/UX デザイントークンおよびスタイル定義

- **背景ベース色**: `#090d16` (サイバーダークブルー)
- **グラスモーフィズムカード背景**: `rgba(18, 24, 38, 0.75)` (Blur: 16px)
- **プライマリネオンシアン**: `#00f3ff` (骨格線・パーバッジ)
- **プライマリネオンマゼンタ**: `#ff007f` (指先ノード・チョキバッジ)
- **アクセントゴールド**: `#fbbf24` (勝利表示・連勝記録)
- **アクセントパープル**: `#8b5cf6` (CPU表示)

---

## 5. テスト・品質保証仕様

- **単体テスト全6項目 (`npm run test`)**:
  1. `calculate3DDistance({0,0,0}, {3,4,0}) === 5.0` の数値正確性
  2. 長さ1未満の要素数不正ランドマークの `UNKNOWN` 判定
  3. 検出信頼度 `score === 0.35` (0.50未満) の `UNKNOWN` 判定
  4. `evaluateJankenWinner('ROCK', 'SCISSORS') === 'WIN'`
  5. `evaluateJankenWinner('ROCK', 'PAPER') === 'LOSE'`
  6. `evaluateJankenWinner('SCISSORS', 'SCISSORS') === 'DRAW'`
- **静的解析 (`npm run lint`)**: ESLint 無警告・無エラー (0 errors, 0 warnings)
- **型チェック (`npx tsc --noEmit`)**: TypeScript 型エラー 0件
