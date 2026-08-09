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
   * 判定確定および結果処理（スコア更新・効果音再生・あいこ時連続遷移のセット）を行う共通関数
   * 
   * @param getCurrentPlayerHand 最新の手を取得する関数
   * @param onComplete Judgement完了後のコールバック
   */
  const processJudgement = useCallback(
    (getCurrentPlayerHand: () => HandGesture, onComplete?: (result: GameResult) => void) => {
      setStage('JUDGEMENT');

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

      // 300ms 後に RESULT ステージへ遷移
      const tResult = window.setTimeout(() => {
        setStage('RESULT');

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

        if (onComplete) {
          onComplete(gameResult);
        }
      }, 300);
      timersRef.current.push(tResult);
    },
    []
  );

  /**
   * あいこ（引き分け）発生時の「あいこで…しょ！」カウントダウンサイクルを実行する
   * 
   * @param getCurrentPlayerHand 最新の手を取得する関数
   */
  const startAikoCycle = useCallback(
    (getCurrentPlayerHand: () => HandGesture) => {
      clearAllTimers();
      soundService.ensureAudioContext();

      // 1. COUNTDOWN_AIKO ステージ開始 (t = 0ms)
      setStage('COUNTDOWN_AIKO');
      setPlayerHand('UNKNOWN');
      setResult(null);
      soundService.speakAiko();

      // 2. COUNTDOWN_SHO ステージ遷移 (t = 800ms)
      const tSho = window.setTimeout(() => {
        setStage('COUNTDOWN_SHO');
        soundService.speakSho();

        // 3. JUDGEMENT ステージ遷移 (t = 1400ms)
        const tJudgement = window.setTimeout(() => {
          processJudgement(getCurrentPlayerHand, (gameResult) => {
            if (gameResult === 'DRAW') {
              // 再度あいこの場合は1.2秒後に自動的に「あいこで…しょ！」を繰り返す
              const tNextAiko = window.setTimeout(() => {
                startAikoCycle(getCurrentPlayerHand);
              }, 1200);
              timersRef.current.push(tNextAiko);
            } else {
              // 勝敗が決した場合は 3 秒後に IDLE 状態へ戻る
              const tReset = window.setTimeout(() => {
                setStage('IDLE');
              }, 3000);
              timersRef.current.push(tReset);
            }
          });
        }, 600);
        timersRef.current.push(tJudgement);
      }, 800);
      timersRef.current.push(tSho);
    },
    [clearAllTimers, processJudgement]
  );

  /**
   * じゃんけんゲームシークエンスを開始する関数
   * 
   * @param getCurrentPlayerHand 最新フレームから判定されたプレイヤーの手を取得するクロージャ
   */
  const startGame = useCallback(
    (getCurrentPlayerHand: () => HandGesture) => {
      // カウントダウン進行中でない限り、IDLE または RESULT から即座にゲームを開始可能とする
      if (
        stage === 'COUNTDOWN_JAN' ||
        stage === 'COUNTDOWN_KEN' ||
        stage === 'COUNTDOWN_PON' ||
        stage === 'COUNTDOWN_AIKO' ||
        stage === 'COUNTDOWN_SHO' ||
        stage === 'JUDGEMENT'
      ) {
        return;
      }

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
            processJudgement(getCurrentPlayerHand, (gameResult) => {
              if (gameResult === 'DRAW') {
                // あいこの場合は 1.2秒後に自動的に「あいこで…しょ！」に突入
                const tAiko = window.setTimeout(() => {
                  startAikoCycle(getCurrentPlayerHand);
                }, 1200);
                timersRef.current.push(tAiko);
              } else {
                // 勝敗確定時は 3 秒後に IDLE 状態へ自動リセット
                const tReset = window.setTimeout(() => {
                  setStage('IDLE');
                }, 3000);
                timersRef.current.push(tReset);
              }
            });
          }, 600);
          timersRef.current.push(t3);
        }, 800);
        timersRef.current.push(t2);
      }, 800);
      timersRef.current.push(t1);
    },
    [clearAllTimers, processJudgement, startAikoCycle, stage]
  );

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
