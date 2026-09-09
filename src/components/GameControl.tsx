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
      case 'COUNTDOWN_AIKO':
        return 'あいこで…';
      case 'COUNTDOWN_SHO':
        return 'しょ！';
      case 'JUDGEMENT':
        return '判定中...';
      default:
        return null;
    }
  };

  const countdownText = getCountdownText();

  return (
    <div className="game-control-container">
      {/* アバターを隠さないカウントダウンバッジ */}
      {countdownText && (
        <div className="countdown-overlay">
          <div className={`countdown-text pulse-${stage.toLowerCase()}`}>
            {countdownText}
          </div>
        </div>
      )}

      <div className="control-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
        {!isCameraActive ? (
          <button
            className="btn-primary btn-camera"
            onClick={onStartCamera}
          >
            <Camera size={24} />
            <span>カメラを起動する</span>
          </button>
        ) : (
          <>
            <button
              className="btn-primary btn-play"
              onClick={onStartGame}
              disabled={isPlaying || !isDetectorReady}
            >
              <Play size={24} />
              <span>{isPlaying ? 'じゃんけん中...' : 'じゃんけんスタート！'}</span>
            </button>
            <div
              className="keyboard-shortcut-badge"
              style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                justifyContent: 'center',
                marginTop: '0.2rem',
              }}
            >
              <kbd
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                Space
              </kbd>
              <span>キーでスタート / リトライ</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
