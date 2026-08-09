/**
 * MediaPipeランドマーク座標に基づく幾何学的じゃんけん手形状解析サービス
 */

import { AnalyzedHand, FingerState, HandGesture, NormalizedLandmark } from '../types/janken';

/**
 * 2つの3次元正規化座標間のユークリッド距離を算出する純粋関数
 * 
 * @param p1 始点座標 (x, y, z)
 * @param p2 終点座標 (x, y, z)
 * @returns ユークリッド距離 (0.0000 以上の浮動小数点数)
 */
export function calculate3DDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 21箇所のハンドランドマーク配列から、各指の伸長状態および全体のじゃんけんジェスチャーを解析する
 * 
 * 判定仕様（厳密数値定数）:
 * - 4指伸長比率閾値: extensionRatio >= 1.35
 * - 4指屈曲比率閾値: extensionRatio < 1.15
 * - 親指伸長比率閾値: extensionRatio >= 1.10
 * - 信頼度閾値: score >= 0.50
 * 
 * @param landmarks 21箇所の正規化座標配列 (長径 21)
 * @param score MediaPipeの検出信頼度スコア (0.00 〜 1.00)
 * @returns 解析結果オブジェクト (AnalyzedHand)
 */
export function analyzeHandGesture(
  landmarks: NormalizedLandmark[],
  score: number = 1.0
): AnalyzedHand {
  // ランドマーク数が21個未満、または検出信頼度が0.50未満の場合は UNKNOWN を返却する
  if (!landmarks || landmarks.length < 21 || score < 0.50) {
    return {
      gesture: 'UNKNOWN',
      confidence: score,
      fingerStates: [],
      landmarks: landmarks || [],
    };
  }

  const wrist = landmarks[0];

  // 1. 人差し指 (Tip: 8, MCP: 5) の比率算出
  const indexDist = calculate3DDistance(landmarks[8], wrist);
  const indexMcpDist = calculate3DDistance(landmarks[5], wrist);
  const indexRatio = indexMcpDist > 0 ? indexDist / indexMcpDist : 0;

  // 2. 中指 (Tip: 12, MCP: 9) の比率算出
  const middleDist = calculate3DDistance(landmarks[12], wrist);
  const middleMcpDist = calculate3DDistance(landmarks[9], wrist);
  const middleRatio = middleMcpDist > 0 ? middleDist / middleMcpDist : 0;

  // 3. 薬指 (Tip: 16, MCP: 13) の比率算出
  const ringDist = calculate3DDistance(landmarks[16], wrist);
  const ringMcpDist = calculate3DDistance(landmarks[13], wrist);
  const ringRatio = ringMcpDist > 0 ? ringDist / ringMcpDist : 0;

  // 4. 小指 (Tip: 20, MCP: 17) の比率算出
  const pinkyDist = calculate3DDistance(landmarks[20], wrist);
  const pinkyMcpDist = calculate3DDistance(landmarks[17], wrist);
  const pinkyRatio = pinkyMcpDist > 0 ? pinkyDist / pinkyMcpDist : 0;

  // 5. 親指 (Tip: 4, 小指MCP: 17との距離比率) の比率算出
  const thumbDist = calculate3DDistance(landmarks[4], landmarks[17]);
  const indexPinkyMcpDist = calculate3DDistance(landmarks[5], landmarks[17]);
  const thumbRatio = indexPinkyMcpDist > 0 ? thumbDist / indexPinkyMcpDist : 0;

  // 各指の伸長度判定 (伸長閾値: ratio >= 1.35, 親指 ratio >= 1.10)
  const isIndexExtended = indexRatio >= 1.35;
  const isMiddleExtended = middleRatio >= 1.35;
  const isRingExtended = ringRatio >= 1.35;
  const isPinkyExtended = pinkyRatio >= 1.35;
  const isThumbExtended = thumbRatio >= 1.10;

  // 各指の屈曲判定 (屈曲閾値: ratio < 1.15)
  const isIndexFolded = indexRatio < 1.15;
  const isMiddleFolded = middleRatio < 1.15;
  const isRingFolded = ringRatio < 1.15;
  const isPinkyFolded = pinkyRatio < 1.15;

  const fingerStates: FingerState[] = [
    { name: 'thumb', extensionRatio: thumbRatio, isExtended: isThumbExtended },
    { name: 'index', extensionRatio: indexRatio, isExtended: isIndexExtended },
    { name: 'middle', extensionRatio: middleRatio, isExtended: isMiddleExtended },
    { name: 'ring', extensionRatio: ringRatio, isExtended: isRingExtended },
    { name: 'pinky', extensionRatio: pinkyRatio, isExtended: isPinkyExtended },
  ];

  let gesture: HandGesture = 'UNKNOWN';

  // 条件A: PAPER (パー) -> 人差し指・中指・薬指・小指の4指すべてが 伸長 (isExtended === true)
  if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
    gesture = 'PAPER';
  }
  // 条件B: SCISSORS (チョキ) -> 人差し指および中指が 伸長 (isExtended === true) かつ 薬指および小指が 屈曲 (isFolded === true)
  else if (isIndexExtended && isMiddleExtended && isRingFolded && isPinkyFolded) {
    gesture = 'SCISSORS';
  }
  // 条件C: ROCK (グー) -> 人差し指・中指・薬指・小指の4指すべてが 屈曲 (isFolded === true)
  else if (isIndexFolded && isMiddleFolded && isRingFolded && isPinkyFolded) {
    gesture = 'ROCK';
  }

  return {
    gesture,
    confidence: score,
    fingerStates,
    landmarks,
  };
}

/**
 * 2つのじゃんけんの手から勝敗結果を算出する純粋関数
 * 
 * @param player プレイヤーの手 ('ROCK' | 'SCISSORS' | 'PAPER' | 'UNKNOWN')
 * @param cpu CPUの手 ('ROCK' | 'SCISSORS' | 'PAPER')
 * @returns 勝敗判定結果 ('WIN' | 'LOSE' | 'DRAW')
 */
export function evaluateJankenWinner(player: HandGesture, cpu: HandGesture): 'WIN' | 'LOSE' | 'DRAW' {
  // プレイヤーの手が UNKNOWN の場合は不戦敗（LOSE）として処理する
  if (player === 'UNKNOWN') {
    return 'LOSE';
  }

  if (player === cpu) {
    return 'DRAW';
  }

  if (
    (player === 'ROCK' && cpu === 'SCISSORS') ||
    (player === 'SCISSORS' && cpu === 'PAPER') ||
    (player === 'PAPER' && cpu === 'ROCK')
  ) {
    return 'WIN';
  }

  return 'LOSE';
}
