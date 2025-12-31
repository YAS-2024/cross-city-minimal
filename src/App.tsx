import { useState, useEffect, useRef } from 'react';
import { GameMaster, type ActionResult } from './logic/GameMaster';
import { AIUtils } from './logic/AIUtils';
import type { CardData, CardEntity, Position } from './types';
import './App.css';

const ARROW_SYMBOLS: Record<string, string> = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→" };
const formatArrows = (arrows: string[]) => arrows.map(dir => ARROW_SYMBOLS[dir] || dir).join("");

const MOCK_CARDS: CardData[] = [
  { id: "s001", name: "役場", type: "PUBLIC", rarity: "COMMON", cost: 0, stats: { p1: 1, p2: 1, tax: 2 }, arrows: ["UP", "DOWN", "LEFT", "RIGHT"] },
  { id: "c001", name: "アパート", type: "RESIDENTIAL", rarity: "COMMON", cost: 2, stats: { p1: 2, p2: 0, tax: 1 }, arrows: ["UP"] },
  { id: "c002", name: "駅", type: "INFRASTRUCTURE", rarity: "UNCOMMON", cost: 4, stats: { p1: 0, p2: 1, tax: 2 }, arrows: ["LEFT", "RIGHT"] },
  { id: "c003", name: "商店", type: "COMMERCIAL", rarity: "COMMON", cost: 1, stats: { p1: 0, p2: 1, tax: 2 }, arrows: ["DOWN"] }
];

