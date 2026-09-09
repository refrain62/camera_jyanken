/**
 * メインアプリケーションコンポーネント (AI リアルタイムじゃんけん BATTLE)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { WebcamCanvas } from './components/WebcamCanvas';
import { CpuHandDisplay } from './components/CpuHandDisplay';
import { GameControl } from './components/GameControl';
import { ResultCard } from './components/ResultCard';
import { StatsPanel } from './components/StatsPanel';

import { useWebcam } from './hooks/useWebcam';
import { useJankenGame } from './hooks/useJankenGame';
import { handDetectorService } from './services/handDetector';
import { AnalyzedHand, HandGesture } from './types/janken';

export const App: React.FC = () => {
  const [isDetectorReady, setIsDetectorReady] = useState<boolean>(false);
  const [currentHandGesture, setCurrentHandGesture] = useState<HandGesture>('UNKNOWN');

  // 最新解析ジェスチャーをタイマーコールバックで即座に参照するための ref
  const latestGestureRef = useRef<HandGesture>('UNKNOWN');

  const { videoRef, isCameraActive, error, startCamera } = useWebcam();
  const { stage, playerHand, cpuHand, result, stats, history, startGame, resetStats } = useJankenGame();

  // MediaPipe AIモデルの非同期初期化
  useEffect(() => {
    let isMounted = true;
    void handDetectorService.initialize().then((ready) => {
      if (isMounted) {
        setIsDetectorReady(ready);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Webカメラ映像フレーム解析コールバック
  const handleHandDetected = useCallback((hand: AnalyzedHand) => {
    setCurrentHandGesture(hand.gesture);
    latestGestureRef.current = hand.gesture;
  }, []);

  // ゲームスタートボタンハンドラ
  const handleStartGame = useCallback(() => {
    startGame(() => latestGestureRef.current);
  }, [startGame]);

  // キーボード (Spaceキー) によるゲームスタート・リトライハンドラ
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // フォーム入力中などでない場合に Space キーのスクロールを抑制してゲームを開始する
      if (event.code === 'Space' && isCameraActive && isDetectorReady) {
        const activeElem = document.activeElement;
        const isInputActive =
          activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA');

        if (!isInputActive) {
          event.preventDefault();
          handleStartGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleStartGame, isCameraActive, isDetectorReady]);

  // カメラ起動処理
  const handleStartCamera = () => {
    void startCamera();
  };

  return (
    <div className="app-container">
      {/* ヘッダーバー */}
      <Header
        isDetectorReady={isDetectorReady}
        isCameraActive={isCameraActive}
        onResetStats={resetStats}
      />

      {error && (
        <div className="status-badge inactive" style={{ padding: '1rem', width: '100%', justifyContent: 'center' }}>
          <span>{error}</span>
        </div>
      )}

      {/* メインレイアウト */}
      <main className="main-content">
        <div className="game-stage-area">
          <div className="stage-card-wrapper">
            {/* プレイヤーカメラ映像 & Canvasオーバーレイ */}
            <WebcamCanvas
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              onHandDetected={handleHandDetected}
              currentGesture={currentHandGesture}
            />

            {/* AI CPUカード表示 (3D女の子アバター搭載) */}
            <CpuHandDisplay stage={stage} cpuHand={cpuHand} result={result} />
          </div>

          {/* ゲームアクション＆カウントダウンオーバーレイ */}
          <GameControl
            stage={stage}
            isCameraActive={isCameraActive}
            isDetectorReady={isDetectorReady}
            onStartGame={handleStartGame}
            onStartCamera={handleStartCamera}
          />
        </div>

        {/* スコア・成績・対戦履歴ログパネル */}
        <StatsPanel stats={stats} history={history} />
      </main>

      {/* 勝敗判定ポップオーバー */}
      <ResultCard
        result={result}
        playerHand={playerHand}
        cpuHand={cpuHand}
        visible={stage === 'RESULT'}
      />
    </div>
  );
};

export default App;
