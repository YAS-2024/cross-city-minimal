import { GameMaster } from './GameMaster';
import { GAME_CONFIG } from '../config';
import type { Position } from '../types';

export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';

interface MoveCandidate {
  cardInstanceId: string;
  pos?: Position;
  isDiscard: boolean;
  score?: number;
}

export class AIUtils {
  static async getBestMove(
    realGM: GameMaster, 
    aiPlayerId: string, 
    difficulty: AIDifficulty
  ): Promise<{ cardInstanceId: string, pos: Position } | null> {
    
    const settings = GAME_CONFIG.AI.DIFFICULTY[difficulty];
    const possibleMoves = this.getAllValidMoves(realGM, aiPlayerId);

    // 0. 手がない場合
    if (possibleMoves.length === 0) return null;

    // ★改善A: 候補手が1つ（または捨て札のみ）なら、シミュレーションせず即決
    // （どうせそれを選ぶしかないため、時間の無駄を省く）
    const activeMoves = possibleMoves.filter(m => !m.isDiscard);
    if (activeMoves.length === 0) {
       // 捨て札しか選択肢がないなら、先頭（またはコスト順など）を返す
       return null; 
    }
    if (activeMoves.length === 1 && possibleMoves.length === activeMoves.length) {
       // 配置できる場所が1箇所しかなく、他に選択肢がないなら即決
       return { cardInstanceId: activeMoves[0].cardInstanceId, pos: activeMoves[0].pos! };
    }

    // ★改善B: シミュレーション回数の動的配分
    // 基本回数と、「総リミット ÷ 候補手数」の小さい方を採用する
    // これにより、候補が少ないときは十分な回数を確保しつつ（過剰な網羅は防ぐ）、
    // 候補が多いときは総時間を守るように広く浅く探索する。
    const targetSimulations = Math.min(
      settings.BASE_SIMULATIONS,
      Math.floor(settings.MAX_TOTAL_SIMULATIONS / activeMoves.length)
    );
    
    // 最低でも1回は回す（0回にならないように）
    const actualSimulations = Math.max(1, targetSimulations);

    console.log(`AI: Candidates=${activeMoves.length}, Sims/Move=${actualSimulations} (Total Limit=${settings.MAX_TOTAL_SIMULATIONS})`);

    let bestMove = activeMoves[0];
    let maxAvgScore = -Infinity;

    for (const move of activeMoves) {
      let totalScore = 0;

      for (let i = 0; i < actualSimulations; i++) {
        const clonedGM = realGM.clone();
        clonedGM.randomizeUnknowns(aiPlayerId);

        // 1. 初手実行
        if (move.pos) {
          clonedGM.playCard(aiPlayerId, move.cardInstanceId, move.pos);
        }

        // 2. ターンを進めてランダムプレイアウト
        clonedGM.nextTurn();
        this.runRandomPlayout(clonedGM, settings.DEPTH);

        // 3. 評価
        const myScore = clonedGM.getPlayerScore(aiPlayerId);
        const enemyId = aiPlayerId === 'Player1' ? 'Player2' : 'Player1';
        const enemyScore = clonedGM.getPlayerScore(enemyId);

        totalScore += (myScore - enemyScore * 0.5);
      }

      const avgScore = totalScore / actualSimulations;
      if (avgScore > maxAvgScore) {
        maxAvgScore = avgScore;
        bestMove = move;
      }
    }

    if (!bestMove.pos) return null;
    return { cardInstanceId: bestMove.cardInstanceId, pos: bestMove.pos };
  }

  private static runRandomPlayout(gm: GameMaster, depth: number) {
    let turns = 0;
    
    // ★改善C: 早期終了判定
    // 規定ターン数に達するか、勝者が決まるか、または「両者ともに行動不能（手詰まり）」になったら終了
    while (turns < depth && !gm.winner) {
      const pid = gm.getCurrentPlayerId();
      const moves = this.getAllValidMoves(gm, pid);
      
      // 手があるなら実行
      if (moves.length > 0) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        if (randomMove.isDiscard) {
            gm.discardFromHand(pid, randomMove.cardInstanceId);
        } else if (randomMove.pos) {
            gm.playCard(pid, randomMove.cardInstanceId, randomMove.pos);
        }
      } else {
        // 手がない（パス）
        // もし「相手もパスしていた」ならゲームが進まないので打ち切るロジックも入れられるが、
        // このゲームは山札がある限り進むし、山札切れで終わるので、無限ループの心配は少ない。
        // 単に何もしないでnextTurnへ
      }
      
      gm.nextTurn();
      turns++;

      // 追加の打ち切り判定:
      // 全員の手札がなく、山札もないなら、これ以上プレイしても変わらないので終了
      // (GameMaster側でisFinalRoundなどの判定があるが、ここで明示的に抜けても良い)
      if (gm.deck.length === 0 && this.isAllHandsEmpty(gm)) {
        break;
      }
    }
  }

  private static isAllHandsEmpty(gm: GameMaster): boolean {
    let empty = true;
    gm.players.forEach(p => {
      if (p.getHand().length > 0) empty = false;
    });
    return empty;
  }

  private static getAllValidMoves(gm: GameMaster, playerId: string): MoveCandidate[] {
    const moves: MoveCandidate[] = [];
    const player = gm.players.get(playerId);
    if (!player) return [];
    
    const hand = player.getHand();
    const budget = player.getBudget();
    const { X_MIN, X_MAX, Y_MIN, Y_MAX } = GAME_CONFIG.BOARD;

    hand.forEach(card => {
      if (budget >= card.data.cost) {
        for (let x = X_MIN; x <= X_MAX; x++) {
          for (let y = Y_MIN; y <= Y_MAX; y++) {
            const pos = { x, y };
            // ルール判定
            const check = gm.ruleEngine.canPlaceCard(playerId, pos, budget, card.data.cost);
            if (check.valid) {
              moves.push({
                cardInstanceId: card.instanceId,
                pos: pos,
                isDiscard: false
              });
            }
          }
        }
      }
      moves.push({
        cardInstanceId: card.instanceId,
        isDiscard: true
      });
    });

    return moves;
  }
}