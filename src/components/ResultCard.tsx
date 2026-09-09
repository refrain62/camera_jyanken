/**
 * 勝敗判定結果をカメラ側に表示するコンポーネント
 */

import React from 'react';
import { GameResult, HandGesture } from '../types/janken';
import { Trophy, Frown, Equal, AlertCircle } from 'lucide-react';

interface ResultCardProps {
  result: GameResult | null;
  playerHand: HandGesture;
  cpuHand: HandGesture;
  visible: boolean;
}

const GESTURE_NAME: Record<HandGesture, string> = {
  ROCK: 'グー ✊',
  SCISSORS: 'チョキ ✌️',
  PAPER: 'パー 🖐️',
  UNKNOWN: '未検出 ❓',
};

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  playerHand,
  cpuHand,
  visible,
}) => {
  if (!visible || !result) return null;

  const getResultContent = () => {
    switch (result) {
      case 'WIN':
        return {
          title: 'YOU WIN!',
          subtitle: 'あなたの勝ちです！お見事！',
          icon: <Trophy size={48} className="result-icon win" />,
          cardClass: 'result-win',
        };
      case 'LOSE':
        return {
          title: 'YOU LOSE...',
          subtitle: playerHand === 'UNKNOWN' ? '手が見つかりませんでした！' : 'AIの勝利です。次回リベンジ！',
          icon: playerHand === 'UNKNOWN' ? <AlertCircle size={48} className="result-icon unknown" /> : <Frown size={48} className="result-icon lose" />,
          cardClass: 'result-lose',
        };
      case 'DRAW':
        return {
          title: 'DRAW',
          subtitle: 'あいこで...！引き分けです。',
          icon: <Equal size={48} className="result-icon draw" />,
          cardClass: 'result-draw',
        };
    }
  };

  const content = getResultContent();

  return (
    <section className={`result-card ${content.cardClass}`} aria-live="polite">
      <div className="result-header">
        {content.icon}
        <h2 className="result-title">{content.title}</h2>
        <p className="result-subtitle">{content.subtitle}</p>
      </div>

      <div className="result-details">
        <div className="detail-item">
          <span className="detail-label">あなたの手</span>
          <span className="detail-value">{GESTURE_NAME[playerHand]}</span>
        </div>

        <div className="detail-vs">VS</div>

        <div className="detail-item">
          <span className="detail-label">AIの手</span>
          <span className="detail-value">{GESTURE_NAME[cpuHand]}</span>
        </div>
      </div>
    </section>
  );
};
