# AI Real-Time Janken Battle 詳細仕様書 (SPECIFICATION.md)

## 1. システム動作環境および入力インターフェース仕様

### 1.1 Webカメラ要件
- **推奨解像度**: 1280 × 720 ピクセル (アスペクト比 16:9)
- **フレームレート**: 30 fps (推奨動作下限: 15 fps)
- **アタッチ方式**: `navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false })`
- **画面表示**: 自撮り操作性の向上のため `transform: scaleX(-1)` による水平反転（鏡像表示）を適用する。

### 1.2 キーボード操作要件 (`Space` キー)
- **入力コード**: `event.code === 'Space'`
- **動作条件**: テキスト入力要素 (`INPUT`, `TEXTAREA`) フォーカス時を除き、`Space` キー押下時に `event.preventDefault()` により画面スクロールを停止し、`stage === 'IDLE'` または `stage === 'RESULT'` の場合に即座に `startGame()` を呼び出す。

### 1.3 画像解析エンジン要件
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
- **屈曲判定 ($F_f = \text{true}$)**: $R_f < 1.10$

### 2.4 手のジェスチャー分類マッピングルール
| ジェスチャー | 必須幾何条件 |
|---|---|
| **パー (PAPER)** | 人差し指、中指、薬指、小指の4指全てにおいて $R_f \ge 1.35$ ($I_f = \text{true}$) |
| **チョキ (SCISSORS)** | 人差し指および中指において $R_f \ge 1.35$ かつ 薬指および小指において $R_f < 1.10$ ($F_f = \text{true}$) |
| **グー (ROCK)** | 人差し指、中指、薬指、小指の4指全てにおいて $R_f < 1.10$ ($F_f = \text{true}$) |
| **未検出 (UNKNOWN)** | 上記の分類条件を満たさない場合、または検出信頼度 Score $< 0.50$ の場合 |

---

## 3. 初音ミク風 3D アバター (Three.js WebGL) 描画仕様

- **カラーパレット**: 髪・ツインテール (`#39c5bb`: エメラルドグリーン), 衣装 (`#1f242d`: ダークブラック, `#f0f4f8`: ホワイト), 肌色 (`#ffdfc4`)。
- **3D指姿勢マッピング**:
  - `ROCK`: 全指のX軸関節回転角度 135度 ($0.75\pi\text{ rad}$)
  - `SCISSORS`: 人差し指・中指回転角度 0度、薬指・小指回転角度 135度 ($0.75\pi\text{ rad}$)
  - `PAPER`: 全指回転角度 0度 (完全伸長)
- **頭部・表情姿勢マッピング**:
  - `WIN` (ミク敗北): 頭部 X軸回転 +0.25 rad（うつむき）、目 Y軸スケール 0.2（目を細める悔しがり表情）
  - `LOSE` (ミク勝利): 頭部 Z軸回転 $\pm 0.08\text{ rad}$（首ふりダンス）、口回転 $\pi\text{ rad}$（大喜び笑顔）
  - `DRAW` (引き分け): 頭部 Z軸回転 +0.25 rad（首かしげ）、目 スケール 1.2倍（驚き顔）

---

## 4. ゲームステートマシンおよびタイムテーブル仕様

```
[IDLE] ---> [COUNTDOWN_JAN] ---> [COUNTDOWN_KEN] ---> [COUNTDOWN_PON] ---> [JUDGEMENT] ---> [RESULT]
 (待機)        (0ms - 800ms)      (800ms - 1600ms)    (1600ms - 2200ms)   (2200ms - 2500ms)  (2500ms - 5500ms)
                                                                                                  | (DRAW発生時 1.2s後)
                                                                                                  v
                                     [JUDGEMENT] <--- [COUNTDOWN_SHO] <--- [COUNTDOWN_AIKO] <-----+
                                    (1400ms - 1700ms)  (800ms - 1400ms)     (0ms - 800ms)
```

### 4.1 通常じゃんけんタイムテーブル
1. **$t = 0\text{ms}$ (`COUNTDOWN_JAN` 開始)**: 音声「じゃん」 (440Hz Sine Wave)
2. **$t = 800\text{ms}$ (`COUNTDOWN_KEN` 遷移)**: 音声「けん」 (587.33Hz Sine Wave)
3. **$t = 1600\text{ms}$ (`COUNTDOWN_PON` 遷移)**: 音声「ぽん！」 (880Hz Triangle Wave)
4. **$t = 2200\text{ms}$ (`JUDGEMENT` 判定確定)**: 最新フレームのプレイヤー手取得、CPU手生成、勝敗判定
5. **$t = 2500\text{ms}$ (`RESULT` 結果表示)**: 結果カード表示、勝敗効果音再生。勝敗決着時は 3000ms 後に `IDLE` へ自動遷移、引き分け時は 1200ms 後に `COUNTDOWN_AIKO` へ自動遷移。

### 4.2 あいこ（引き分け）タイムテーブル
1. **$t = 0\text{ms}$ (`COUNTDOWN_AIKO` 開始)**: 音声「あいこで」 (523.25Hz Sine Wave)
2. **$t = 800\text{ms}$ (`COUNTDOWN_SHO` 遷移)**: 音声「しょ！」 (880Hz Triangle Wave)
3. **$t = 1400\text{ms}$ (`JUDGEMENT` 再判定確定)**: プレイヤー手再取得、CPU手再生成、勝敗判定

---

## 5. テスト・品質保証仕様

- **単体テスト (`npm run test`)**: テスクケース全件合格
- **静的解析 (`npm run lint`)**: ESLint 無警告・無エラー (0 errors, 0 warnings)
- **型チェック (`npx tsc --noEmit`)**: TypeScript 型エラー 0件
