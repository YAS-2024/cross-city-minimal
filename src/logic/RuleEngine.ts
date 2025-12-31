import { BoardModel } from '../models/BoardModel';
import type { Position, Direction } from '../types';

export class RuleEngine {
  private board: BoardModel;

  constructor(board: BoardModel) {
    this.board = board;
  }

  canPlaceCard(
    playerId: string,
    pos: Position,
    currentBudget: number,
    cardCost: number
  ): { valid: boolean; reason?: string } {
    
    if (!this.board.isEmpty(pos)) {
      return { valid: false, reason: '既にカードがあります' };
    }

    if (currentBudget < cardCost) {
      return { valid: false, reason: '予算が足りません' };
    }

    // 初手役場など、自分のカードが1枚もない場合の特例処理が必要ならここに追加
    // (今回は初期配置済み前提なのでスキップ)

    // 接続判定
    if (!this.hasValidConnection(pos, playerId)) {
      return { valid: false, reason: '自分のカードの矢印がつながっていません' };
    }

    return { valid: true };
  }

  private hasValidConnection(targetPos: Position, playerId: string): boolean {
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    // ターゲット位置の上下左右を調べる
    for (const dir of directions) {
      const neighborPos = this.board.getAdjacentPos(targetPos, dir);
      const neighborCard = this.board.getCardAt(neighborPos);

      // 隣にカードがあり、かつそれが自分のカードである場合
      if (neighborCard && neighborCard.ownerId === playerId) {
        
        // 「隣のカード」から見て、「ターゲット」はどっちの方角にあるか？
        // 例: ターゲットが(0,0)で、隣(0,-1)を見ている場合、隣から見てターゲットは「下(DOWN)」
        const globalDirToTarget = this.board.getOppositeDir(dir);

        // ★ ここで180度回転を考慮 ★
        // Player2（相手）の場合は、盤面上の「下」は、カードとしての「上矢印」で表現される
        const requiredArrow = this.adjustDirectionForOwner(globalDirToTarget, neighborCard.ownerId);

        // そのカードが、必要な向きの矢印を持っているか？
        if (neighborCard.data.arrows.includes(requiredArrow)) {
          return true;
        }
      }
    }
    return false;
  }

  // ★ プレイヤーによって矢印の意味を変換するヘルパー
  private adjustDirectionForOwner(globalDir: Direction, ownerId: string): Direction {
    // Player2 は180度回転しているので、必要な矢印も反転する
    // (盤面で「下」に伸ばしたいなら、Player2のカードには「上」矢印が必要)
    if (ownerId === 'Player2') {
      switch (globalDir) {
        case 'UP': return 'DOWN';
        case 'DOWN': return 'UP';
        case 'LEFT': return 'RIGHT';
        case 'RIGHT': return 'LEFT';
      }
    }
    // Player1 は盤面通り
    return globalDir;
  }
}