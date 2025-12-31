import { useState, useEffect, useRef } from 'react';
import { GameMaster } from './logic/GameMaster';
import type { CardData, CardEntity, Position } from './types';
import './App.css';

// --- 定数・ヘルパー ---
const ARROW_SYMBOLS: Record<string, string> = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→" };
const formatArrows = (arrows: string[]) => arrows.map(dir => ARROW_SYMBOLS[dir] || dir).join("");

// モックデータ
const MOCK_CARDS: CardData[] = [
  { id: "s001", name: "役場", type: "PUBLIC", rarity: "COMMON", cost: 0, stats: { p1: 1, p2: 1, tax: 2 }, arrows: ["UP", "DOWN", "LEFT", "RIGHT"] },
  { id: "c001", name: "アパート", type: "RESIDENTIAL", rarity: "COMMON", cost: 2, stats: { p1: 2, p2: 0, tax: 1 }, arrows: ["UP"] },
  { id: "c002", name: "駅", type: "INFRASTRUCTURE", rarity: "UNCOMMON", cost: 4, stats: { p1: 0, p2: 1, tax: 2 }, arrows: ["LEFT", "RIGHT"] },
  { id: "c003", name: "商店", type: "COMMERCIAL", rarity: "COMMON", cost: 1, stats: { p1: 0, p2: 1, tax: 2 }, arrows: ["DOWN"] }
];

function App() {
  const gmRef = useRef<GameMaster | null>(null);
  
  // State
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [hand, setHand] = useState<CardEntity[]>([]);
  const [boardCards, setBoardCards] = useState<{ pos: Position; card: CardEntity }[]>([]);
  const [deckCount, setDeckCount] = useState(0);
  const [topDiscard, setTopDiscard] = useState<CardEntity | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [log, setLog] = useState<string>("ゲーム開始");
  const [stats, setStats] = useState({
    Player1: { p1: 0, p2: 0, budget: 0 },
    Player2: { p1: 0, p2: 0, budget: 0 }
  });

  useEffect(() => {
    const gm = new GameMaster(MOCK_CARDS);
    gm.addPlayer("Player1");
    gm.addPlayer("Player2");
    
    // 初期配置
    gm.board.placeCard({ instanceId: "p1_hall", ownerId: "Player1", data: MOCK_CARDS[0] }, { x: 0, y: 1 });
    gm.board.placeCard({ instanceId: "p2_hall", ownerId: "Player2", data: MOCK_CARDS[0] }, { x: 0, y: -1 });

    gm.startGame();
    gmRef.current = gm;
    syncState();
  }, []);

  const syncState = () => {
    if (!gmRef.current) return;
    const gm = gmRef.current;
    const pid = gm.getCurrentPlayerId();
    const player = gm.players.get(pid);
    
    setCurrentPlayerId(pid);
    setDeckCount(gm.deck.length);
    setTopDiscard(gm.discardPile.length > 0 ? gm.discardPile[gm.discardPile.length - 1] : null);
    setBoardCards(gm.board.getAllCards());

    if (player) setHand(player.getHand());

    setStats({
      Player1: gm.getPlayerStats("Player1"),
      Player2: gm.getPlayerStats("Player2")
    });
  };

  const handlePlaceCard = (x: number, y: number) => {
    if (!selectedCardId || !gmRef.current) return;
    const result = gmRef.current.playCard(currentPlayerId, selectedCardId, { x, y });
    if (result) {
      setLog(`${currentPlayerId}: 配置成功 (${x}, ${y})`);
      setSelectedCardId(null);
      syncState();
    } else {
      setLog("配置失敗");
    }
  };

  const handleEndTurn = () => {
    if (!gmRef.current) return;
    gmRef.current.nextTurn();
    setLog(`ターン終了`);
    setSelectedCardId(null);
    syncState();
  };

  const handleDiscard = () => {
    if (!selectedCardId || !gmRef.current) return;
    gmRef.current.discardFromHand(currentPlayerId, selectedCardId);
    setLog(`カードを捨てて予算+2`);
    setSelectedCardId(null);
    syncState();
  };

  // 盤面グリッド
  const renderGrid = () => {
    const grid = [];
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        const placed = boardCards.find(c => c.pos.x === x && c.pos.y === y);
        grid.push(
          <div key={`${x},${y}`} className="grid-cell" onClick={() => handlePlaceCard(x, y)}>
            {placed ? (
              <div className={`card-on-board type-${placed.card.data.type} owner-${placed.card.ownerId}`}>
                <div className="board-card-name">{placed.card.data.name}</div>
                {/* 盤面では数値を極小で表示 */}
                <div className="board-card-stats">
                  👤{placed.card.data.stats.p1} ⚡{placed.card.data.stats.p2} 💰{placed.card.data.stats.tax}
                </div>
                <div className="board-card-arrow">{formatArrows(placed.card.data.arrows)}</div>
              </div>
            ) : <div className="empty-cell" />}
          </div>
        );
      }
    }
    return grid;
  };

  return (
    <div className="container">
      {/* 上部ステータスバー（ここだけは見やすいように残します） */}
      <div className="header">
        <div className={`status-box ${currentPlayerId === 'Player2' ? 'active' : ''}`}>
          P2 (相手): 👤{stats.Player2.p1} ⚡{stats.Player2.p2} 💰{stats.Player2.budget}
        </div>
        <div className="deck-info">
          山札: {deckCount} | 捨札: {topDiscard ? topDiscard.data.name : "-"}
        </div>
        <div className={`status-box ${currentPlayerId === 'Player1' ? 'active' : ''}`}>
          P1 (自分): 👤{stats.Player1.p1} ⚡{stats.Player1.p2} 💰{stats.Player1.budget}
        </div>
      </div>

      <div className="main-area">
        <div className="board-area">{renderGrid()}</div>
      </div>

      <div className="control-area">
        <div>{log}</div>
        <button onClick={handleEndTurn}>ターン終了</button>
        <button onClick={handleDiscard} disabled={!selectedCardId}>捨てて+2金</button>
      </div>

      <div className="hand-area">
        {hand.map(card => (
          <div 
            key={card.instanceId} 
            className={`hand-card ${selectedCardId === card.instanceId ? 'selected' : ''}`}
            onClick={() => setSelectedCardId(card.instanceId)}
          >
            <div className="hand-cost-badge">{card.data.cost}</div>
            <div className="hand-card-name">{card.data.name}</div>
            <div className="hand-card-stats">
              <span>👤{card.data.stats.p1}</span>
              <span>⚡{card.data.stats.p2}</span>
              <span>💰{card.data.stats.tax}</span>
            </div>
            <div className="hand-card-arrow">{formatArrows(card.data.arrows)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;