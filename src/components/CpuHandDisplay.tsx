/**
 * CPUの手の表示およびカウントダウン時のシャッフルアニメーションコンポーネント
 */

import React, { useEffect, useState } from 'react';
import { GameStage, HandGesture } from '../types/janken';
import { Bot } from 'lucide-react';

interface CpuHandDisplayProps {
  stage: GameStage;
  cpuHand: HandGesture;
}

const HAND_MAP: Record<HandGesture, { icon: string; name: string }> = {
  ROCK: { icon: '✊', name: 'グー' },
  SCISSORS: { icon: '✌️', name: 'チョキ' },
  PAPER: { icon: '🖐️', name: 'パー' },
  UNKNOWN: { icon: '❓', name: '思考中' },
};

export const CpuHandDisplay: React.FC<CpuHandDisplayProps> = ({ stage, cpuHand }) => {
  const [shuffleHand, setShuffleHand] = useState<HandGesture>('ROCK');

  // カウントダウン中 (JAN, KEN, PON) は 100ms 間隔で手をシャッフルさせる
  useEffect(() => {
    let intervalId: number | null = null;

    if (stage === 'COUNTDOWN_JAN' || stage === 'COUNTDOWN_KEN' || stage === 'COUNTDOWN_PON') {
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

  const displayHand =
    stage === 'COUNTDOWN_JAN' || stage === 'COUNTDOWN_KEN' || stage === 'COUNTDOWN_PON'
      ? shuffleHand
      : stage === 'IDLE'
      ? 'UNKNOWN'
      : cpuHand;

  const currentInfo = HAND_MAP[displayHand];

  return (
    <div className="cpu-hand-card">
      <div className="cpu-header">
        <Bot size={22} className="cpu-icon" />
        <span className="cpu-title">AI (CPU)</span>
      </div>

      <div className={`cpu-display-area ${stage === 'RESULT' ? 'revealed' : ''}`}>
        <span className="cpu-hand-emoji">{currentInfo.icon}</span>
        <span className="cpu-hand-name">{currentInfo.name}</span>
      </div>
    </div>
  );
};