function App() {
  const gmRef = useRef<GameMaster | null>(null);
  
  const [gameMode, setGameMode] = useState<'PvP' | 'PvC' | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState("");
  const [hand, setHand] = useState<CardEntity[]>([]);
  const [boardCards, setBoardCards] = useState<{ pos: Position; card: CardEntity }[]>([]);
  const [deckCount, setDeckCount] = useState(0);
  const [topDiscard, setTopDiscard] = useState<CardEntity | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    Player1: { p1: 0, p2: 0, budget: 0 },
    Player2: { p1: 0, p2: 0, budget: 0 }
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  // ★追加: ラストターン表示用
  const [isFinalRound, setIsFinalRound] = useState(false);

  const startGame = (mode: 'PvP' | 'PvC') => {
    setGameMode(mode);
    const gm = new GameMaster(MOCK_CARDS);
    gm.addPlayer("Player1");
    gm.addPlayer("Player2");
    
    gm.board.placeCard({ instanceId: "p1_hall", ownerId: "Player1", data: MOCK_CARDS[0] }, { x: 0, y: 1 });
    gm.board.placeCard({ instanceId: "p2_hall", ownerId: "Player2", data: MOCK_CARDS[0] }, { x: 0, y: -1 });

    gm.startGame();
    gmRef.current = gm;
    setLogs([]);
    addLog(`ゲーム開始！ モード: ${mode === 'PvP' ? '対人戦' : 'CPU対戦'}`);
    syncState();
  };

  useEffect(() => {
    if (gameMode === 'PvC' && currentPlayerId === 'Player2' && !gameWinner && !isAiThinking) {
      runCpuTurn();
    }
  }, [currentPlayerId, gameMode, gameWinner]);

  const runCpuTurn = async () => {
    if (!gmRef.current) return;
    setIsAiThinking(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const move = AIUtils.getRandomMove(gmRef.current, 'Player2');
    if (move) {
      const result = gmRef.current.playCard('Player2', move.cardInstanceId, move.pos);
      showSystemMessage(result);
    } else {
      const p2Hand = gmRef.current.players.get('Player2')?.getHand() || [];
      if (p2Hand.length > 0) {
        const discardCard = p2Hand[0];
        const result = gmRef.current.discardFromHand('Player2', discardCard.instanceId);
        addLog(`(CPU) ${result.message}`);
      } else {
        addLog("(CPU) 何もできませんでした。");
      }
    }

    syncState();
    await new Promise(resolve => setTimeout(resolve, 800));
    handleEndTurn();
    setIsAiThinking(false);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev]);
  };

  const showSystemMessage = (result: ActionResult) => {
    if (result.success) {
      addLog(result.message);
      setErrorMsg(null);
    } else {
      setErrorMsg(result.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const syncState = () => {
    if (!gmRef.current) return;
    const gm = gmRef.current;
    
    const pid = gm.getCurrentPlayerId();
    const player = gm.players.get(pid);
    
    setCurrentPlayerId(pid);
    setDeckCount(gm.deck.length);
    setTopDiscard(gm.discardPile.length > 0 ? gm.discardPile[gm.discardPile.length - 1] : null);
    setBoardCards(gm.board.getAllCards());
    setGameWinner(gm.winner);
    setIsFinalRound(gm.isFinalRound); // ★同期

    if (pid === 'Player1') {
      if (player) setHand(player.getHand());
    } else {
      if (gameMode === 'PvC' && pid === 'Player2') {
         const p1 = gm.players.get('Player1');
         if(p1) setHand(p1.getHand());
      } else {
        if (player) setHand(player.getHand());
      }
    }

    setStats({
      Player1: gm.getPlayerStats("Player1"),
      Player2: gm.getPlayerStats("Player2")
    });
  };

  const getGuideMessage = () => {
    if (gameWinner) return "ゲーム終了";
    if (gameMode === 'PvC' && currentPlayerId === 'Player2') return "CPUが思考中...";
    
    const budget = stats[currentPlayerId as keyof typeof stats]?.budget || 0;
    
    // ★山札切れ警告
    const finalMsg = isFinalRound ? "【ファイナルラウンド】これが最後のターンです！ " : "";

    return `${finalMsg}${currentPlayerId}の番です。コスト ${budget} までの建物を建設できます。`;
  };

  const handlePlaceCard = (x: number, y: number) => {
    if (gameWinner || (gameMode === 'PvC' && currentPlayerId === 'Player2')) return;
    if (!selectedCardId || !gmRef.current) return;
    const result = gmRef.current.playCard(currentPlayerId, selectedCardId, { x, y });
    showSystemMessage(result);
    if (result.success) {
      setSelectedCardId(null);
      syncState();
    }
  };

  const handleEndTurn = () => {
    if (!gmRef.current) return;
    const result = gmRef.current.nextTurn();
    if (result.success && result.message) {
      addLog(result.message);
    }
    if (gmRef.current.winner) {
      addLog(`勝者決定: ${gmRef.current.winner}`);
    }
    setErrorMsg(null);
    setSelectedCardId(null);
    syncState();
  };

  const handleDiscard = () => {
    if (gameWinner || (gameMode === 'PvC' && currentPlayerId === 'Player2')) return;
    if (!selectedCardId || !gmRef.current) return;
    const result = gmRef.current.discardFromHand(currentPlayerId, selectedCardId);
    showSystemMessage(result);
    if (result.success) {
      setSelectedCardId(null);
      syncState();
    }
  };

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

  if (!gameMode) {
    return (
      <div className="container start-screen">
        <h1>Cross City Minimal</h1>
        <p>対戦モードを選択してください</p>
        <div className="mode-buttons">
          <button onClick={() => startGame('PvP')}>二人で対戦 (PvP)</button>
          <button onClick={() => startGame('PvC')}>コンピュータと対戦 (PvC)</button>
        </div>
      </div>
    );
  }

  if (gameWinner) {
    // ★都市人口の計算
    const p1Score = Math.min(stats.Player1.p1, stats.Player1.p2);
    const p2Score = Math.min(stats.Player2.p1, stats.Player2.p2);

    return (
      <div className="container">
        <h1>ゲーム終了！</h1>
        <h2>勝者: {gameWinner === 'DRAW' ? '引き分け' : gameWinner}</h2>
        <div className="result-stats">
          <div>Player1 都市人口: <strong>{p1Score}</strong> (👤{stats.Player1.p1}, ⚡{stats.Player1.p2})</div>
          <div>Player2 都市人口: <strong>{p2Score}</strong> (👤{stats.Player2.p1}, ⚡{stats.Player2.p2})</div>
          <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>※都市人口 = 人口とインフラの低い方の値</div>
        </div>
        <div className="log-area" style={{height: '200px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px'}}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <button onClick={() => setGameMode(null)} style={{marginTop: '20px', padding: '10px'}}>タイトルに戻る</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className={`status-box ${currentPlayerId === 'Player2' ? 'active' : ''}`}>
          P2 ({gameMode === 'PvC' ? 'CPU' : '相手'}): 👤{stats.Player2.p1} ⚡{stats.Player2.p2} 💰{stats.Player2.budget}
        </div>
        <div className="deck-info">
          山札: {deckCount} | 捨札: {topDiscard ? topDiscard.data.name : "-"}
        </div>
        <div className={`status-box ${currentPlayerId === 'Player1' ? 'active' : ''}`}>
          P1 (あなた): 👤{stats.Player1.p1} ⚡{stats.Player1.p2} 💰{stats.Player1.budget}
        </div>
      </div>

      <div className="message-area">
        {errorMsg ? (
          <div className="error-message">⚠️ {errorMsg}</div>
        ) : (
          <div className="guide-message">ℹ️ {getGuideMessage()}</div>
        )}
      </div>

      <div className="main-area">
        <div className="board-area">{renderGrid()}</div>
      </div>

      <div className="log-container">
        <div className="log-title">ログ</div>
        <div className="log-list">
          {logs.map((l, i) => <div key={i} className="log-item">{l}</div>)}
        </div>
      </div>

      <div className="control-area">
        <button 
          onClick={handleEndTurn} 
          disabled={gameMode === 'PvC' && currentPlayerId === 'Player2'}
        >
          ターン終了
        </button>
        <button 
          onClick={handleDiscard} 
          disabled={!selectedCardId || (gameMode === 'PvC' && currentPlayerId === 'Player2')}
        >
          捨てて+2金
        </button>
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