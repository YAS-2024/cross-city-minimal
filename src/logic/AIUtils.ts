import { GameMaster } from './GameMaster';
import type { Position } from '../types';

interface MoveCandidate {
  cardInstanceId: string;
  pos: Position;
}

export class AIUtils {
  /**
   * ランダムな合法手を返す
   * 置ける場所がなければ null を返す（パス/捨て札扱い）
   */
  static getRandomMove(gm: GameMaster, playerId: string): MoveCandidate | null {
    const player = gm.players.get(playerId);
    if (!player) return null;

    const hand = player.getHand();
    const budget = player.getBudget();
    const validMoves: MoveCandidate[] = [];

    // 1. 探索範囲の決定
    // 盤面にあるカードの周囲1マスを探索候補とする
    // （盤面が空の場合は(0,0)などを候補にするが、今回は初期配置がある前提）
    const placedCards = gm.board.getAllCards();
    const candidatePositions = new Set<string>();

    // 既に置かれているカードの上下左右の空きマスを候補に追加
    placedCards.forEach(({ pos }) => {
      const neighbors = [
        { x: pos.x, y: pos.y - 1 },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x + 1, y: pos.y }
      ];
      neighbors.forEach(nPos => {
        if (gm.board.isEmpty(nPos)) {
          candidatePositions.add(`${nPos.x},${nPos.y}`);
        }
      });
    });

    // 2. 総当たりチェック
    // 「全ての手札」×「全ての候補地」で置けるか試す
    hand.forEach(card => {
      // そもそもコストが足りないカードはスキップ
      if (card.data.cost > budget) return;

      candidatePositions.forEach(posStr => {
        const [x, y] = posStr.split(',').map(Number);
        const pos = { x, y };

        // GameMasterのルールエンジンを使って判定
        // ※ canPlaceCardは副作用がない（判定するだけ）ので何度呼んでもOK
        const check = gm.ruleEngine.canPlaceCard(playerId, pos, budget, card.data.cost);
        
        if (check.valid) {
          validMoves.push({
            cardInstanceId: card.instanceId,
            pos: pos
          });
        }
      });
    });

    // 3. ランダムに選択
    if (validMoves.length === 0) {
      return null; // 置ける場所がない
    }

    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
}