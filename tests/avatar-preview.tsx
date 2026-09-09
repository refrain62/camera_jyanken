import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CpuHandDisplay } from '../src/components/CpuHandDisplay';
import { GameStage, HandGesture, GameResult } from '../src/types/janken';
import '../src/styles/globals.css';

// カメラや乱数に依存せず、全ポーズ・表情・狭幅の目視検証を再現する。
export function Preview() {
  const [stage, setStage] = useState<GameStage>('IDLE');
  const [hand, setHand] = useState<HandGesture>('ROCK');
  const [result, setResult] = useState<GameResult>('LOSE');
  const [width, setWidth] = useState(280);
  return <main style={{ padding: 24 }}>
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <label>状態<select value={stage} onChange={(event) => setStage(event.target.value as GameStage)}>{['IDLE', 'COUNTDOWN_JAN', 'COUNTDOWN_KEN', 'COUNTDOWN_PON', 'COUNTDOWN_AIKO', 'COUNTDOWN_SHO', 'JUDGEMENT', 'RESULT'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>手<select value={hand} onChange={(event) => setHand(event.target.value as HandGesture)}>{['ROCK', 'SCISSORS', 'PAPER'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>結果<select value={result} onChange={(event) => setResult(event.target.value as GameResult)}>{['WIN', 'LOSE', 'DRAW'].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>カード幅<select value={width} onChange={(event) => setWidth(Number(event.target.value))}>{[240, 280, 400].map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div style={{ width }}><CpuHandDisplay stage={stage} cpuHand={hand} result={result} /></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Preview /></React.StrictMode>);
