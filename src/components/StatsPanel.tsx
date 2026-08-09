/**
 * スコア統計・勝率・連勝記録および対戦履歴ログコンポーネント
 */

import React from 'react';
import { GameStats, HistoryRecord } from '../types/janken';
import { Award, Flame, History, BarChart3 } from 'lucide-react';

interface StatsPanelProps {
  stats: GameStats;
  history: HistoryRecord[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, history }) => {
  // 勝率の算出 (totalGames > 0 の場合に小数点第1位まで計算)
  const winRate =
    stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) : '0.0';

  const getResultBadgeClass = (res: string) => {
    switch (res) {
      case 'WIN':
        return 'badge-win';
      case 'LOSE':
        return 'badge-lose';
      default:
        return 'badge-draw';
    }
  };

  const getHandEmoji = (hand: string) => {
    switch (hand) {
      case 'ROCK':
        return '✊';
      case 'SCISSORS':
        return '✌️';
      case 'PAPER':
        return '🖐️';
      default:
        return '❓';
    }
  };

  return (
    <aside className="stats-panel">
      <div className="panel-section">
        <h3 className="section-title">
          <BarChart3 size={18} />
          <span>対戦成績・統計</span>
        </h3>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.totalGames}</span>
            <span className="stat-label">総対戦数</span>
          </div>

          <div className="stat-card highlight-win">
            <span className="stat-value">{stats.wins}</span>
            <span className="stat-label">勝利 (Win)</span>
          </div>

          <div className="stat-card highlight-lose">
            <span className="stat-value">{stats.losses}</span>
            <span className="stat-label">敗北 (Lose)</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">{stats.draws}</span>
            <span className="stat-label">引分 (Draw)</span>
          </div>
        </div>

        <div className="stats-extra font-mono">
          <div className="extra-row">
            <span className="extra-label">勝率</span>
            <span className="extra-value">{winRate}%</span>
          </div>
          <div className="extra-row">
            <span className="extra-label">
              <Flame size={16} className="icon-fire" />
              <span>現在連勝数</span>
            </span>
            <span className="extra-value text-orange">{stats.currentStreak}連勝</span>
          </div>
          <div className="extra-row">
            <span className="extra-label">
              <Award size={16} className="icon-award" />
              <span>最高連勝数</span>
            </span>
            <span className="extra-value text-gold">{stats.maxStreak}連勝</span>
          </div>
        </div>
      </div>

      <div className="panel-section history-section">
        <h3 className="section-title">
          <History size={18} />
          <span>対戦履歴 (直近20戦)</span>
        </h3>

        <div className="history-list">
          {history.length === 0 ? (
            <p className="history-empty">まだ対戦履歴はありません</p>
          ) : (
            history.map((rec) => (
              <div key={rec.id} className="history-item">
                <span className="history-time">{rec.timestamp}</span>
                <div className="history-hands">
                  <span>YOU: {getHandEmoji(rec.playerHand)}</span>
                  <span className="vs-divider">vs</span>
                  <span>AI: {getHandEmoji(rec.cpuHand)}</span>
                </div>
                <span className={`history-result-badge ${getResultBadgeClass(rec.result)}`}>
                  {rec.result}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
