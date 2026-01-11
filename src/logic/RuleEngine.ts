import { BoardModel } from '../models/BoardModel';
import { GAME_CONFIG } from '../config'; // ★追加
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
    
    // ★修正: 盤面範囲チェック (5x6対応)
    if (pos.x < GAME_CONFIG.BOARD.X_MIN || pos.x > GAME_CONFIG.BOARD.X_MAX ||
        pos.y < GAME_CONFIG.BOARD.Y_MIN || pos.y > GAME_CONFIG.BOARD.Y_MAX) {
      return { valid: false, reason: '盤面の範囲外です' };
    }

    if (!this.board.isEmpty(pos)) {
      return { valid: false, reason: '既にカードがあります' };
    }

    if (currentBudget < cardCost) {
      return { valid: false, reason: '予算が足りません' };
    }

    if (!this.hasValidConnection(pos, playerId)) {
      return { valid: false, reason: '自分のカードの矢印がつながっていません' };
    }

    return { valid: true };
  }

  private hasValidConnection(targetPos: Position, playerId: string): boolean {
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

    for (const dir of directions) {
      const neighborPos = this.board.getAdjacentPos(targetPos, dir);
      const neighborCard = this.board.getCardAt(neighborPos);

      if (neighborCard && neighborCard.ownerId === playerId) {
        const globalDirToTarget = this.board.getOppositeDir(dir);
        const requiredArrow = this.adjustDirectionForOwner(globalDirToTarget, neighborCard.ownerId);

        if (neighborCard.data.arrows.includes(requiredArrow)) {
          return true;
        }
      }
    }
    return false;
  }

  private adjustDirectionForOwner(globalDir: Direction, ownerId: string): Direction {
    if (ownerId === 'Player2') {
      switch (globalDir) {
        case 'UP': return 'DOWN';
        case 'DOWN': return 'UP';
        case 'LEFT': return 'RIGHT';
        case 'RIGHT': return 'LEFT';
      }
    }
    return globalDir;
  }
}