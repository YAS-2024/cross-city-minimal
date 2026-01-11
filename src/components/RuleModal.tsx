// src/components/RuleModal.tsx
import React from 'react';
import './RuleModal.css';

type RuleModalProps = {
  show: boolean;
  onClose: () => void;
};

export const RuleModal: React.FC<RuleModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ゲームルール概要</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <section>
            <h3>🏗 ゲーム概要</h3>
            <p>対戦型の街づくりカードゲームです。<br/>
            プレイヤーは互いに「役場」から施設を建設して街を発展させます。<br/>
            建設可能な場所は、場にある自分のカードの「発展可能方向（矢印）」に限定されます。<br/>
            山札が尽きた後、最終的なスコアが高い方が勝ちとなります。</p>
          </section>

          <section>
            <h3>📊 勝利条件（スコア）</h3>
            <p><strong>「居住可能人口」</strong>と<strong>「インフラ（都市機能）」</strong>の2つの数値のうち、<br/>
            <span className="highlight-text">低い方の値</span>が最終スコアになります。<br/>
            バランス良く発展させる必要があります。</p>
          </section>

          <section>
            <h3>🔄 ターンの流れ</h3>
            <ol>
              <li><strong>ドロー:</strong> 山札からカードを1枚引きます。</li>
              <li><strong>税収の確保:</strong> 自分の場の建物から出る「税収」を合計し、予算とします。<br/>
                <small>※予算はターン終了時に消滅します（使い切り）。</small></li>
              <li><strong>臨時予算:</strong> 手札を捨てると「1枚につき2予算」加算できます。</li>
              <li><strong>建設:</strong> 予算を消費してカードを配置します。<br/>
              配置は自分のカードの「矢印」が向いている隣接マスのみ可能です。</li>
            </ol>
          </section>
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
};