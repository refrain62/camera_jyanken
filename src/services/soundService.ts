/**
 * Web Speech API および AudioContext を使用した効果音・音声再生管理サービス
 */

class SoundService {
  private audioCtx: AudioContext | null = null;
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis || null;
    }
  }

  /**
   * AudioContextの初期化および再開処理を行う
   * ブラウザの自動再生ポリシーに対応するため、ユーザー操作（ボタンクリック等）時に発火させる
   */
  public ensureAudioContext(): void {
    if (typeof window === 'undefined') return;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
  }

  /**
   * 指定した周波数・波形・再生時間でビープ音を再生する
   * 
   * @param freq 周波数 (Hz, 例: 440, 880, 1760)
   * @param duration 再生時間 (秒, 例: 0.15)
   * @param type オシレータ波形種別 ('sine' | 'square' | 'triangle' | 'sawtooth')
   */
  public playBeep(freq: number, duration: number = 0.15, type: OscillatorType = 'sine'): void {
    this.ensureAudioContext();
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  /**
   * テキスト文字列を Web Speech API にて日本語音声発声する
   * 
   * @param text 発声するテキスト ('じゃん' | 'けん' | 'ぽん！')
   * @param pitch 音の高さ (0.5 〜 2.0, デフォルト: 1.1)
   * @param rate 発声速度 (0.5 〜 2.0, デフォルト: 1.25)
   */
  public speakText(text: string, pitch: number = 1.1, rate: number = 1.25): void {
    if (!this.synth) return;

    // 現在発声中の音声キューをキャンセルして即座に発声を開始する
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = 1.0;

    this.synth.speak(utterance);
  }

  /**
   * 「じゃん」の発声およびカウントダウン第1音 (440Hz) の再生
   */
  public speakJan(): void {
    this.playBeep(440, 0.2, 'sine');
    this.speakText('じゃん', 1.0, 1.3);
  }

  /**
   * 「けん」の発声およびカウントダウン第2音 (587.33Hz) の再生
   */
  public speakKen(): void {
    this.playBeep(587.33, 0.2, 'sine');
    this.speakText('けん', 1.1, 1.3);
  }

  /**
   * 「ぽん！」の発声およびカウントダウン決定音 (880Hz) の再生
   */
  public speakPon(): void {
    this.playBeep(880, 0.3, 'triangle');
    this.speakText('ぽん！', 1.2, 1.4);
  }

  /**
   * 勝利ファンファーレ効果音の再生 (C5-E5-G5-C6 アルペジオ)
   */
  public playWinSound(): void {
    this.ensureAudioContext();
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.2, 'triangle');
      }, idx * 100);
    });
  }

  /**
   * 敗北効果音の再生 (G4-F4-E4-D4 下降トーン)
   */
  public playLoseSound(): void {
    this.ensureAudioContext();
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;

    const notes = [392.00, 349.23, 329.63, 293.66]; // G4, F4, E4, D4
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.25, 'sawtooth');
      }, idx * 120);
    });
  }

  /**
   * 引き分け効果音の再生 (440Hz ダブルトーン)
   */
  public playDrawSound(): void {
    this.playBeep(440, 0.15, 'sine');
    setTimeout(() => {
      this.playBeep(440, 0.15, 'sine');
    }, 180);
  }
}

export const soundService = new SoundService();
