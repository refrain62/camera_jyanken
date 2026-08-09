/**
 * MediaPipe Tasks Vision HandLandmarker の初期化・フレーム毎推論管理サービス
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { AnalyzedHand } from '../types/janken';
import { analyzeHandGesture } from './gestureAnalyzer';

export class HandDetectorService {
  private static instance: HandDetectorService | null = null;
  private landmarker: HandLandmarker | null = null;
  private isLoading: boolean = false;
  private isReady: boolean = false;

  private constructor() {}

  /**
   * シングルトンインスタンスの取得
   */
  public static getInstance(): HandDetectorService {
    if (!HandDetectorService.instance) {
      HandDetectorService.instance = new HandDetectorService();
    }
    return HandDetectorService.instance;
  }

  /**
   * HandLandmarker モジュールの非同期初期化
   * WASM ファイルおよびモデルバイナリのロードを行う
   * 
   * @returns 初期化成功時に true、失敗時に false を返却する Promise
   */
  public async initialize(): Promise<boolean> {
    if (this.isReady && this.landmarker) {
      return true;
    }
    if (this.isLoading) {
      // ロード中の場合は準備完了まで100ms周期でポーリング待機する
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.isReady;
    }

    this.isLoading = true;
    try {
      // WASMバイナリローダーの準備
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // HandLandmarker インスタンスの作成 (GPU/CPUオートモード)
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('HandLandmarker initialization failed:', error);
      this.isLoading = false;
      this.isReady = false;
      return false;
    }
  }

  /**
   * HTMLVideoElement の現在フレームに対する手のランドマーク検出とジェスチャー解析
   * 
   * @param videoElement 入力カメラ映像ソース
   * @param timestampMs 経過タイムスタンプ (ミリ秒)
   * @returns 解析結果 (AnalyzedHand)
   */
  public detect(videoElement: HTMLVideoElement, timestampMs: number): AnalyzedHand {
    if (!this.landmarker || !this.isReady) {
      return {
        gesture: 'UNKNOWN',
        confidence: 0,
        fingerStates: [],
        landmarks: [],
      };
    }

    try {
      const results = this.landmarker.detectForVideo(videoElement, timestampMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const rawLandmarks = results.landmarks[0];
        const score = results.handedness && results.handedness[0] ? results.handedness[0][0].score : 0.9;
        
        const landmarks = rawLandmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        }));

        return analyzeHandGesture(landmarks, score);
      }
    } catch (err) {
      console.warn('Frame detection error:', err);
    }

    return {
      gesture: 'UNKNOWN',
      confidence: 0,
      fingerStates: [],
      landmarks: [],
    };
  }

  /**
   * 検出器の初期化完了状態フラグの取得
   */
  public getIsReady(): boolean {
    return this.isReady;
  }
}

export const handDetectorService = HandDetectorService.getInstance();
