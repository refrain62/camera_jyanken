/**
 * Webカメラのデバイスストリーム取得およびパーミッション管理カスタムフック
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

/**
 * Webカメラ映像ストリームを取得・停止するカスタムフック
 * 解像度要件: 1280x720 (アスペクト比 16:9), フレームレート: 30fps
 * 
 * @returns カメラの参照オブジェクト、起動フラグ、エラー文字列、操作関数
 */
export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * カメラのストリームを開始する関数
   */
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('お使いのブラウザはWebカメラの取得 API (getUserMedia) に対応していません。');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'カメラのアクセス許可が得られませんでした。';
      setError(message);
      setIsCameraActive(false);
    }
  }, []);

  /**
   * カメラのストリームを停止する関数
   */
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  // コンポーネントアンマウント時にカメラリソースを解放する
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isCameraActive,
    error,
    startCamera,
    stopCamera,
  };
}
