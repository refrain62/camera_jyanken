/**
 * じゃんけんゲームの全体進行・タイマー制御・勝敗統計管理フック
 */

import confetti from 'canvas-confetti';
import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateJankenWinner } from '../services/gestureAnalyzer';
import { soundService } from '../services/soundService';
import { GameResult, GameStage, GameStats, HandGesture, HistoryRecord } from '../types/janken';

export interface UseJankenGameReturn {
  stage: GameStage;
  playerHand: HandGesture;
  cpuHand: HandGesture;
  result: GameResult | null;
  stats: GameStats;
  history: HistoryRecord[];
  startGame: (getCurrentPlayerHand: () => HandGesture) => void;
  resetStats: () => void;
}

const INITIAL_STATS: GameStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  maxStreak: 0,
};

/**
 * じゃんけんゲーム進行制御カスタムフック
 */
export function useJankenGame(): UseJankenGameReturn {
  const [stage, setStage] = useState<GameStage>('IDLE');
  const [playerHand, setPlayerHand] = useState<HandGesture>('UNKNOWN');
  const [cpuHand, setCpuHand] = useState<HandGesture>('ROCK');
  const [result, setResult] = useState<GameResult | null>(null);
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // 複数タイマー管理用配列リファレンス
  const timersRef = useRef<number[]>([]);

  /**
   * 動作中のすべてのタイマーを破棄し、タイマー配列を空にする
   */
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  // コンポーネント破棄時にタイマーを完全消去
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  /**
   * スコア統計情報を初期化する
   */
  const resetStats = useCallback(() => {
    clearAllTimers();
    setStage('IDLE');
    setStats(INITIAL_STATS);
    setHistory([]);
  }, [clearAllTimers]);

  /**
   * ランダムなCPUの手 ('ROCK' | 'SCISSORS' | 'PAPER') を生成する
   */
  const getRandomCpuHand = (): HandGesture => {
    const hands: HandGesture[] = ['ROCK', 'SCISSORS', 'PAPER'];
    const randomIndex = Math.floor(Math.random() * 3);
    return hands[randomIndex];
  };

  /**
   * じゃんけんゲームシークエンスを開始する関数
   * 
   * @param getCurrentPlayerHand 最新フレームから判定されたプレイヤーの手を取得するクロージャ
   */
  const startGame = useCallback((getCurrentPlayerHand: () => HandGesture) => {
    if (stage !== 'IDLE') return;

    // 以前の未処理タイマーを全消去
    clearAllTimers();

    // 音声コンテキストの初期化/有効化
    soundService.ensureAudioContext();

    // 1. COUNTDOWN_JAN ステージ開始 (t = 0ms)
    setStage('COUNTDOWN_JAN');
    setPlayerHand('UNKNOWN');
    setResult(null);
    soundService.speakJan();

    // 2. COUNTDOWN_KEN ステージ遷移 (t = 800ms)
    const t1 = window.setTimeout(() => {
      setStage('COUNTDOWN_KEN');
      soundService.speakKen();

      // 3. COUNTDOWN_PON ステージ遷移 (t = 1600ms)
      const t2 = window.setTimeout(() => {
        setStage('COUNTDOWN_PON');
        soundService.speakPon();

        // 4. JUDGEMENT 判定確定ステージ (t = 2200ms)
        const t3 = window.setTimeout(() => {
          setStage('JUDGEMENT');

          // タイミング精度 10ms 以内にてプレイヤーの手を確定取得
          const detectedPlayerHand = getCurrentPlayerHand();
          const generatedCpuHand = getRandomCpuHand();

          setPlayerHand(detectedPlayerHand);
          setCpuHand(generatedCpuHand);

          // 勝敗の判定
          const gameResult = evaluateJankenWinner(detectedPlayerHand, generatedCpuHand);
          setResult(gameResult);

          // スコアおよび統計の更新
          setStats((prevStats) => {
            const isWin = gameResult === 'WIN';
            const isLose = gameResult === 'LOSE';

            const newStreak = isWin ? prevStats.currentStreak + 1 : isLose ? 0 : prevStats.currentStreak;
            const newMaxStreak = Math.max(prevStats.maxStreak, newStreak);

            return {
              totalGames: prevStats.totalGames + 1,
              wins: prevStats.wins + (isWin ? 1 : 0),
              losses: prevStats.losses + (isLose ? 1 : 0),
              draws: prevStats.draws + (gameResult === 'DRAW' ? 1 : 0),
              currentStreak: newStreak,
              maxStreak: newMaxStreak,
            };
          });

          // 対戦履歴レコードの追加
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          
          setHistory((prevHistory) => [
            {
              id: `${now.getTime()}`,
              timestamp: timeStr,
              playerHand: detectedPlayerHand,
              cpuHand: generatedCpuHand,
              result: gameResult,
            },
            ...prevHistory.slice(0, 19),
          ]);

          // 5. RESULT ステージへの遷移 (t = 2500ms)
          const t4 = window.setTimeout(() => {
            setStage('RESULT');

            // 勝敗結果に応じたサウンドおよびエフェクトの発動
            if (gameResult === 'WIN') {
              soundService.playWinSound();
              void confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            } else if (gameResult === 'LOSE') {
              soundService.playLoseSound();
            } else {
              soundService.playDrawSound();
            }

            // 6. IDLE ステージへの自動リセット (t = 5500ms)
            const t5 = window.setTimeout(() => {
              setStage('IDLE');
            }, 3000);
            timersRef.current.push(t5);
          }, 300);
          timersRef.current.push(t4);
        }, 600);
        timersRef.current.push(t3);
      }, 800);
      timersRef.current.push(t2);
    }, 800);
    timersRef.current.push(t1);
  }, [clearAllTimers, stage]);

  return {
    stage,
    playerHand,
    cpuHand,
    result,
    stats,
    history,
    startGame,
    resetStats,
  };
}
