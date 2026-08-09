/**
 * じゃんけんゲーム制御ボタンおよび「じゃん」「けん」「ぽん！」カウントダウン大文字演出コンポーネント
 */

import React from 'react';
import { GameStage } from '../types/janken';
import { Play, Camera } from 'lucide-react';

interface GameControlProps {
  stage: GameStage;
  isCameraActive: boolean;
  isDetectorReady: boolean;
  onStartGame: () => void;
  onStartCamera: () => void;
}

export const GameControl: React.FC<GameControlProps> = ({
  stage,
  isCameraActive,
  isDetectorReady,
  onStartGame,
  onStartCamera,
}) => {
  const isPlaying = stage !== 'IDLE';

  /**
   * カウントダウン時の表示文字列を取得する
   */
  const getCountdownText = (): string | null => {
    switch (stage) {
      case 'COUNTDOWN_JAN':
        return 'じゃん';
      case 'COUNTDOWN_KEN':
        return 'けん';
      case 'COUNTDOWN_PON':
        return 'ぽん！';
      case 'JUDGEMENT':
        return '判定中...';
      default:
        return null;
    }
  };

  const countdownText = getCountdownText();

  return (
    <div className="game-control-container">
      {/* カウントダウン巨大文字オーバーレイ */}
      {countdownText && (
        <div className="countdown-overlay">
          <div className={`countdown-text pulse-${stage.toLowerCase()}`}>
            {countdownText}
          </div>
        </div>
      )}

      <div className="control-actions">
        {!isCameraActive ? (
          <button
            className="btn-primary btn-camera"
            onClick={onStartCamera}
          >
            <Camera size={24} />
            <span>カメラを起動する</span>
          </button>
        ) : (
          <button
            className="btn-primary btn-play"
            onClick={onStartGame}
            disabled={isPlaying || !isDetectorReady}
          >
            <Play size={24} />
            <span>{isPlaying ? 'じゃんけん中...' : 'じゃんけんスタート！'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
