/**
 * CPUの手の表示およびカウントダウン時のシャッフルアニメーションコンポーネント
 */

import React, { useEffect, useState } from 'react';
import { GameResult, GameStage, HandGesture } from '../types/janken';
import { Sparkles } from 'lucide-react';
import { GirlAvatar3D } from './GirlAvatar3D';

interface CpuHandDisplayProps {
  stage: GameStage;
  cpuHand: HandGesture;
  result: GameResult | null;
}

const HAND_MAP: Record<HandGesture, { icon: string; name: string }> = {
  ROCK: { icon: '✊', name: 'グー' },
  SCISSORS: { icon: '✌️', name: 'チョキ' },
  PAPER: { icon: '🖐️', name: 'パー' },
  UNKNOWN: { icon: '❓', name: '待機中' },
};

export const CpuHandDisplay: React.FC<CpuHandDisplayProps> = ({ stage, cpuHand, result }) => {
  const [shuffleHand, setShuffleHand] = useState<HandGesture>('ROCK');

  // カウントダウン中 (JAN, KEN, PON, AIKO, SHO) は 100ms 間隔で表示バッジの手をシャッフルさせる
  useEffect(() => {
    let intervalId: number | null = null;

    const isCountdown =
      stage === 'COUNTDOWN_JAN' ||
      stage === 'COUNTDOWN_KEN' ||
      stage === 'COUNTDOWN_PON' ||
      stage === 'COUNTDOWN_AIKO' ||
      stage === 'COUNTDOWN_SHO';

    if (isCountdown) {
      const hands: HandGesture[] = ['ROCK', 'SCISSORS', 'PAPER'];
      let idx = 0;
      intervalId = window.setInterval(() => {
        idx = (idx + 1) % hands.length;
        setShuffleHand(hands[idx]);
      }, 100);
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [stage]);

  const isCountdown =
    stage === 'COUNTDOWN_JAN' ||
    stage === 'COUNTDOWN_KEN' ||
    stage === 'COUNTDOWN_PON' ||
    stage === 'COUNTDOWN_AIKO' ||
    stage === 'COUNTDOWN_SHO';

  const displayHand = isCountdown ? shuffleHand : stage === 'IDLE' ? 'UNKNOWN' : cpuHand;
  const currentInfo = HAND_MAP[displayHand];

  return (
    <div className="cpu-hand-card">
      <div className="cpu-header">
        <Sparkles size={22} className="cpu-icon" style={{ color: '#39c5bb' }} />
        <span className="cpu-title">女の子 AI (CPU)</span>
      </div>

      {/* 女の子の 3D アバター描画領域 */}
      <GirlAvatar3D stage={stage} cpuHand={cpuHand} result={result} />

      {/* 手のバッジ表示 */}
      <div className={`cpu-display-area ${stage === 'RESULT' ? 'revealed' : ''}`}>
        <span className="cpu-hand-emoji">{currentInfo.icon}</span>
        <span className="cpu-hand-name">{currentInfo.name}</span>
      </div>
    </div>
  );
};
