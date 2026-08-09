/**
 * じゃんけんシステムで使用するデータ型およびインターフェース定義
 */

/**
 * 手の形状を表す共用体型
 * - 'ROCK': グー（全指屈曲状態）
 * - 'SCISSORS': チョキ（人差し指・中指伸長、他指屈曲状態）
 * - 'PAPER': パー（全指伸長状態）
 * - 'UNKNOWN': 未検出または判定基準値未達の状態
 */
export type HandGesture = 'ROCK' | 'SCISSORS' | 'PAPER' | 'UNKNOWN';

/**
 * ゲームステートマシンの段階（ステージ）を表す型
 * - 'IDLE': ゲーム開始前の待機状態（映像プレビューのみ動作）
 * - 'COUNTDOWN_JAN': 音声「じゃん」発声ステージ（経過時間: 0ms - 800ms）
 * - 'COUNTDOWN_KEN': 音声「けん」発声ステージ（経過時間: 800ms - 1600ms）
 * - 'COUNTDOWN_PON': 音声「ぽん！」発声ステージ（経過時間: 1600ms - 2200ms）
 * - 'JUDGEMENT': 判定確定ステージ（経過時間: 2200ms - 2500ms）
 * - 'RESULT': 勝敗結果表示ステージ（経過時間: 2500ms - 5500ms）
 */
export type GameStage =
  | 'IDLE'
  | 'COUNTDOWN_JAN'
  | 'COUNTDOWN_KEN'
  | 'COUNTDOWN_PON'
  | 'JUDGEMENT'
  | 'RESULT';

/**
 * 対戦結果を表す型
 * - 'WIN': プレイヤーの勝利
 * - 'LOSE': プレイヤーの敗北
 * - 'DRAW': 引き分け
 */
export type GameResult = 'WIN' | 'LOSE' | 'DRAW';

/**
 * MediaPipeから取得される3次元座標のランドマーク
 */
export interface NormalizedLandmark {
  /** X座標 (0.0000 〜 1.0000 の範囲に正規化された画像横幅比) */
  x: number;
  /** Y座標 (0.0000 〜 1.0000 の範囲に正規化された画像縦幅比) */
  y: number;
  /** Z座標 (カメラ位置を原点とする深さ方向の距離) */
  z: number;
}

/**
 * 単一指の屈曲・伸長解析結果
 */
export interface FingerState {
  /** 指の識別名 ('thumb' | 'index' | 'middle' | 'ring' | 'pinky') */
  name: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  /** 指先と手首の距離と、MCP関節と手首の距離の比率 (数値: 0.00 〜 3.00) */
  extensionRatio: number;
  /** 伸長判定フラグ (extensionRatio >= 1.35 の場合に true) */
  isExtended: boolean;
}

/**
 * 解析された手全体のデータ
 */
export interface AnalyzedHand {
  /** 判定された手のジェスチャー */
  gesture: HandGesture;
  /** 検出信頼度スコア (0.00 〜 1.00) */
  confidence: number;
  /** 各指の解析データ配列 (長径 5要素) */
  fingerStates: FingerState[];
  /** 21箇所の正規化ランドマーク座標配列 */
  landmarks: NormalizedLandmark[];
}

/**
 * 対戦スコア統計情報
 */
export interface GameStats {
  /** 累計対戦回数 (0以上の整数) */
  totalGames: number;
  /** 勝利回数 (0以上の整数) */
  wins: number;
  /** 敗北回数 (0以上の整数) */
  losses: number;
  /** 引き分け回数 (0以上の整数) */
  draws: number;
  /** 現在の連続勝利数 (0以上の整数) */
  currentStreak: number;
  /** 過去最高連続勝利数 (0以上の整数) */
  maxStreak: number;
}

/**
 * 対戦履歴単一レコード
 */
export interface HistoryRecord {
  /** 記録ID (タイムスタンプ文字列) */
  id: string;
  /** 対戦時刻 (HH:mm:ss 形式) */
  timestamp: string;
  /** プレイヤーの手 */
  playerHand: HandGesture;
  /** CPUの手 */
  cpuHand: HandGesture;
  /** 勝敗結果 */
  result: GameResult;
}
