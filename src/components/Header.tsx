/**
 * アプリケーションヘッダーコンポーネント
 */

import React from 'react';
import { Camera, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isDetectorReady: boolean;
  isCameraActive: boolean;
  onResetStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDetectorReady,
  isCameraActive,
  onResetStats,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Sparkles className="icon-sparkle" size={28} />
        </div>
        <div>
          <h1 className="brand-title">AI REALTIME JANKEN BATTLE</h1>
          <p className="brand-subtitle">WEBカメラ画像認識 vs AI 対戦システム</p>
        </div>
      </div>

      <div className="header-status">
        <div className={`status-badge ${isCameraActive ? 'active' : 'inactive'}`}>
          <Camera size={16} />
          <span>{isCameraActive ? 'カメラ動作中 (720p)' : 'カメラ停止中'}</span>
        </div>

        <div className={`status-badge ${isDetectorReady ? 'active' : 'loading'}`}>
          <span className="dot-indicator" />
          <span>{isDetectorReady ? 'MediaPipe AI準備完了' : 'AIモデル読み込み中...'}</span>
        </div>

        <button
          className="btn-reset-stats"
          onClick={onResetStats}
          title="対戦成績をリセット"
        >
          <RefreshCw size={16} />
          <span>成績リセット</span>
        </button>
      </div>
    </header>
  );
};
