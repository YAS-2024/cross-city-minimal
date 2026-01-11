import { GameMaster } from './GameMaster';
import type { CardEntity, Position } from '../types';

export class EffectManager {
  private gm: GameMaster;

  constructor(gm: GameMaster) {
    this.gm = gm;
  }

  // 配置時効果 (ON_PLACE) の実行
  executeInstantEffects(playerId: string, card: CardEntity) {
    if (!card.data.effects) return;

    const player = this.gm.players.get(playerId);
    if (!player) return;

    card.data.effects.forEach(effect => {
      if (effect.trigger === 'ON_PLACE') {
        switch (effect.type) {
          case 'DRAW':
            this.gm.drawCard(playerId, effect.value);
            break;
          case 'GET_BUDGET':
            player.addBudget(effect.value);
            break;
        }
      }
    });
  }

  // バフ適用後のステータスを取得 (PASSIVE効果の計算)
  getEffectiveStats(card: CardEntity, pos: Position) {
    const currentStats = { ...card.data.stats };
    const allCards = this.gm.board.getAllCards();

    allCards.forEach(other => {
      if (other.card.ownerId !== card.ownerId) return;
      if (!other.card.data.effects) return;

      other.card.data.effects.forEach(effect => {
        if (effect.trigger === 'PASSIVE') {
          if (effect.type === 'BUFF_ADJACENT') {
            if (this.isAdjacent(pos, other.pos)) {
              this.applyBuff(currentStats, effect, card);
            }
          }
          else if (effect.type === 'BUFF_GLOBAL') {
             this.applyBuff(currentStats, effect, card);
          }
        }
      });
    });

    return currentStats;
  }

  // ★追加: 収入計算（GameMasterから移動）
  calculateIncome(playerId: string): number {
    let income = 0;
    this.gm.board.getAllCards().forEach(({ card, pos }) => {
      if (card.ownerId === playerId) {
        const effectiveStats = this.getEffectiveStats(card, pos);
        income += effectiveStats.tax;
      }
    });
    return income;
  }

  // ★追加: プレイヤーの現在の統計値（人口・インフラ）を計算
  calculateStats(playerId: string): { population: number, infrastructure: number } {
    let totalP1 = 0; 
    let totalP2 = 0;
    
    this.gm.board.getAllCards().forEach(({ card, pos }) => {
      if (card.ownerId === playerId) {
        const effectiveStats = this.getEffectiveStats(card, pos);
        totalP1 += effectiveStats.p1;
        totalP2 += effectiveStats.p2;
      }
    });

    return { population: totalP1, infrastructure: totalP2 };
  }

  // エンドゲーム効果による加点
  calculateEndGameBonus(playerId: string): number {
    let bonus = 0;
    const allCards = this.gm.board.getAllCards();
    
    allCards.forEach(({ card }) => {
      if (card.ownerId !== playerId) return;
      if (!card.data.effects) return;

      card.data.effects.forEach(effect => {
        if (effect.trigger === 'END_GAME') {
          if (effect.type === 'BUFF_GLOBAL' && effect.targetCategory) {
            const targetCount = allCards.filter(c => 
              c.card.ownerId === playerId && c.card.data.category === effect.targetCategory
            ).length;
            bonus += targetCount * effect.value;
          }
        }
      });
    });
    return bonus;
  }

  // --- ヘルパー ---

  private applyBuff(stats: { p1: number, p2: number, tax: number }, effect: any, targetCard: CardEntity) {
    if (effect.targetCategory && targetCard.data.category !== effect.targetCategory) {
      return;
    }
    stats.p1 += effect.value;
  }

  private isAdjacent(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx + dy === 1);
  }
}