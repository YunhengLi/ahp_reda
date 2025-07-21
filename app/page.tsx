'use client';

import { useState } from 'react';
import * as math from 'mathjs';

export default function Home() {
  const criteria = [
    '成熟度评估', '市场竞争力', '创新价值', '市场潜力',
    '毛利率稳定性', '现金流稳定性', '成长潜力', '项目内利率',
    '合同保障性', '执行可行性', '合规性保障性', '风险防范性'
  ];

  const size = criteria.length;
  const totalSteps = (size * (size - 1)) / 2;
  const [matrix, setMatrix] = useState(Array(size).fill(0).map(() => Array(size).fill(1)));
  const [history, setHistory] = useState<{ i: number, j: number, value: number }[]>([]);
  const [currentPair, setCurrentPair] = useState({ i: 0, j: 1 });
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<any>(null);

  const nextPair = (i: number, j: number) => {
    if (j < size - 1) return { i, j: j + 1 };
    if (i < size - 2) return { i: i + 1, j: i + 2 };
    return null; // 已经完成
  };

  const handleSelect = (value: number) => {
    const newMatrix = [...matrix];
    newMatrix[currentPair.i][currentPair.j] = value;
    newMatrix[currentPair.j][currentPair.i] = 1 / value;
    setMatrix(newMatrix);

    setHistory([...history, { i: currentPair.i, j: currentPair.j, value }]);

    const next = nextPair(currentPair.i, currentPair.j);
    if (next) {
      setCurrentPair(next);
      setStep(step + 1);
    } else {
      calculateWeights(newMatrix);
    }
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const newMatrix = [...matrix];
    newMatrix[last.i][last.j] = 1;
    newMatrix[last.j][last.i] = 1;
    setMatrix(newMatrix);

    setHistory(history.slice(0, -1));
    setCurrentPair({ i: last.i, j: last.j });
    setStep(step - 1);
    setResult(null);
  };

  const calculateWeights = (judgmentMatrix: number[][]) => {
    const eig = math.eigs(judgmentMatrix);
    let weights = eig.vectors[0];
    const maxEig = eig.values[0];
    const CI = (maxEig - size) / (size - 1);
    const RI = size <= 10 ? [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][size - 1] : 1.49;
    const CR = CI / RI;

    if (CR >= 0.1) {
      const geomMeans = judgmentMatrix.map(row =>
        Math.pow(row.reduce((a, b) => a * b), 1 / size)
      );
      const total = geomMeans.reduce((a, b) => a + b, 0);
      weights = geomMeans.map(g => g / total);
    } else {
      weights = weights.map((w: number) => w / weights.reduce((a: number, b: number) => a + b));
    }

    setResult({
      weights: weights.map((w: number) => (w * 100).toFixed(2)),
      CR: CR.toFixed(3),
      optimized: CR >= 0.1
    });
  };

  return (
    <div style={{ width: '90%', maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>AHP 权重计算系统</h1>

      {result ? (
        <div>
          <h2>权重结果</h2>
          <ul style={{ textAlign: 'left', margin: '0 auto', maxWidth: '600px' }}>
            {criteria.map((c, i) => (
              <li key={i}>{c}: {result.weights[i]}%</li>
            ))}
          </ul>
          {result.optimized && <p style={{ color: 'orange', marginTop: '10px' }}>⚠️ 系统已自动优化您的输入以保证一致性</p>}
          <p style={{ marginTop: '10px' }}>一致性比例 (CR): {result.CR}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '15px', padding: '10px 20px' }}>重新开始</button>
        </div>
      ) : (
        <div>
          <h2>第 {step} 步: 比较</h2>
          <p style={{ fontSize: '1.2rem', margin: '10px 0' }}>
            <b>{criteria[currentPair.i]}</b> vs <b>{criteria[currentPair.j]}</b>
          </p>
          <select onChange={(e) => handleSelect(Number(e.target.value))} defaultValue="" style={{ fontSize: '1rem', padding: '8px 12px' }}>
            <option value="" disabled>选择重要性等级</option>
            <option value={1}>同等重要</option>
            <option value={3}>稍微重要</option>
            <option value={5}>较强重要</option>
            <option value={7}>强烈重要</option>
            <option value={9}>极端重要</option>
          </select>
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleBack} disabled={history.length === 0} style={{ marginTop: '10px', padding: '8px 15px' }}>
              返回上一步
            </button>
          </div>

          <div style={{ marginTop: '20px', height: '20px', background: '#eee', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${(step / totalSteps) * 100}%`,
              height: '100%',
              background: '#4cafef'
            }} />
          </div>
          <p>{step} / {totalSteps} 步</p>
        </div>
      )}
    </div>
  );
}
