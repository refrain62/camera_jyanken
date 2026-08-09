/**
 * gestureAnalyzer.ts の幾何解析および勝敗判定純粋関数の単体テスト
 */

import { analyzeHandGesture, calculate3DDistance, evaluateJankenWinner } from './gestureAnalyzer';
import { NormalizedLandmark } from '../types/janken';

/**
 * 簡易テストランナー関数
 */
function assertEqual<T>(actual: T, expected: T, testName: string): void {
  if (actual !== expected) {
    throw new Error(`[FAIL] ${testName}: 期待値 ${String(expected)} ですが 実際の値は ${String(actual)} でした。`);
  }
  console.log(`[PASS] ${testName}`);
}

/**
 * ユーティリティ: 21個のデフォルトランドマーク配列（手首原点）を生成
 */
function createMockLandmarks(): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = [];
  for (let i = 0; i < 21; i++) {
    landmarks.push({ x: 0.5, y: 0.5, z: 0.0 });
  }
  return landmarks;
}

export function runGestureAnalyzerTests(): void {
  console.log('=== gestureAnalyzer.ts 単体テスト開始 ===');

  // Test 1: 3次元ユークリッド距離の計算検証
  // 点A(0,0,0) と 点B(3,4,0) の距離は 5.0000 と一致すること
  const p1: NormalizedLandmark = { x: 0.0, y: 0.0, z: 0.0 };
  const p2: NormalizedLandmark = { x: 3.0, y: 4.0, z: 0.0 };
  const dist = calculate3DDistance(p1, p2);
  assertEqual(dist, 5.0, '3次元ユークリッド距離計算 (0,0,0)-(3,4,0) === 5.0');

  // Test 2: ランドマーク数が21個未満の場合に UNKNOWN が返却されること
  const invalidLandmarks: NormalizedLandmark[] = [{ x: 0.5, y: 0.5, z: 0.0 }];
  const invalidResult = analyzeHandGesture(invalidLandmarks, 0.95);
  assertEqual(invalidResult.gesture, 'UNKNOWN', '要素数1未満のランドマークは UNKNOWN と返却されること');

  // Test 3: 信頼度スコア 0.40 未満の場合に UNKNOWN が返却されること
  const validLengthLandmarks = createMockLandmarks();
  const lowScoreResult = analyzeHandGesture(validLengthLandmarks, 0.35);
  assertEqual(lowScoreResult.gesture, 'UNKNOWN', '信頼度スコア 0.35 の場合は UNKNOWN と返却されること');

  // Test 4: 勝敗判定関数の検証 (evaluateJankenWinner)
  // 4.1 グー vs チョキ -> プレイヤー勝利 (WIN)
  assertEqual(evaluateJankenWinner('ROCK', 'SCISSORS'), 'WIN', 'ROCK vs SCISSORS === WIN');
  // 4.2 チョキ vs パー -> プレイヤー勝利 (WIN)
  assertEqual(evaluateJankenWinner('SCISSORS', 'PAPER'), 'WIN', 'SCISSORS vs PAPER === WIN');
  // 4.3 パー vs グー -> プレイヤー勝利 (WIN)
  assertEqual(evaluateJankenWinner('PAPER', 'ROCK'), 'WIN', 'PAPER vs ROCK === WIN');
  // 4.4 グー vs パー -> プレイヤー敗北 (LOSE)
  assertEqual(evaluateJankenWinner('ROCK', 'PAPER'), 'LOSE', 'ROCK vs PAPER === LOSE');
  // 4.5 チョキ vs チョキ -> 引き分け (DRAW)
  assertEqual(evaluateJankenWinner('SCISSORS', 'SCISSORS'), 'DRAW', 'SCISSORS vs SCISSORS === DRAW');
  // 4.6 手が UNKNOWN の場合 -> 不戦敗 (LOSE)
  assertEqual(evaluateJankenWinner('UNKNOWN', 'ROCK'), 'LOSE', 'UNKNOWN vs ROCK === LOSE');

  console.log('=== 全ての単体テストが正常にパスしました ===');
}

// Node環境からの直接実行サポート
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('gestureAnalyzer.test')) {
  runGestureAnalyzerTests();
}
