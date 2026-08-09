/**
 * Webカメラ映像描画および MediaPipe ランドマーク Canvas オーバーレイコンポーネント
 */

import React, { useEffect, useRef } from 'react';
import { handDetectorService } from '../services/handDetector';
import { AnalyzedHand, HandGesture } from '../types/janken';

interface WebcamCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  onHandDetected: (hand: AnalyzedHand) => void;
  currentGesture: HandGesture;
}

/**
 * 手の21個の骨格接続ペアインデックス定義
 */
const HAND_CONNECTIONS = [
  // 親指
  [0, 1], [1, 2], [2, 3], [3, 4],
  // 人差し指
  [0, 5], [5, 6], [6, 7], [7, 8],
  // 中指
  [9, 10], [10, 11], [11, 12],
  // 薬指
  [13, 14], [14, 15], [15, 16],
  // 小指
  [17, 18], [18, 19], [19, 20],
  // 掌基部・MCP接続
  [5, 9], [9, 13], [13, 17], [0, 17]
];

export const WebcamCanvas: React.FC<WebcamCanvasProps> = ({
  videoRef,
  isCameraActive,
  onHandDetected,
  currentGesture,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = -1;

    const renderLoop = (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        // Canvas解像度をVideo解像度に同期設定
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (timestamp !== lastTime) {
            lastTime = timestamp;
            // MediaPipe リアルタイム検出の実行
            const analyzed = handDetectorService.detect(video, timestamp);
            onHandDetected(analyzed);

            // ランドマーク描画
            if (analyzed.landmarks && analyzed.landmarks.length > 0) {
              const width = canvas.width;
              const height = canvas.height;

              // 1. 骨格線の描画 (ネオンシアングラデーション)
              ctx.lineWidth = 4;
              ctx.strokeStyle = '#00f3ff';
              ctx.shadowColor = '#00f3ff';
              ctx.shadowBlur = 10;

              HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
                const p1 = analyzed.landmarks[startIdx];
                const p2 = analyzed.landmarks[endIdx];

                ctx.beginPath();
                ctx.moveTo(p1.x * width, p1.y * height);
                ctx.lineTo(p2.x * width, p2.y * height);
                ctx.stroke();
              });

              // 2. 関節ノード (ランドマーク点) の描画
              analyzed.landmarks.forEach((lm, idx) => {
                ctx.beginPath();
                ctx.arc(lm.x * width, lm.y * height, idx % 4 === 0 ? 7 : 5, 0, 2 * Math.PI);

                if (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20) {
                  // 指先 (Tip) ノード: マゼンタネオン
                  ctx.fillStyle = '#ff007f';
                  ctx.shadowColor = '#ff007f';
                } else {
                  // 関節ノード: アクアホワイト
                  ctx.fillStyle = '#ffffff';
                  ctx.shadowColor = '#00f3ff';
                }
                ctx.shadowBlur = 12;
                ctx.fill();
              });
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    if (isCameraActive) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, onHandDetected, videoRef]);

  /**
   * 手のジェスチャーに応じたアイコン・日本語表示マッピング
   */
  const getGestureLabel = (g: HandGesture): { label: string; icon: string; styleClass: string } => {
    switch (g) {
      case 'ROCK':
        return { label: 'グー (ROCK)', icon: '✊', styleClass: 'gesture-rock' };
      case 'SCISSORS':
        return { label: 'チョキ (SCISSORS)', icon: '✌️', styleClass: 'gesture-scissors' };
      case 'PAPER':
        return { label: 'パー (PAPER)', icon: '🖐️', styleClass: 'gesture-paper' };
      default:
        return { label: '手をカメラにかざしてください', icon: '❓', styleClass: 'gesture-unknown' };
    }
  };

  const gestureInfo = getGestureLabel(currentGesture);

  return (
    <div className="webcam-canvas-container">
      {/* カメラ映像ソース */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`webcam-video ${isCameraActive ? 'visible' : 'hidden'}`}
      />

      {/* MediaPipe スケルトン描画オーバーレイ */}
      <canvas
        ref={canvasRef}
        className={`webcam-overlay ${isCameraActive ? 'visible' : 'hidden'}`}
      />

      {!isCameraActive && (
        <div className="webcam-placeholder">
          <p>カメラがOFFになっています。「ゲームスタート」または「カメラ起動」ボタンを押してください。</p>
        </div>
      )}

      {/* リアルタイム手認識バッジ */}
      {isCameraActive && (
        <div className={`gesture-badge ${gestureInfo.styleClass}`}>
          <span className="gesture-icon">{gestureInfo.icon}</span>
          <span className="gesture-text">{gestureInfo.label}</span>
        </div>
      )}
    </div>
  );
};
